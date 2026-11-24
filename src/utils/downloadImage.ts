import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Normalizes any image data URL into a valid PNG data URL using an offscreen canvas
 * when the source MIME is not already image/png.
 */
async function ensurePngDataUrl(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith('data:image/png;base64,')) {
    return dataUrl;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('PNG dönüştürme için görsel yüklenemedi'));
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas oluşturulamadı');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export interface SaveImageResult {
  method: 'android-documents' | 'android-share' | 'web-download';
  locationLabel: string;
}

/**
 * Downloads the generated PNG image cleanly on both Android Capacitor WebView and Web/PWA.
 */
export async function downloadPngImage(
  dataUrl: string,
  filename: string
): Promise<SaveImageResult> {
  const safeFilename = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
  const pngDataUrl = await ensurePngDataUrl(dataUrl);
  const pureBase64 = pngDataUrl.split(',')[1] ?? '';

  if (Capacitor.isNativePlatform()) {
    try {
      const targetPath = `EC-Medya-Studyo/${safeFilename}`;
      await Filesystem.writeFile({
        path: targetPath,
        data: pureBase64,
        directory: Directory.Documents,
        recursive: true,
      });

      return {
        method: 'android-documents',
        locationLabel: `Belgeler/EC-Medya-Studyo/${safeFilename}`,
      };
    } catch {
      // Fallback to Cache + native Share sheet if scoped Documents write is restricted
      const cached = await Filesystem.writeFile({
        path: safeFilename,
        data: pureBase64,
        directory: Directory.Cache,
        recursive: true,
      });
      await Share.share({
        title: safeFilename,
        files: [cached.uri],
        dialogTitle: 'Görseli Kaydet veya Paylaş',
      });
      return {
        method: 'android-share',
        locationLabel: safeFilename,
      };
    }
  }

  const blob = dataUrlToBlob(pngDataUrl);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = safeFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);

  return {
    method: 'web-download',
    locationLabel: safeFilename,
  };
}

/**
 * Shares the generated PNG image via Android native Share sheet or Web Share API.
 */
export async function sharePngImage(
  dataUrl: string,
  filename: string,
  title: string
): Promise<void> {
  const safeFilename = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
  const pngDataUrl = await ensurePngDataUrl(dataUrl);
  const pureBase64 = pngDataUrl.split(',')[1] ?? '';

  if (Capacitor.isNativePlatform()) {
    const cached = await Filesystem.writeFile({
      path: safeFilename,
      data: pureBase64,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title,
      text: 'Emre ÇELİK Danışmanlık Hizmeti',
      files: [cached.uri],
      dialogTitle: 'Görseli Paylaş',
    });
    return;
  }

  const blob = dataUrlToBlob(pngDataUrl);
  const file = new File([blob], safeFilename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title,
      text: 'Emre ÇELİK Danışmanlık Hizmeti',
      files: [file],
    });
    return;
  }

  await downloadPngImage(pngDataUrl, safeFilename);
}

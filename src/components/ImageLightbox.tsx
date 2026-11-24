import { Download, Share2, X } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  title: string;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function ImageLightbox({
  imageUrl,
  title,
  onClose,
  onDownload,
  onShare,
}: ImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#05070B]/95 backdrop-blur-xl safe-top safe-bottom"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="truncate pr-3 text-sm font-semibold text-[#F5F7FA]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="btn-glass-3d flex h-9 w-9 items-center justify-center rounded-xl text-[#F5F7FA]"
          aria-label="Önizlemeyi kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={onClose}>
        <img
          src={imageUrl}
          alt={title}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[76dvh] w-auto max-w-full rounded-2xl border border-[#1D63ED]/40 object-contain shadow-[0_24px_60px_rgba(0,0,0,0.9)]"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onDownload}
          className="btn-cobalt-3d flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4" />
          Telefona İndir (PNG)
        </button>
        <button
          type="button"
          onClick={onShare}
          className="btn-glass-3d flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-[#F5F7FA]"
        >
          <Share2 className="h-4 w-4" />
          Paylaş
        </button>
      </div>
    </div>
  );
}

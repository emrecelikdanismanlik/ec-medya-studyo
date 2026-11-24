import { GoogleGenAI } from '@google/genai';
import { BRAND_NAME, BRAND_PHONE, BRAND_SLOGANS, BRAND_WEBSITE } from '../data/themes';
import type {
  AspectRatio,
  DayTheme,
  FramingMode,
  ImageModelId,
  ImageSizeId,
  LogoAsset,
  PlatformConfig,
  ProductionBrief,
  ProfilePhotoAsset,
  SlideBrief,
  VerifiedDailyData,
  VerifiedSource,
} from '../types/studio';
import { buildMasterImagePrompt } from './promptBuilder';

const TEXT_RESEARCH_MODEL = 'gemini-4-hydrogen';

function createClient(apiKey: string): GoogleGenAI {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error(
      'Google Gemini API Key eksik. Sağ üstteki Marka Kasası / Ayarlar simgesinden anahtarınızı girin.'
    );
  }
  return new GoogleGenAI({ apiKey: trimmed });
}

function extractJsonObject<T>(rawText: string | undefined): T {
  if (!rawText) {
    throw new Error('Model yanıtı boş döndü.');
  }

  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('Modelden geçerli JSON yanıtı alınamadı.');
  }
}

function extractCitationsFromInteraction(interaction: {
  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      annotations?: Array<{
        type?: string;
        title?: string;
        url?: string;
      }>;
    }>;
  }>;
}): VerifiedSource[] {
  const seen = new Set<string>();
  const results: VerifiedSource[] = [];

  for (const step of interaction.steps ?? []) {
    if (step.type !== 'model_output') continue;
    for (const block of step.content ?? []) {
      if (block.type !== 'text') continue;
      for (const ann of block.annotations ?? []) {
        if (ann.type === 'url_citation' && ann.url && !seen.has(ann.url)) {
          seen.add(ann.url);
          results.push({
            title: ann.title?.trim() || ann.url,
            url: ann.url,
          });
        }
      }
    }
  }
  return results;
}

function formatGeminiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('401')) {
    return new Error('Gemini API anahtarı geçersiz görünüyor. Marka Kasası ayarlarından kontrol edin.');
  }
  if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return new Error('Gemini API kota veya hız sınırına ulaşıldı. Lütfen kısa süre sonra tekrar deneyin.');
  }
  if (lower.includes('403') || lower.includes('permission')) {
    return new Error('Bu API anahtarının ilgili Gemini modeline erişim izni bulunmuyor.');
  }
  return error instanceof Error ? error : new Error(message);
}

/**
 * Verifies the user's Gemini API key with a minimal request.
 */
export async function testGeminiConnection(apiKey: string): Promise<string> {
  try {
    const ai = createClient(apiKey);
    const interaction = await ai.interactions.create({
      model: TEXT_RESEARCH_MODEL,
      input: 'Yanıt olarak yalnızca "BAĞLANTI BAŞARILI" yaz.',
      store: false,
    });
    return interaction.output_text?.trim() || 'BAĞLANTI BAŞARILI';
  } catch (err) {
    throw formatGeminiError(err);
  }
}

const VERIFIED_DATA_SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description: 'Günün temasıyla uyumlu doğrulanmış kısa Türkçe manşet.',
    },
    summary: {
      type: 'string',
      description: 'Doğrulanmış güncel web araştırmasına dayalı 2-3 cümlelik özet.',
    },
    metrics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
          sourceName: { type: 'string' },
          dateContext: { type: 'string' },
        },
        required: ['label', 'value', 'sourceName', 'dateContext'],
      },
    },
    keyFindings: {
      type: 'array',
      items: { type: 'string' },
    },
    suggestedSources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
        },
        required: ['title', 'url'],
      },
    },
  },
  required: ['headline', 'summary', 'metrics', 'keyFindings'],
};

interface VerifiedDataRawPayload {
  headline: string;
  summary: string;
  metrics: Array<{
    label: string;
    value: string;
    sourceName: string;
    dateContext: string;
  }>;
  keyFindings: string[];
  suggestedSources?: Array<{ title: string; url: string }>;
}

/**
 * Fetches live, grounded Turkish & global data for the active day theme via Gemini Google Search Grounding.
 */
export async function verifyDailyThemeData(
  apiKey: string,
  theme: DayTheme,
  dateLabel: string,
  dateKey: string,
  customTopic?: string
): Promise<VerifiedDailyData> {
  try {
    const ai = createClient(apiKey);

    const prompt = `Bugünün tarihi (UTC+3 İstanbul): ${dateLabel} (${dateKey}).
Aktif Gün Teması: ${theme.dayName} — ${theme.title}
Alt Başlık: ${theme.subtitle}
Öncelikli Resmi / Yetkili Kaynaklar: ${theme.authorities.join(', ')}
Araştırma Odağı: ${theme.researchPromptFocus}
${customTopic?.trim() ? `Kullanıcı Özel Odak / Konu Talebi: ${customTopic.trim()}` : ''}

GÖREV:
Google Search aracını kullanarak yukarıdaki tema ve otorite kaynaklardan en güncel, doğrulanmış gerçek verileri araştır.
KESİN KURALLAR:
1. Yalnızca arama sonuçlarında gördüğün gerçek, doğrulanmış rakam ve düzenlemeleri yaz; kesinlikle sayı uydurma.
2. Kesin kazanç veya garantili getiri iddiası yazma.
3. Tüm alanları kusursuz, imla hatasız kurumsal Türkçe ile doldur.
4. En az 3 doğrulanmış metrik/gösterge (metrics) ve 3 stratejik bulgu (keyFindings) çıkar.`;

    const interaction = await ai.interactions.create({
      model: TEXT_RESEARCH_MODEL,
      input: prompt,
      tools: [{ type: 'google_search' }],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: VERIFIED_DATA_SCHEMA,
      },
      store: false,
    });

    const parsed = extractJsonObject<VerifiedDataRawPayload>(interaction.output_text);
    const citationSources = extractCitationsFromInteraction(interaction);

    const mergedSourcesMap = new Map<string, VerifiedSource>();
    for (const s of citationSources) {
      mergedSourcesMap.set(s.url, s);
    }
    for (const s of parsed.suggestedSources ?? []) {
      if (s.url && s.url.startsWith('http') && !mergedSourcesMap.has(s.url)) {
        mergedSourcesMap.set(s.url, { title: s.title || s.url, url: s.url });
      }
    }

    return {
      dayId: theme.dayId,
      dateKey,
      fetchedAt: Date.now(),
      headline: parsed.headline,
      summary: parsed.summary,
      metrics: (parsed.metrics ?? []).slice(0, 5),
      keyFindings: (parsed.keyFindings ?? []).slice(0, 5),
      sources: Array.from(mergedSourcesMap.values()).slice(0, 8),
    };
  } catch (err) {
    throw formatGeminiError(err);
  }
}

const SLIDE_SCHEMA = {
  type: 'object',
  properties: {
    slideNumber: { type: 'integer' },
    roleTitle: { type: 'string' },
    headline: { type: 'string' },
    subheadline: { type: 'string' },
    statHighlight: { type: 'string' },
    visualDirection: { type: 'string' },
  },
  required: ['slideNumber', 'roleTitle', 'headline', 'subheadline', 'visualDirection'],
};

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    cover: SLIDE_SCHEMA,
    slides: {
      type: 'array',
      items: SLIDE_SCHEMA,
    },
    socialCaption: {
      type: 'string',
      description:
        'Platform algoritmasına özel, kurumsal otorite tonunda, imla hatasız Türkçe paylaşım metni ve resmi iletişim bloğu.',
    },
    hashtags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['cover', 'slides', 'socialCaption', 'hashtags'],
};

interface BriefRawPayload {
  cover: SlideBrief;
  slides: SlideBrief[];
  socialCaption: string;
  hashtags: string[];
}

/**
 * Generates grounded Turkish headlines, visual directions, 5-panel (or 2-panel banner) carousel arc,
 * and platform-algorithm-tuned social caption + hashtags.
 */
export async function generatePlatformBrief(params: {
  apiKey: string;
  platform: PlatformConfig;
  theme: DayTheme;
  verifiedData: VerifiedDailyData;
  aspectRatio: AspectRatio;
  customFocus?: string;
}): Promise<ProductionBrief> {
  const { apiKey, platform, theme, verifiedData, aspectRatio, customFocus } = params;

  try {
    const ai = createClient(apiKey);
    const slideCount = platform.carouselCount;

    const slideRoleSpec = platform.isBannerSeries
      ? `2 Panelli Yatay Banner Carousel Kurgusu:
- Slayt 1 (1/2): Ana Değer Önerisi, Çarpıcı Başlık & Doğrulanmış Veri Kancası
- Slayt 2 (2/2): Stratejik Çözüm, Resmi EÇ Logosu, Slogan ve CTA (${BRAND_PHONE} | ${BRAND_WEBSITE})`
      : `5 Panelli Carousel Hikâye Kurgusu:
- Slayt 1: Çarpıcı Başlık & Kanca
- Slayt 2: Doğrulanmış Güncel Veri / Sorun
- Slayt 3: Stratejik Analiz & Yaklaşım
- Slayt 4: Uygulanabilir Çözüm / Öneri
- Slayt 5: Kurumsal İmza, Resmi Logo, Slogan ve CTA (${BRAND_PHONE} | ${BRAND_WEBSITE})`;

    const prompt = `Sen "${BRAND_NAME}" baş kreatif direktörü ve stratejik iletişim uzmanısın.

PLATFORM: ${platform.name} (${platform.description})
HEDEF ORAN: ${aspectRatio}
GÜNÜN TEMASI: ${theme.dayName} — ${theme.title}
ÖNERİLEN MARKA SLOGANLARI:
${BRAND_SLOGANS.map((s) => `- ${s}`).join('\n')}
${customFocus?.trim() ? `ÖZEL ODAK NOTU: ${customFocus.trim()}` : ''}

DOĞRULANMIŞ GÜNCEL VERİ ÖZETİ:
Başlık: ${verifiedData.headline}
Özet: ${verifiedData.summary}
Metrikler:
${verifiedData.metrics.map((m) => `- ${m.label}: ${m.value} (${m.sourceName}, ${m.dateContext})`).join('\n')}
Bulgular:
${verifiedData.keyFindings.map((k) => `- ${k}`).join('\n')}

GÖREV:
1. "cover" için tek başına çarpıcı, görsel üzerinde net okunabilecek kısa Türkçe başlık (maksimum 6-8 kelime) ve öz alt başlık üret.
2. "slides" dizisi içinde TAM ${slideCount} adet slayt üret. Kurgu sırası:
${slideRoleSpec}
3. Her görsel üzerindeki metin kısa, vurucu ve kusursuz Türkçe imlalı olmalı (Ç, Ğ, İ, Ö, Ş, Ü harfleri eksiksiz). Görsel sanat yönlendirmesi (visualDirection) ise İngilizce sahne tarifi olarak yazılmalı.
4. Kesinlikle doğrulanmamış yeni sayı uydurma; yalnızca yukarıdaki metriklerdeki gerçek rakamları kullan. Kesin kazanç / garantili getiri ifadesi YASAKTIR.
5. "socialCaption": ${
      platform.hasSocialCopy
        ? `${platform.name} algoritmasına uygun (kanca ilk satır + değer özeti + yapılandırılmış maddeler + CTA: ${BRAND_PHONE} | ${BRAND_WEBSITE}) profesyonel Türkçe paylaşım metni yaz.`
        : `Kısa durum/kanal paylaşım notu ve resmi imza (${BRAND_NAME} | ${BRAND_PHONE} | ${BRAND_WEBSITE}) yaz.`
    }
6. "hashtags": 8 ila 12 adet yüksek erişimli, Türkçe ve sektörel #etiket üret (#EmreCelikDanismanlik dahil).`;

    const interaction = await ai.interactions.create({
      model: TEXT_RESEARCH_MODEL,
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: BRIEF_SCHEMA,
      },
      store: false,
    });

    const parsed = extractJsonObject<BriefRawPayload>(interaction.output_text);
    const normalizedSlides = (parsed.slides ?? []).slice(0, slideCount).map((s, idx) => ({
      ...s,
      slideNumber: idx + 1,
    }));

    return {
      platformId: platform.id,
      dayId: theme.dayId,
      aspectRatio,
      generatedAt: Date.now(),
      cover: {
        ...parsed.cover,
        slideNumber: 0,
        roleTitle: parsed.cover?.roleTitle || platform.coverLabel,
      },
      slides: normalizedSlides,
      socialCaption:
        parsed.socialCaption ||
        `${verifiedData.headline}\n\n${verifiedData.summary}\n\n${BRAND_NAME}\n${BRAND_PHONE} | ${BRAND_WEBSITE}`,
      hashtags: (parsed.hashtags ?? []).map((t) => (t.startsWith('#') ? t : `#${t}`)),
    };
  } catch (err) {
    throw formatGeminiError(err);
  }
}

/**
 * Generates a single image asset using Gemini Nano Banana 2.1 (or Gemini 3 Pro Image)
 * with mandatory official EÇ logo attachment and optional %100 Face Identity Lock reference photos.
 */
export async function generateVisualImage(params: {
  apiKey: string;
  imageModel: ImageModelId;
  imageSize: ImageSizeId;
  platform: PlatformConfig;
  theme: DayTheme;
  ratio: AspectRatio;
  slide: SlideBrief;
  isCover: boolean;
  totalSlides: number;
  verifiedData: VerifiedDailyData | null;
  logo: LogoAsset;
  useProfilePhoto: boolean;
  framingMode: FramingMode;
  profilePhotos: ProfilePhotoAsset[];
}): Promise<{ dataUrl: string; mimeType: string; promptUsed: string }> {
  const {
    apiKey,
    imageModel,
    imageSize,
    platform,
    theme,
    ratio,
    slide,
    isCover,
    totalSlides,
    verifiedData,
    logo,
    useProfilePhoto,
    framingMode,
    profilePhotos,
  } = params;

  try {
    const ai = createClient(apiKey);

    const promptText = buildMasterImagePrompt({
      platform,
      theme,
      ratio,
      slide,
      isCover,
      totalSlides,
      verifiedData,
      useProfilePhoto: useProfilePhoto && profilePhotos.length > 0,
      framingMode,
    });

    const inputParts: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; mime_type: string; data: string }
    > = [
      { type: 'text', text: promptText },
      {
        type: 'text',
        text: 'REFERENCE IMAGE 1 — OFFICIAL BRAND LOGO (TEK RESMİ LOGO KİLİDİ): Use ONLY this exact 3D metallic cobalt-blue circular EÇ logo.',
      },
      {
        type: 'image',
        mime_type: logo.mimeType,
        data: logo.base64,
      },
    ];

    if (useProfilePhoto && profilePhotos.length > 0) {
      // Nano Banana 2.1 supports up to 4 character reference images cleanly
      const selectedRefs = profilePhotos.slice(0, 3);
      inputParts.push({
        type: 'text',
        text: `REFERENCE PERSON IMAGE(S) — %100 YÜZ KİMLİĞİ KİLİDİ: Keep this exact person's face, eyes, glasses, beard, and likeness 100% identical. Only adapt attire to tailored navy/anthracite blazer over white t-shirt and apply ${framingMode} framing.`,
      });
      for (const photo of selectedRefs) {
        inputParts.push({
          type: 'image',
          mime_type: photo.mimeType,
          data: photo.base64,
        });
      }
    }

    const interaction = await ai.interactions.create({
      model: imageModel,
      input: inputParts,
      response_format: {
        type: 'image',
        mime_type: 'image/png',
        aspect_ratio: ratio,
        image_size: imageSize,
      },
      store: false,
    });

    let base64Data = interaction.output_image?.data;
    let outMime = interaction.output_image?.mime_type || 'image/png';

    if (!base64Data && interaction.steps) {
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          for (const block of step.content ?? []) {
            if (block.type === 'image' && block.data) {
              base64Data = block.data;
              outMime = block.mime_type || 'image/png';
            }
          }
        }
      }
    }

    if (!base64Data) {
      throw new Error('Görsel üretimi tamamlandı ancak API yanıtında görsel verisi bulunamadı.');
    }

    return {
      dataUrl: `data:${outMime};base64,${base64Data}`,
      mimeType: outMime,
      promptUsed: promptText,
    };
  } catch (err) {
    throw formatGeminiError(err);
  }
}

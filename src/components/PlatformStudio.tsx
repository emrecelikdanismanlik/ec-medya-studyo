import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Hash,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Loader2,
  Maximize2,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  generatePlatformBrief,
  generateVisualImage,
} from '../services/geminiService';
import type {
  AspectRatio,
  DayTheme,
  FramingMode,
  GeneratedImageAsset,
  LogoAsset,
  PlatformConfig,
  ProductionBrief,
  ProfilePhotoAsset,
  SlideBrief,
  StudioSettings,
  VerifiedDailyData,
  VisualSlotKey,
} from '../types/studio';
import { copyToClipboard } from '../utils/clipboard';
import { downloadPngImage, sharePngImage } from '../utils/downloadImage';

interface PlatformStudioProps {
  platform: PlatformConfig;
  theme: DayTheme;
  dateKey: string;
  settings: StudioSettings;
  logo: LogoAsset | null;
  profilePhotos: ProfilePhotoAsset[];
  verifiedData: VerifiedDailyData | null;
  isVerifying: boolean;
  onVerifyDailyData: (customTopic?: string) => Promise<VerifiedDailyData | null>;
  onBack: () => void;
  onOpenVault: () => void;
  onInspectImage: (imageUrl: string, title: string, slot: VisualSlotKey) => void;
  onNotify: (kind: 'success' | 'error' | 'info', text: string) => void;
}

const FRAMING_OPTIONS: Array<{ id: FramingMode; label: string }> = [
  { id: 'portrait', label: 'Portre' },
  { id: 'waist-up', label: 'Belden Yukarı' },
  { id: 'full-body', label: 'Tam Boy' },
];

const ASPECT_CONTAINER_CLASS: Record<AspectRatio, string> = {
  '9:16': 'aspect-[9/16] max-w-[300px] mx-auto',
  '4:5': 'aspect-[4/5] max-w-[340px] mx-auto',
  '16:9': 'aspect-video w-full',
};

export function PlatformStudio({
  platform,
  theme,
  dateKey,
  settings,
  logo,
  profilePhotos,
  verifiedData,
  isVerifying,
  onVerifyDailyData,
  onBack,
  onOpenVault,
  onInspectImage,
  onNotify,
}: PlatformStudioProps) {
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(platform.defaultRatio);
  const [activeTab, setActiveTab] = useState<'cover' | 'carousel'>('cover');
  const [customFocus, setCustomFocus] = useState('');
  const [useProfilePhoto, setUseProfilePhoto] = useState(profilePhotos.length > 0);
  const [framingMode, setFramingMode] = useState<FramingMode>('waist-up');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(
    () => profilePhotos.find((p) => p.isDefault)?.id ?? profilePhotos[0]?.id ?? ''
  );

  const [briefMap, setBriefMap] = useState<Record<string, ProductionBrief>>({});
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [images, setImages] = useState<Record<string, GeneratedImageAsset>>({});
  const [loadingSlots, setLoadingSlots] = useState<Record<string, boolean>>({});
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [copiedField, setCopiedField] = useState<'caption' | 'hashtags' | null>(null);

  const autoVerifyAttemptedRef = useRef<string>('');
  const autoCoverAttemptedRef = useRef<string>('');

  // Keep selected profile photo synced when Vault photos change
  useEffect(() => {
    if (profilePhotos.length === 0) {
      setUseProfilePhoto(false);
      setSelectedPhotoId('');
      return;
    }
    const exists = profilePhotos.some((p) => p.id === selectedPhotoId);
    if (!exists) {
      const def = profilePhotos.find((p) => p.isDefault) ?? profilePhotos[0];
      setSelectedPhotoId(def.id);
      setFramingMode(def.framing);
    }
  }, [profilePhotos, selectedPhotoId]);

  // Reset ratio if platform changes
  useEffect(() => {
    setActiveRatio(platform.defaultRatio);
    setActiveTab('cover');
  }, [platform]);

  const activeBriefKey = `${platform.id}_${theme.dayId}_${activeRatio}`;
  const currentBrief = briefMap[activeBriefKey] ?? null;

  const selectedPhotosForGeneration = useMemo(() => {
    if (!useProfilePhoto || profilePhotos.length === 0) return [];
    const primary = profilePhotos.find((p) => p.id === selectedPhotoId);
    if (!primary) return profilePhotos;
    return [primary, ...profilePhotos.filter((p) => p.id !== primary.id)];
  }, [useProfilePhoto, profilePhotos, selectedPhotoId]);

  // Auto-trigger Google Search Grounding on screen open when API key is configured
  useEffect(() => {
    const attemptKey = `${platform.id}_${theme.dayId}_${dateKey}`;
    if (
      settings.apiKey.trim() &&
      !verifiedData &&
      !isVerifying &&
      autoVerifyAttemptedRef.current !== attemptKey
    ) {
      autoVerifyAttemptedRef.current = attemptKey;
      void onVerifyDailyData();
    }
  }, [platform.id, theme.dayId, dateKey, settings.apiKey, verifiedData, isVerifying, onVerifyDailyData]);

  const ensureBrief = useCallback(
    async (forceRefresh = false): Promise<ProductionBrief | null> => {
      if (!forceRefresh && briefMap[activeBriefKey]) {
        return briefMap[activeBriefKey];
      }

      if (!settings.apiKey.trim()) {
        onNotify('error', 'Üretim için önce Marka Kasası üzerinden Gemini API Key girin.');
        onOpenVault();
        return null;
      }

      let dataToUse = verifiedData;
      if (!dataToUse) {
        dataToUse = await onVerifyDailyData(customFocus);
        if (!dataToUse) return null;
      }

      setGeneratingBrief(true);
      try {
        const brief = await generatePlatformBrief({
          apiKey: settings.apiKey,
          platform,
          theme,
          verifiedData: dataToUse,
          aspectRatio: activeRatio,
          customFocus,
        });
        setBriefMap((prev) => ({ ...prev, [activeBriefKey]: brief }));
        return brief;
      } catch (err) {
        onNotify(
          'error',
          err instanceof Error ? err.message : 'İçerik kurgusu üretilemedi.'
        );
        return null;
      } finally {
        setGeneratingBrief(false);
      }
    },
    [
      activeBriefKey,
      activeRatio,
      briefMap,
      customFocus,
      onNotify,
      onOpenVault,
      onVerifyDailyData,
      platform,
      settings.apiKey,
      theme,
      verifiedData,
    ]
  );

  const imageStorageKey = (slot: VisualSlotKey, ratio: AspectRatio) =>
    `${platform.id}_${theme.dayId}_${ratio}_${slot}`;

  const generateSingleSlot = useCallback(
    async (slot: VisualSlotKey, ratio: AspectRatio, briefOverride?: ProductionBrief) => {
      if (!settings.apiKey.trim()) {
        onNotify('error', 'Görsel üretimi için Marka Kasası’na API Key ekleyin.');
        onOpenVault();
        return;
      }
      if (!logo) {
        onNotify('error', 'Resmi EÇ logosu henüz yüklenmedi.');
        return;
      }

      const brief = briefOverride ?? (await ensureBrief(false));
      if (!brief) return;

      const isCover = slot === 'cover';
      const slideIndex = isCover ? 0 : Number(slot.split('-')[1]) - 1;
      const slideObj: SlideBrief | undefined = isCover
        ? brief.cover
        : brief.slides[slideIndex];

      if (!slideObj) {
        onNotify('error', 'İlgili slayt metni bulunamadı.');
        return;
      }

      const key = imageStorageKey(slot, ratio);
      setLoadingSlots((prev) => ({ ...prev, [key]: true }));

      try {
        const result = await generateVisualImage({
          apiKey: settings.apiKey,
          imageModel: settings.imageModel,
          imageSize: settings.imageSize,
          platform,
          theme,
          ratio,
          slide: slideObj,
          isCover,
          totalSlides: platform.carouselCount,
          verifiedData,
          logo,
          useProfilePhoto: useProfilePhoto && selectedPhotosForGeneration.length > 0,
          framingMode,
          profilePhotos: selectedPhotosForGeneration,
        });

        setImages((prev) => ({
          ...prev,
          [key]: {
            slot,
            ratio,
            dataUrl: result.dataUrl,
            mimeType: result.mimeType,
            promptUsed: result.promptUsed,
            createdAt: Date.now(),
            usedProfilePhoto: useProfilePhoto && selectedPhotosForGeneration.length > 0,
            framing: framingMode,
          },
        }));
        onNotify(
          'success',
          isCover
            ? `${platform.name} (${ratio}) kapak görseli üretildi.`
            : `${platform.name} Slayt ${slideIndex + 1}/${platform.carouselCount} üretildi.`
        );
      } catch (err) {
        onNotify(
          'error',
          err instanceof Error ? err.message : 'Görsel üretimi sırasında hata oluştu.'
        );
      } finally {
        setLoadingSlots((prev) => ({ ...prev, [key]: false }));
      }
    },
    [
      ensureBrief,
      framingMode,
      logo,
      onNotify,
      onOpenVault,
      platform,
      selectedPhotosForGeneration,
      settings.apiKey,
      settings.imageModel,
      settings.imageSize,
      theme,
      useProfilePhoto,
      verifiedData,
    ]
  );

  // Optional auto-generate cover when enabled in settings and verified data is ready
  useEffect(() => {
    const autoKey = `${platform.id}_${theme.dayId}_${activeRatio}`;
    const coverKey = imageStorageKey('cover', activeRatio);
    if (
      settings.autoGenerateCover &&
      settings.apiKey.trim() &&
      verifiedData &&
      logo &&
      !images[coverKey] &&
      !loadingSlots[coverKey] &&
      autoCoverAttemptedRef.current !== autoKey
    ) {
      autoCoverAttemptedRef.current = autoKey;
      void generateSingleSlot('cover', activeRatio);
    }
  }, [
    activeRatio,
    generateSingleSlot,
    images,
    loadingSlots,
    logo,
    platform.id,
    settings.apiKey,
    settings.autoGenerateCover,
    theme.dayId,
    verifiedData,
  ]);

  const handleGenerateAllCarousel = async () => {
    const brief = await ensureBrief(false);
    if (!brief) return;

    const total = platform.carouselCount;
    setBatchProgress({ current: 0, total });
    for (let i = 1; i <= total; i += 1) {
      setBatchProgress({ current: i, total });
      const slot = `slide-${i}` as VisualSlotKey;
      await generateSingleSlot(slot, activeRatio, brief);
    }
    setBatchProgress(null);
  };

  const handleDownload = async (asset: GeneratedImageAsset, labelSuffix: string) => {
    try {
      const ratioClean = asset.ratio.replace(':', 'x');
      const filename = `EC-${platform.id}-${theme.shortName}-${ratioClean}-${labelSuffix}.png`;
      const res = await downloadPngImage(asset.dataUrl, filename);
      onNotify(
        'success',
        res.method === 'android-documents'
          ? `Kaydedildi: ${res.locationLabel}`
          : `PNG indirildi: ${res.locationLabel}`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Görsel indirilemedi.');
    }
  };

  const handleShare = async (asset: GeneratedImageAsset, labelSuffix: string, title: string) => {
    try {
      const ratioClean = asset.ratio.replace(':', 'x');
      const filename = `EC-${platform.id}-${theme.shortName}-${ratioClean}-${labelSuffix}.png`;
      await sharePngImage(asset.dataUrl, filename, title);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Paylaşım başlatılamadı.');
    }
  };

  const handleCopyText = async (field: 'caption' | 'hashtags', text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      onNotify(
        'success',
        field === 'caption' ? 'Paylaşım metni kopyalandı.' : 'Etiket seti kopyalandı.'
      );
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      onNotify('error', 'Panoya kopyalama başarısız oldu.');
    }
  };

  const renderSlotCard = (
    slot: VisualSlotKey,
    title: string,
    slideBrief: SlideBrief | undefined,
    fileLabel: string
  ) => {
    const key = imageStorageKey(slot, activeRatio);
    const asset = images[key];
    const isLoading = Boolean(loadingSlots[key]);

    return (
      <article key={key} className="glass-card-3d rim-glow rounded-3xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#1D63ED]/40 bg-[#1D63ED]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
              {title} • {activeRatio}
            </span>
            {slideBrief && (
              <h4 className="mt-1.5 text-sm font-bold text-[#F5F7FA] leading-snug">
                {slideBrief.headline}
              </h4>
            )}
          </div>
        </div>

        {slideBrief && (
          <p className="text-xs leading-relaxed text-[#94A3B8]">{slideBrief.subheadline}</p>
        )}

        <div
          className={`relative overflow-hidden rounded-2xl border border-[#1D63ED]/35 bg-[#0A0D12] ${ASPECT_CONTAINER_CLASS[activeRatio]}`}
        >
          {isLoading ? (
            <div className="shimmer-loading flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#0080FF]" />
              <p className="text-xs font-semibold text-sky-200">
                Nano Banana görsel üretiyor...
              </p>
              <p className="text-[10px] text-[#94A3B8]">
                Logo, kurumsal renk & kimlik kilidi enjekte edildi
              </p>
            </div>
          ) : asset ? (
            <button
              type="button"
              onClick={() => onInspectImage(asset.dataUrl, title, slot)}
              className="group relative block h-full w-full"
            >
              <img
                src={asset.dataUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
              <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-black/70 text-white opacity-90 transition group-hover:scale-105">
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center">
              <ImageIcon className="h-8 w-8 text-slate-600" />
              <p className="text-xs font-medium text-[#94A3B8]">
                {slideBrief
                  ? 'Kurgu hazır. Görseli üretmek için aşağıdaki butona dokunun.'
                  : 'Anlık üretim için "Üret" butonuna basın.'}
              </p>
            </div>
          )}
        </div>

        {asset ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleDownload(asset, fileLabel)}
              className="btn-cobalt-3d flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-3 text-xs font-bold text-white sm:col-span-2"
            >
              <Download className="h-4 w-4" />
              Telefona İndir (PNG)
            </button>
            <div className="grid grid-cols-2 gap-2 sm:col-span-1">
              <button
                type="button"
                onClick={() => handleShare(asset, fileLabel, title)}
                className="btn-glass-3d flex items-center justify-center gap-1 rounded-2xl py-2.5 text-xs font-semibold text-[#F5F7FA]"
                title="Paylaş"
              >
                <Share2 className="h-3.5 w-3.5 text-sky-300" />
              </button>
              <button
                type="button"
                onClick={() => generateSingleSlot(slot, activeRatio)}
                disabled={isLoading || generatingBrief}
                className="btn-glass-3d flex items-center justify-center gap-1 rounded-2xl py-2.5 text-xs font-semibold text-[#F5F7FA] disabled:opacity-50"
                title="Yeniden Üret"
              >
                <RefreshCw className="h-3.5 w-3.5 text-sky-300" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => generateSingleSlot(slot, activeRatio)}
            disabled={isLoading || generatingBrief || isVerifying}
            className="btn-cobalt-3d flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white disabled:opacity-60"
          >
            {isLoading || generatingBrief ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Üret
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-dvh pb-10">
      {/* Studio Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-[#1D63ED]/25 bg-[#0A0D12]/90 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="btn-glass-3d flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[#F5F7FA]"
          >
            <ArrowLeft className="h-4 w-4 text-[#0080FF]" />
            Ana Ekran
          </button>

          <div className="min-w-0 text-center">
            <h1 className="truncate text-sm font-extrabold text-[#F5F7FA]">
              {platform.name}
            </h1>
            <p className="truncate text-[10px] font-medium text-sky-300">
              {theme.dayName} • {theme.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenVault}
            aria-label="Marka Kasası"
            className="btn-glass-3d flex h-10 w-10 items-center justify-center rounded-xl text-[#F5F7FA]"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#0080FF]" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-4 px-4 pt-4">
        {/* Missing API Key Banner */}
        {!settings.apiKey.trim() && (
          <div className="glass-card rounded-3xl border-amber-400/45 bg-amber-500/10 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-200">
              <KeyRound className="h-4 w-4 shrink-0" />
              <p className="text-xs font-bold">
                Google Gemini API Anahtarı Gerekli
              </p>
            </div>
            <p className="text-xs leading-relaxed text-amber-100/80">
              Canlı veri doğrulama (Google Search) ve görsel üretimini başlatmak için Marka
              Kasası&apos;ndan API anahtarınızı ekleyin.
            </p>
            <button
              type="button"
              onClick={onOpenVault}
              className="btn-cobalt-3d rounded-2xl px-4 py-2 text-xs font-bold text-white"
            >
              Marka Kasası&apos;ndan API Key Gir
            </button>
          </div>
        )}

        {/* 1. Grounded Daily Verified Data & Sources Card */}
        <section className="glass-card-3d rim-glow rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#0080FF]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                Günün Doğrulanmış Veri Özeti & Kaynakları
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onVerifyDailyData(customFocus)}
              disabled={isVerifying || !settings.apiKey.trim()}
              className="btn-glass-3d flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-[#F5F7FA] disabled:opacity-50"
            >
              {isVerifying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0080FF]" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-[#0080FF]" />
              )}
              {verifiedData ? 'Yenile' : 'Doğrula'}
            </button>
          </div>

          {isVerifying ? (
            <div className="space-y-2 rounded-2xl border border-[#1D63ED]/25 bg-[#0A0D12]/65 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-200">
                <Loader2 className="h-4 w-4 animate-spin text-[#0080FF]" />
                {theme.authorities.join(', ')} kaynaklarından güncel veriler doğrulanıyor...
              </div>
              <div className="h-3 w-3/4 rounded shimmer-loading" />
              <div className="h-3 w-1/2 rounded shimmer-loading" />
            </div>
          ) : verifiedData ? (
            <div className="space-y-2.5">
              <div>
                <p className="text-sm font-bold text-[#F5F7FA]">{verifiedData.headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                  {verifiedData.summary}
                </p>
              </div>

              {verifiedData.metrics.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {verifiedData.metrics.slice(0, 4).map((m, idx) => (
                    <div
                      key={`${m.label}-${idx}`}
                      className="rounded-2xl border border-white/10 bg-[#0A0D12]/70 px-3 py-2"
                    >
                      <p className="text-[10px] text-[#94A3B8]">{m.label}</p>
                      <p className="text-xs font-extrabold text-[#F5F7FA] mt-0.5">{m.value}</p>
                      <p className="text-[10px] text-sky-300 mt-0.5">
                        {m.sourceName} • {m.dateContext}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {verifiedData.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {verifiedData.sources.slice(0, 5).map((src) => (
                    <a
                      key={src.url}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1 rounded-lg border border-[#1D63ED]/35 bg-[#1D63ED]/15 px-2 py-1 text-[10px] font-medium text-sky-200 hover:bg-[#1D63ED]/30"
                    >
                      <span className="truncate max-w-[160px]">{src.title}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8]">
              {theme.dayName} teması ({theme.authorities.join(', ')}) için gerçek web verileri
              doğrulanmaya hazır.
            </p>
          )}

          {/* Optional custom topic input */}
          <div className="pt-1">
            <input
              type="text"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="İsteğe bağlı özel odak (örn: Kadıköy ticari mülk, EİDS yetki...)"
              className="w-full rounded-xl border border-white/10 bg-[#0A0D12]/75 px-3 py-2 text-xs text-[#F5F7FA] placeholder:text-slate-500 focus:border-[#0080FF] focus:outline-none"
            />
          </div>
        </section>

        {/* 2. Format, Ratio & Profile Photo Controls */}
        <section className="glass-card-3d rounded-3xl p-4 space-y-3.5">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#F5F7FA]">En-Boy Oranı</span>
            <div className="flex items-center gap-1.5">
              {platform.supportedRatios.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveRatio(r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activeRatio === r
                      ? 'btn-cobalt-3d text-white'
                      : 'btn-glass-3d text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Cover vs Carousel Switch */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0A0D12]/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('cover')}
              className={`rounded-xl py-2.5 px-2 text-xs font-bold transition ${
                activeTab === 'cover'
                  ? 'btn-cobalt-3d text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {platform.coverLabel}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('carousel')}
              className={`rounded-xl py-2.5 px-2 text-xs font-bold transition ${
                activeTab === 'carousel'
                  ? 'btn-cobalt-3d text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {platform.carouselLabel}
            </button>
          </div>

          {/* Profile Photo Toggle & Framing */}
          <div className="rounded-2xl border border-[#1D63ED]/25 bg-[#0A0D12]/65 p-3 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="h-4 w-4 shrink-0 text-[#0080FF]" />
                <div>
                  <p className="text-xs font-bold text-[#F5F7FA]">
                    Bu görselde profil fotoğrafımı kullan
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">
                    %100 Yüz Kimliği Kilidi ile kıyafet & arka plan uyarlanır
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useProfilePhoto}
                disabled={profilePhotos.length === 0}
                onChange={(e) => setUseProfilePhoto(e.target.checked)}
                className="h-4 w-4 accent-[#1D63ED]"
              />
            </label>

            {profilePhotos.length === 0 ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2">
                <span className="text-[11px] text-[#94A3B8]">
                  Marka Kasası&apos;nda profil fotoğrafı bulunmuyor.
                </span>
                <button
                  type="button"
                  onClick={onOpenVault}
                  className="text-[11px] font-bold text-sky-300 hover:underline"
                >
                  Fotoğraf Ekle
                </button>
              </div>
            ) : (
              useProfilePhoto && (
                <div className="space-y-2.5 pt-1 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#94A3B8]">
                      Kadraj Seçimi:
                    </span>
                    <div className="flex gap-1.5">
                      {FRAMING_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFramingMode(opt.id)}
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold ${
                            framingMode === opt.id
                              ? 'btn-cobalt-3d text-white'
                              : 'border border-white/10 bg-[#111622] text-[#94A3B8]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {profilePhotos.map((photo) => {
                      const active = photo.id === selectedPhotoId;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => {
                            setSelectedPhotoId(photo.id);
                            setFramingMode(photo.framing);
                          }}
                          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                            active ? 'border-[#0080FF] scale-105' : 'border-white/15 opacity-70'
                          }`}
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* 3. Production Area */}
        {activeTab === 'cover' ? (
          <section className="space-y-3">
            {renderSlotCard(
              'cover',
              platform.coverLabel,
              currentBrief?.cover,
              'kapak'
            )}
          </section>
        ) : (
          <section className="space-y-3">
            <div className="glass-card rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#0080FF]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F5F7FA]">
                    {platform.carouselLabel}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-sky-300">
                  {platform.carouselCount} Panel
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerateAllCarousel}
                disabled={batchProgress !== null || generatingBrief || isVerifying}
                className="btn-cobalt-3d flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white disabled:opacity-65"
              >
                {batchProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Üretiliyor ({batchProgress.current}/{batchProgress.total})...
                  </>
                ) : generatingBrief ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Senaryo & Veriler Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Tüm {platform.carouselCount} Paneli Sırayla Üret
                  </>
                )}
              </button>
            </div>

            {Array.from({ length: platform.carouselCount }, (_, idx) => {
              const num = idx + 1;
              const slot = `slide-${num}` as VisualSlotKey;
              const slideBrief = currentBrief?.slides[idx];
              const fallbackRoles = platform.isBannerSeries
                ? ['Ana Değer Önerisi & Kanca', 'Stratejik Çözüm & Kurumsal CTA']
                : [
                    'Çarpıcı Başlık & Kanca',
                    'Doğrulanmış Güncel Veri / Sorun',
                    'Stratejik Analiz & Yaklaşım',
                    'Uygulanabilir Çözüm / Öneri',
                    'Kurumsal İmza, Logo & CTA',
                  ];
              const roleLabel = slideBrief?.roleTitle || fallbackRoles[idx] || `Panel ${num}`;
              return renderSlotCard(
                slot,
                `Slayt ${num}/${platform.carouselCount} • ${roleLabel}`,
                slideBrief,
                `slayt-${num}`
              );
            })}
          </section>
        )}

        {/* 4. Algorithm-Optimized Social Copy & Hashtags (Instagram, Facebook, LinkedIn, X) */}
        {platform.hasSocialCopy && (
          <section className="glass-card-3d rim-glow rounded-3xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#0080FF]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                  {platform.name} Paylaşım Metni & Etiket Seti
                </h3>
              </div>
              <button
                type="button"
                onClick={() => ensureBrief(true)}
                disabled={generatingBrief || isVerifying}
                className="btn-glass-3d flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-[#F5F7FA] disabled:opacity-50"
              >
                {generatingBrief ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0080FF]" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-[#0080FF]" />
                )}
                {currentBrief ? 'Metni Yenile' : 'Metin Üret'}
              </button>
            </div>

            {currentBrief ? (
              <>
                <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0A0D12]/75 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#94A3B8]">
                      Algoritma Uyumlu Paylaşım Metni
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('caption', currentBrief.socialCaption)}
                      className="btn-cobalt-3d inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      {copiedField === 'caption' ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Tek Tıkla Kopyala
                        </>
                      )}
                    </button>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-[#F5F7FA]">
                    {currentBrief.socialCaption}
                  </p>
                </div>

                <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0A0D12]/75 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#94A3B8]">
                      Etiket (Hashtag) Seti
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('hashtags', currentBrief.hashtags.join(' '))
                      }
                      className="btn-glass-3d inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-sky-200"
                    >
                      {copiedField === 'hashtags' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#0080FF]" />
                          Tek Tıkla Kopyala
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentBrief.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-[#1D63ED]/30 bg-[#1D63ED]/15 px-2 py-0.5 text-[11px] font-medium text-sky-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#94A3B8]">
                &ldquo;Üret&rdquo; veya &ldquo;Metin Üret&rdquo; butonuna bastığınızda{' '}
                {platform.name} algoritmasına özel paylaşım metni ve etiket seti burada
                oluşturulacaktır.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  RotateCcw,
  Shield,
  Star,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { BRAND_NAME, BRAND_PHONE, BRAND_WEBSITE } from '../data/themes';
import { testGeminiConnection } from '../services/geminiService';
import {
  deleteProfilePhoto,
  deleteStoredLogo,
  processUploadedImage,
  saveProfilePhoto,
  saveStoredLogo,
  setDefaultProfilePhoto,
  updateProfilePhotoFraming,
} from '../services/vaultStorage';
import type {
  FramingMode,
  ImageModelId,
  ImageSizeId,
  LogoAsset,
  ProfilePhotoAsset,
  StudioSettings,
} from '../types/studio';

interface BrandVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onUpdateSettings: (next: StudioSettings) => void;
  logo: LogoAsset | null;
  hasCustomLogo: boolean;
  onRefreshVault: () => Promise<void>;
  profilePhotos: ProfilePhotoAsset[];
  onNotify: (kind: 'success' | 'error' | 'info', text: string) => void;
}

const FRAMING_LABELS: Record<FramingMode, string> = {
  portrait: 'Portre',
  'waist-up': 'Belden Yukarı',
  'full-body': 'Tam Boy',
};

export function BrandVaultModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  logo,
  hasCustomLogo,
  onRefreshVault,
  profilePhotos,
  onNotify,
}: BrandVaultModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [uploadFraming, setUploadFraming] = useState<FramingMode>('portrait');
  const [busyLogo, setBusyLogo] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(settings.apiKey);
    }
  }, [isOpen, settings.apiKey]);

  if (!isOpen) return null;

  const handleSaveSettings = (patch?: Partial<StudioSettings>) => {
    const next: StudioSettings = {
      ...settings,
      ...patch,
      apiKey: (patch?.apiKey ?? apiKeyInput).trim(),
    };
    onUpdateSettings(next);
    if (!patch) {
      onNotify('success', 'Marka Kasası ve Gemini API ayarları kaydedildi.');
    }
  };

  const handleTestKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      onNotify('error', 'Lütfen önce Google Gemini API Key girin.');
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const reply = await testGeminiConnection(key);
      handleSaveSettings({ apiKey: key });
      setTestResult(reply);
      onNotify('success', 'Gemini API bağlantısı doğrulandı ve kaydedildi.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bağlantı başarısız';
      setTestResult(msg);
      onNotify('error', msg);
    } finally {
      setTestingKey(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyLogo(true);
    try {
      const processed = await processUploadedImage(file, 1024, 'image/png');
      await saveStoredLogo({
        id: 'official-logo',
        name: file.name,
        mimeType: processed.mimeType,
        base64: processed.base64,
        dataUrl: processed.dataUrl,
        updatedAt: Date.now(),
      });
      await onRefreshVault();
      onNotify('success', 'Resmi EÇ logosu Marka Kasası’na kaydedildi.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Logo yüklenemedi');
    } finally {
      setBusyLogo(false);
      e.target.value = '';
    }
  };

  const handleResetLogo = async () => {
    setBusyLogo(true);
    try {
      await deleteStoredLogo();
      await onRefreshVault();
      onNotify('info', 'Varsayılan resmi 3D EÇ logosuna dönüldü.');
    } finally {
      setBusyLogo(false);
    }
  };

  const handleProfileFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setBusyPhoto(true);
    try {
      const existingCount = profilePhotos.length;
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const processed = await processUploadedImage(file, 1280, 'image/jpeg');
        const asset: ProfilePhotoAsset = {
          id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          framing: uploadFraming,
          mimeType: processed.mimeType,
          base64: processed.base64,
          dataUrl: processed.dataUrl,
          isDefault: existingCount === 0 && i === 0,
          createdAt: Date.now() + i,
        };
        await saveProfilePhoto(asset);
      }
      await onRefreshVault();
      onNotify('success', `${files.length} referans profil fotoğrafı Marka Kasası’na eklendi.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Fotoğraf yüklenemedi');
    } finally {
      setBusyPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#070A0F]/95 backdrop-blur-xl safe-top safe-bottom"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-[#1D63ED]/25 bg-[#0A0D12]/90 px-4 py-3">
        <div>
          <h2 className="text-base font-extrabold text-[#F5F7FA]">
            Marka Kasası & API Ayarları
          </h2>
          <p className="text-[11px] text-[#94A3B8]">
            Resmi Logo, Referans Yüz Fotoğrafları ve Gemini API Anahtarı
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-glass-3d flex h-10 w-10 items-center justify-center rounded-xl text-[#F5F7FA]"
          aria-label="Marka Kasasını kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-xl space-y-4 pb-8">
          {/* API KEY & MODEL SETTINGS */}
          <section className="glass-card-3d rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#0080FF]" />
              <h3 className="text-sm font-bold text-[#F5F7FA]">
                Google Gemini API Key (Yerel Hafıza)
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Anahtarınız yalnızca cihazınızın <code className="text-sky-300">localStorage</code>{' '}
              alanında saklanır ve doğrudan Google Gemini API isteklerinde kullanılır.
            </p>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                autoComplete="off"
                className="w-full rounded-2xl border border-[#1D63ED]/35 bg-[#0A0D12]/90 py-3 pl-3.5 pr-11 text-sm text-[#F5F7FA] placeholder:text-slate-500 focus:border-[#0080FF] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                className="absolute right-2.5 rounded-xl p-1.5 text-[#94A3B8] hover:text-white"
                aria-label={showKey ? 'Anahtarı gizle' : 'Anahtarı göster'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="btn-cobalt-3d rounded-2xl py-2.5 text-xs font-bold text-white"
              >
                Anahtarı Kaydet
              </button>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingKey}
                className="btn-glass-3d flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-semibold text-[#F5F7FA] disabled:opacity-60"
              >
                {testingKey ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
                Bağlantıyı Test Et
              </button>
            </div>

            {testResult && (
              <p className="rounded-xl border border-white/10 bg-[#0A0D12]/70 px-3 py-2 text-xs text-sky-200">
                {testResult}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                  Görsel Üretim Modeli
                </label>
                <select
                  value={settings.imageModel}
                  onChange={(e) =>
                    handleSaveSettings({ imageModel: e.target.value as ImageModelId })
                  }
                  className="w-full rounded-xl border border-[#1D63ED]/35 bg-[#0A0D12] px-2.5 py-2 text-xs font-medium text-[#F5F7FA] focus:border-[#0080FF] focus:outline-none"
                >
                  <option value="gemini-nano-banana-2.1">Nano Banana 2.1 (Hızlı / Önerilen)</option>
                  <option value="gemini-3-pro-image">Nano Banana Pro (Yüksek Kalite)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                  Çözünürlük
                </label>
                <select
                  value={settings.imageSize}
                  onChange={(e) =>
                    handleSaveSettings({ imageSize: e.target.value as ImageSizeId })
                  }
                  className="w-full rounded-xl border border-[#1D63ED]/35 bg-[#0A0D12] px-2.5 py-2 text-xs font-medium text-[#F5F7FA] focus:border-[#0080FF] focus:outline-none"
                >
                  <option value="1K">1K (Hızlı Mobil)</option>
                  <option value="2K">2K (Ultra Net Baskı)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0A0D12]/60 px-3.5 py-2.5 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-[#F5F7FA]">
                  Platform Açıldığında Otomatik Kapak Üret
                </p>
                <p className="text-[10px] text-[#94A3B8]">
                  Doğrulanmış veri sonrası ilk kapak görselini otomatik başlatır
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoGenerateCover}
                onChange={(e) => handleSaveSettings({ autoGenerateCover: e.target.checked })}
                className="h-4 w-4 accent-[#1D63ED]"
              />
            </label>
          </section>

          {/* OFFICIAL LOGO VAULT */}
          <section className="glass-card-3d rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0080FF]" />
                <h3 className="text-sm font-bold text-[#F5F7FA]">
                  Resmi 3D EÇ Logosu (Tek Logo Kilidi)
                </h3>
              </div>
              <span className="rounded-lg border border-[#1D63ED]/35 bg-[#1D63ED]/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                {hasCustomLogo ? 'Özel Logo Aktif' : 'Resmi EÇ Logo'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#1D63ED]/45 bg-[#0A0D12] p-2">
                <img
                  src={logo?.dataUrl || './brand/ec-logo.png'}
                  alt="Resmi EÇ Logosu"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={busyLogo}
                  className="btn-glass-3d flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-[#F5F7FA]"
                >
                  {busyLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-[#0080FF]" />
                  )}
                  Yeni Resmi Logo Yükle
                </button>
                {hasCustomLogo && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    disabled={busyLogo}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2 text-[11px] text-[#94A3B8] hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Varsayılan 3D EÇ Logosuna Dön
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* PROFILE PHOTOS VAULT */}
          <section className="glass-card-3d rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#0080FF]" />
                <h3 className="text-sm font-bold text-[#F5F7FA]">
                  Referans Profil Fotoğrafları ({profilePhotos.length})
                </h3>
              </div>
              <span className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                %100 Yüz Kilidi
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Portre, belden yukarı ve tam boy referans fotoğraflarınızı ekleyin. Üretim sırasında
              yüz kimliğiniz birebir korunur; yalnızca kıyafet ve arka plan temaya uyarlanır.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#94A3B8]">Yükleme Kadrajı:</span>
              {(['portrait', 'waist-up', 'full-body'] as FramingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setUploadFraming(mode)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold ${
                    uploadFraming === mode
                      ? 'btn-cobalt-3d text-white'
                      : 'border border-white/10 bg-[#0A0D12]/80 text-[#94A3B8]'
                  }`}
                >
                  {FRAMING_LABELS[mode]}
                </button>
              ))}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleProfileFilesChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={busyPhoto}
              className="btn-cobalt-3d flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white"
            >
              {busyPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Profil Fotoğrafı Ekle (Çoklu Seçim)
            </button>

            {profilePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {profilePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`overflow-hidden rounded-2xl border bg-[#0A0D12]/85 ${
                      photo.isDefault ? 'border-[#0080FF]' : 'border-white/10'
                    }`}
                  >
                    <div className="relative aspect-[4/5] w-full bg-[#111622]">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await setDefaultProfilePhoto(photo.id);
                          await onRefreshVault();
                        }}
                        className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                          photo.isDefault
                            ? 'bg-[#1D63ED] text-white'
                            : 'bg-black/65 text-slate-300'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        {photo.isDefault ? 'Varsayılan' : 'Seç'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteProfilePhoto(photo.id);
                          await onRefreshVault();
                          onNotify('info', 'Referans fotoğraf silindi.');
                        }}
                        aria-label="Fotoğrafı sil"
                        className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-rose-300 hover:bg-rose-600 hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-2">
                      <select
                        value={photo.framing}
                        onChange={async (e) => {
                          await updateProfilePhotoFraming(
                            photo.id,
                            e.target.value as FramingMode
                          );
                          await onRefreshVault();
                        }}
                        className="w-full rounded-lg border border-white/10 bg-[#111622] px-2 py-1 text-[11px] font-medium text-[#F5F7FA] focus:outline-none"
                      >
                        <option value="portrait">Kadraj: Portre</option>
                        <option value="waist-up">Kadraj: Belden Yukarı</option>
                        <option value="full-body">Kadraj: Tam Boy</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1D63ED]/35 bg-[#0A0D12]/50 p-4 text-center text-xs text-[#94A3B8]">
                Henüz profil fotoğrafı yüklenmedi. Fotoğraf eklediğinizde üretim ekranında
                &ldquo;Bu görselde profil fotoğrafımı kullan&rdquo; seçeneği aktifleşir.
              </div>
            )}
          </section>

          {/* LOCKED CORPORATE RULES */}
          <section className="glass-card rounded-3xl p-4 space-y-2 text-xs text-[#94A3B8]">
            <p className="font-bold text-[#F5F7FA]">Kurumsal Kimlik & Güvenlik Kilidi (Sabit)</p>
            <p>• Marka: {BRAND_NAME}</p>
            <p>• İletişim: {BRAND_PHONE} | {BRAND_WEBSITE}</p>
            <p>• Koruma: Tek Resmi 3D EÇ Logosu, %100 Yüz Kilidi, Doğrulanmamış Veri Yasağı</p>
          </section>
        </div>
      </div>
    </div>
  );
}

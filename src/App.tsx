import { useCallback, useEffect, useState } from 'react';
import { BrandVaultModal } from './components/BrandVaultModal';
import { DailyThemeCard } from './components/DailyThemeCard';
import { DaySelector } from './components/DaySelector';
import { HeaderBar } from './components/HeaderBar';
import { ImageLightbox } from './components/ImageLightbox';
import { PlatformGrid } from './components/PlatformGrid';
import { PlatformStudio } from './components/PlatformStudio';
import { ToastContainer, type ToastKind, type ToastMessage } from './components/Toast';
import { PLATFORM_MAP } from './data/platforms';
import { BRAND_NAME, BRAND_PHONE, BRAND_WEBSITE, WEEKLY_THEMES } from './data/themes';
import { verifyDailyThemeData } from './services/geminiService';
import {
  getCachedVerifiedData,
  getEffectiveLogo,
  getStoredLogo,
  getStoredProfilePhotos,
  loadStudioSettings,
  saveCachedVerifiedData,
  saveStudioSettings,
} from './services/vaultStorage';
import type {
  DayId,
  LogoAsset,
  PlatformId,
  ProfilePhotoAsset,
  StudioSettings,
  VerifiedDailyData,
  VisualSlotKey,
} from './types/studio';
import { getIstanbulDateInfo } from './utils/dayEngine';
import { downloadPngImage, sharePngImage } from './utils/downloadImage';

export function App() {
  const [istanbulDate, setIstanbulDate] = useState(() => getIstanbulDateInfo());
  const [selectedDay, setSelectedDay] = useState<DayId>(() => getIstanbulDateInfo().dayId);
  const [activePlatformId, setActivePlatformId] = useState<PlatformId | null>(null);

  const [settings, setSettings] = useState<StudioSettings>(() => loadStudioSettings());
  const [logo, setLogo] = useState<LogoAsset | null>(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhotoAsset[]>([]);
  const [vaultOpen, setVaultOpen] = useState(false);

  const [verifiedData, setVerifiedData] = useState<VerifiedDailyData | null>(() =>
    getCachedVerifiedData(getIstanbulDateInfo().dayId, getIstanbulDateInfo().dateKey)
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const [lightbox, setLightbox] = useState<{
    imageUrl: string;
    title: string;
    slot: VisualSlotKey;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, kind, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const refreshVault = useCallback(async () => {
    const [effectiveLogo, storedCustomLogo, photos] = await Promise.all([
      getEffectiveLogo(),
      getStoredLogo(),
      getStoredProfilePhotos(),
    ]);
    setLogo(effectiveLogo);
    setHasCustomLogo(Boolean(storedCustomLogo));
    setProfilePhotos(photos);
  }, []);

  useEffect(() => {
    void refreshVault();
  }, [refreshVault]);

  // Refresh Istanbul UTC+3 date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setIstanbulDate(getIstanbulDateInfo());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Load cached verified research whenever selected day or dateKey changes
  useEffect(() => {
    const cached = getCachedVerifiedData(selectedDay, istanbulDate.dateKey);
    setVerifiedData(cached);
  }, [selectedDay, istanbulDate.dateKey]);

  const handleUpdateSettings = (next: StudioSettings) => {
    setSettings(next);
    saveStudioSettings(next);
  };

  const activeTheme = WEEKLY_THEMES[selectedDay];

  const handleVerifyDailyData = useCallback(
    async (customTopic?: string): Promise<VerifiedDailyData | null> => {
      if (!settings.apiKey.trim()) {
        notify('error', 'Canlı doğrulama için Marka Kasası üzerinden Gemini API Key girin.');
        setVaultOpen(true);
        return null;
      }
      setIsVerifying(true);
      try {
        const result = await verifyDailyThemeData(
          settings.apiKey,
          activeTheme,
          istanbulDate.formattedDate,
          istanbulDate.dateKey,
          customTopic
        );
        saveCachedVerifiedData(result);
        setVerifiedData(result);
        notify('success', `${activeTheme.dayName} verileri Google Search ile doğrulandı.`);
        return result;
      } catch (err) {
        notify(
          'error',
          err instanceof Error ? err.message : 'Veri doğrulama sırasında hata oluştu.'
        );
        return null;
      } finally {
        setIsVerifying(false);
      }
    },
    [activeTheme, istanbulDate.dateKey, istanbulDate.formattedDate, notify, settings.apiKey]
  );

  const activePlatform = activePlatformId ? PLATFORM_MAP[activePlatformId] : null;

  return (
    <div className="obsidian-bg obsidian-grid min-h-dvh text-[#F5F7FA]">
      <div className="relative z-10">
        {activePlatform ? (
          <PlatformStudio
            platform={activePlatform}
            theme={activeTheme}
            dateKey={istanbulDate.dateKey}
            settings={settings}
            logo={logo}
            profilePhotos={profilePhotos}
            verifiedData={verifiedData}
            isVerifying={isVerifying}
            onVerifyDailyData={handleVerifyDailyData}
            onBack={() => setActivePlatformId(null)}
            onOpenVault={() => setVaultOpen(true)}
            onInspectImage={(imageUrl, title, slot) =>
              setLightbox({ imageUrl, title, slot })
            }
            onNotify={notify}
          />
        ) : (
          <>
            <HeaderBar
              logoDataUrl={logo?.dataUrl ?? null}
              istanbulDate={istanbulDate}
              hasApiKey={Boolean(settings.apiKey.trim())}
              onOpenVault={() => setVaultOpen(true)}
            />

            <main className="mx-auto max-w-xl space-y-5 px-4 pb-10 pt-4 safe-bottom">
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    7 Günlük Otomatik Tema Motoru
                  </span>
                  <span className="text-[11px] font-medium text-sky-300">
                    {istanbulDate.timeText} • İstanbul
                  </span>
                </div>
                <DaySelector
                  selectedDay={selectedDay}
                  todayDayId={istanbulDate.dayId}
                  onSelectDay={(d) => setSelectedDay(d)}
                />
              </section>

              <DailyThemeCard
                theme={activeTheme}
                isToday={selectedDay === istanbulDate.dayId}
                verifiedData={verifiedData}
                isVerifying={isVerifying}
                onVerify={() => void handleVerifyDailyData()}
              />

              <PlatformGrid onSelectPlatform={(id) => setActivePlatformId(id)} />

              <footer className="glass-card rounded-2xl px-4 py-3 text-center text-[11px] text-[#94A3B8]">
                <p className="font-bold text-[#F5F7FA]">{BRAND_NAME}</p>
                <p className="mt-0.5 text-sky-300">
                  {BRAND_PHONE} • {BRAND_WEBSITE}
                </p>
              </footer>
            </main>
          </>
        )}
      </div>

      <BrandVaultModal
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        logo={logo}
        hasCustomLogo={hasCustomLogo}
        onRefreshVault={refreshVault}
        profilePhotos={profilePhotos}
        onNotify={notify}
      />

      <ImageLightbox
        imageUrl={lightbox?.imageUrl ?? null}
        title={lightbox?.title ?? ''}
        onClose={() => setLightbox(null)}
        onDownload={async () => {
          if (!lightbox) return;
          const filename = `EC-${activePlatform?.id ?? 'studyo'}-${activeTheme.shortName}-${lightbox.slot}.png`;
          const res = await downloadPngImage(lightbox.imageUrl, filename);
          notify(
            'success',
            res.method === 'android-documents'
              ? `Kaydedildi: ${res.locationLabel}`
              : `PNG indirildi: ${res.locationLabel}`
          );
        }}
        onShare={async () => {
          if (!lightbox) return;
          const filename = `EC-${activePlatform?.id ?? 'studyo'}-${activeTheme.shortName}-${lightbox.slot}.png`;
          await sharePngImage(lightbox.imageUrl, filename, lightbox.title);
        }}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

export default App;

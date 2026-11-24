import { ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { BRAND_SHORT_NAME } from '../data/themes';
import type { IstanbulDateInfo } from '../types/studio';

interface HeaderBarProps {
  logoDataUrl: string | null;
  istanbulDate: IstanbulDateInfo;
  hasApiKey: boolean;
  onOpenVault: () => void;
}

export function HeaderBar({
  logoDataUrl,
  istanbulDate,
  hasApiKey,
  onOpenVault,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1D63ED]/25 bg-[#0A0D12]/85 backdrop-blur-xl safe-top">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 pb-3 pt-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1D63ED]/55 bg-[#111622] p-0.5 shadow-[0_0_22px_rgba(29,99,237,0.45)]">
            <img
              src={logoDataUrl || './brand/ec-logo.png'}
              alt="Resmi 3D EÇ Logosu"
              className="h-full w-full rounded-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold tracking-wider text-[#F5F7FA] sm:text-sm">
              {BRAND_SHORT_NAME}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#1D63ED]/30 bg-[#1D63ED]/15 px-2 py-0.5 font-semibold text-sky-300">
                UTC+3 • {istanbulDate.dayName}
              </span>
              <span className="truncate">{istanbulDate.formattedDate}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenVault}
          aria-label="Marka Kasası ve Ayarlar"
          className="btn-glass-3d relative flex h-11 shrink-0 items-center gap-2 rounded-2xl px-3 text-xs font-semibold text-[#F5F7FA]"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#0080FF]" />
          <span className="hidden xs:inline">Marka Kasası</span>
          <span
            title={hasApiKey ? 'Gemini API Key Hazır' : 'API Key Gerekli'}
            className={`h-2.5 w-2.5 rounded-full ring-2 ring-[#0A0D12] ${
              hasApiKey
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
            }`}
          />
          {hasApiKey && <ShieldCheck className="sr-only" />}
        </button>
      </div>
    </header>
  );
}

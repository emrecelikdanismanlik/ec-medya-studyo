import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { DayTheme, VerifiedDailyData } from '../types/studio';

interface DailyThemeCardProps {
  theme: DayTheme;
  isToday: boolean;
  verifiedData: VerifiedDailyData | null;
  isVerifying: boolean;
  onVerify: () => void;
}

export function DailyThemeCard({
  theme,
  isToday,
  verifiedData,
  isVerifying,
  onVerify,
}: DailyThemeCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="glass-card-3d rim-glow rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1D63ED]/45 bg-[#1D63ED]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-300">
            <Sparkles className="h-3 w-3 text-[#0080FF]" />
            {theme.dayName} Teması
          </span>
          {isToday && (
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              Otomatik Bugün
            </span>
          )}
        </div>

        {verifiedData && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Veri Doğrulandı
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      <h1 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-[#F5F7FA] sm:text-xl">
        {theme.title}
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-[#94A3B8] sm:text-sm">{theme.subtitle}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {theme.authorities.map((auth) => (
          <span
            key={auth}
            className="rounded-lg border border-white/10 bg-[#0A0D12]/65 px-2.5 py-1 text-[11px] font-medium text-slate-300"
          >
            {auth}
          </span>
        ))}
      </div>

      {verifiedData && expanded && (
        <div className="mt-4 space-y-3 rounded-2xl border border-[#1D63ED]/30 bg-[#0A0D12]/70 p-3.5">
          <div>
            <p className="text-xs font-bold text-sky-300">{verifiedData.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{verifiedData.summary}</p>
          </div>

          {verifiedData.metrics.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {verifiedData.metrics.slice(0, 4).map((m, idx) => (
                <div
                  key={`${m.label}-${idx}`}
                  className="rounded-xl border border-white/10 bg-[#111622]/90 px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">{m.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-[#F5F7FA]">{m.value}</p>
                  <p className="mt-0.5 text-[10px] text-sky-300/90">
                    {m.sourceName} • {m.dateContext}
                  </p>
                </div>
              ))}
            </div>
          )}

          {verifiedData.sources.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Doğrulanan Kaynaklar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verifiedData.sources.slice(0, 4).map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 rounded-lg border border-[#1D63ED]/35 bg-[#1D63ED]/15 px-2 py-1 text-[11px] text-sky-200 hover:bg-[#1D63ED]/30"
                  >
                    <span className="truncate max-w-[180px]">{src.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onVerify}
          disabled={isVerifying}
          className="btn-cobalt-3d flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold tracking-wide text-white disabled:opacity-65 sm:text-sm"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Google Search ile Doğrulanıyor...
            </>
          ) : verifiedData ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Günün Verilerini Yeniden Doğrula (Web Araştırması)
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              Günün Verilerini Doğrula (Web Araştırması)
            </>
          )}
        </button>
      </div>
    </section>
  );
}

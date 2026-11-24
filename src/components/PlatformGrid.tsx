import type { ComponentType } from 'react';
import {
  AtSign,
  Briefcase,
  Building2,
  Camera,
  ChevronRight,
  Layers,
  LayoutGrid,
  MessageCircle,
  Send,
  Users,
} from 'lucide-react';
import { PLATFORMS } from '../data/platforms';
import type { PlatformConfig, PlatformId } from '../types/studio';

interface PlatformGridProps {
  onSelectPlatform: (platformId: PlatformId) => void;
}

const PLATFORM_ICONS: Record<PlatformId, ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook: Users,
  linkedin: Building2,
  x: AtSign,
  telegram: Send,
  banner: LayoutGrid,
  portfolio: Briefcase,
  glassmorphism: Layers,
};

function PlatformButtonCard({
  platform,
  featured = false,
  onSelect,
}: {
  platform: PlatformConfig;
  featured?: boolean;
  onSelect: () => void;
}) {
  const Icon = PLATFORM_ICONS[platform.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`glass-card-3d rim-glow group relative flex w-full text-left active:scale-[0.975] ${
        featured
          ? 'col-span-2 flex-row items-center justify-between gap-4 rounded-3xl p-4 sm:p-5'
          : 'flex-col justify-between rounded-3xl p-4'
      }`}
    >
      <div className={featured ? 'flex items-center gap-3.5 min-w-0' : 'w-full'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#1D63ED]/45 bg-gradient-to-br from-[#1D63ED]/30 to-[#0080FF]/10 text-[#0080FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-4px_rgba(29,99,237,0.45)] transition-transform group-hover:scale-105">
            <Icon className="h-5 w-5 text-sky-300" />
          </div>
          {!featured && (
            <ChevronRight className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-sky-300" />
          )}
        </div>

        <div className={featured ? 'min-w-0' : 'mt-3'}>
          <h2 className="truncate text-sm font-bold text-[#F5F7FA] sm:text-base">
            {platform.name}
          </h2>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#94A3B8]">
            {platform.description}
          </p>
        </div>
      </div>

      <div
        className={
          featured
            ? 'flex shrink-0 items-center gap-2'
            : 'mt-3 flex flex-wrap items-center gap-1'
        }
      >
        <span className="rounded-lg border border-[#1D63ED]/35 bg-[#1D63ED]/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
          {platform.badgeText}
        </span>
        {featured && (
          <ChevronRight className="h-5 w-5 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-sky-300" />
        )}
      </div>
    </button>
  );
}

export function PlatformGrid({ onSelectPlatform }: PlatformGridProps) {
  const mainPlatforms = PLATFORMS.slice(0, 8);
  const featuredPlatform = PLATFORMS[8];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
          Platform Üretim Stüdyosu (9 Kanal)
        </h2>
        <span className="text-[11px] font-medium text-sky-300">Anlık On-Demand</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mainPlatforms.map((platform) => (
          <PlatformButtonCard
            key={platform.id}
            platform={platform}
            onSelect={() => onSelectPlatform(platform.id)}
          />
        ))}
        {featuredPlatform && (
          <PlatformButtonCard
            platform={featuredPlatform}
            featured
            onSelect={() => onSelectPlatform(featuredPlatform.id)}
          />
        )}
      </div>
    </section>
  );
}

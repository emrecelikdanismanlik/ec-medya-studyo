import type { PlatformConfig, PlatformId } from '../types/studio';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    badgeText: '9:16 Durum & Kanal',
    description: '9:16 Kapak + 5 Panelli Carousel',
    supportedRatios: ['9:16'],
    defaultRatio: '9:16',
    coverLabel: '9:16 Hikâye / Durum Kapağı',
    carouselLabel: '9:16 5 Panelli Carousel',
    carouselCount: 5,
    hasSocialCopy: false,
    artDirection:
      'High-impact vertical mobile status design, instant 2-second readability, bold centered hierarchy, clean bottom safe zone for WhatsApp reply bar.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    badgeText: '9:16 • 4:5 • 16:9',
    description: 'Kapak + 5 Panelli Carousel + Metin/Etiket',
    supportedRatios: ['9:16', '4:5', '16:9'],
    defaultRatio: '4:5',
    coverLabel: 'Kapak Görseli',
    carouselLabel: '5 Panelli Carousel',
    carouselCount: 5,
    hasSocialCopy: true,
    artDirection:
      'Editorial dark-luxury Instagram aesthetic, scroll-stopping metallic typography, crisp swipe continuity across slides, balanced negative space.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    badgeText: '9:16 • 4:5 • 16:9',
    description: 'Kapak + 5 Panelli Carousel + Metin/Etiket',
    supportedRatios: ['9:16', '4:5', '16:9'],
    defaultRatio: '4:5',
    coverLabel: 'Kapak Görseli',
    carouselLabel: '5 Panelli Carousel',
    carouselCount: 5,
    hasSocialCopy: true,
    artDirection:
      'Trust-building corporate advisory layout, ultra-clear data contrast, authoritative headline hierarchy appealing to business owners and investors.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    badgeText: '9:16 • 4:5 • 16:9',
    description: 'Kapak + 5 Panelli Carousel + Metin/Etiket',
    supportedRatios: ['9:16', '4:5', '16:9'],
    defaultRatio: '4:5',
    coverLabel: 'Kapak Görseli',
    carouselLabel: '5 Panelli Executive Carousel',
    carouselCount: 5,
    hasSocialCopy: true,
    artDirection:
      'C-level executive consulting presentation style, structured institutional infographic feel, disciplined Swiss grid, brushed steel and cobalt accents.',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    badgeText: '9:16 • 4:5 • 16:9',
    description: 'Kapak + 5 Panelli Carousel + Metin/Etiket',
    supportedRatios: ['9:16', '4:5', '16:9'],
    defaultRatio: '16:9',
    coverLabel: 'Kapak Görseli',
    carouselLabel: '5 Panelli Thread Görselleri',
    carouselCount: 5,
    hasSocialCopy: true,
    artDirection:
      'Sharp high-contrast intelligence briefing card optimized for X timeline feeds, crisp analytical numbers and strong visual punch.',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    badgeText: '9:16 Kanal Serisi',
    description: '9:16 Kapak + 5 Panelli Carousel',
    supportedRatios: ['9:16'],
    defaultRatio: '9:16',
    coverLabel: '9:16 Kanal Kapağı',
    carouselLabel: '9:16 5 Panelli Carousel',
    carouselCount: 5,
    hasSocialCopy: false,
    artDirection:
      'High-density vertical briefing card designed for Telegram channel subscribers, sharp obsidian contrast, scannable data callouts.',
  },
  {
    id: 'banner',
    name: 'Banner Serisi',
    badgeText: '16:9 Yatay Seri',
    description: '16:9 Tekli Banner + 2 Panelli Yatay Carousel',
    supportedRatios: ['16:9'],
    defaultRatio: '16:9',
    coverLabel: '16:9 Tekli Banner',
    carouselLabel: '16:9 2 Panelli Yatay Banner Carousel',
    carouselCount: 2,
    hasSocialCopy: false,
    isBannerSeries: true,
    artDirection:
      'Widescreen 16:9 cinematic corporate banner, asymmetric luxury composition with strong focal subject on one side and crisp headline block on the other.',
  },
  {
    id: 'portfolio',
    name: 'Portfolyo Serisi',
    badgeText: '9:16 • 4:5 • 16:9',
    description: 'Portfolyo Kapak & 5 Panelli Carousel',
    supportedRatios: ['9:16', '4:5', '16:9'],
    defaultRatio: '4:5',
    coverLabel: 'Portfolyo Kapak Görseli',
    carouselLabel: '5 Panelli Portfolyo Carousel',
    carouselCount: 5,
    hasSocialCopy: false,
    artDirection:
      'Bespoke luxury asset & advisory portfolio showcase, architectural precision, studio spotlighting, understated prestige and institutional trust.',
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism Kart Serisi',
    badgeText: '3D Cam Estetiği',
    description: '9:16, 4:5, 16:9 Glassmorphism Kapak & 5 Panelli Carousel',
    supportedRatios: ['9:16', '4:5', '16:9'],
    defaultRatio: '4:5',
    coverLabel: '3D Glassmorphism Kapak',
    carouselLabel: '5 Panelli 3D Glassmorphism Carousel',
    carouselCount: 5,
    hasSocialCopy: false,
    artDirection:
      'Signature 3D frosted obsidian glassmorphism floating card aesthetic, specular cobalt-blue rim lighting, layered depth of field, glowing micro-bevels and titanium text.',
  },
];

export const PLATFORM_MAP: Record<PlatformId, PlatformConfig> = PLATFORMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<PlatformId, PlatformConfig>
);

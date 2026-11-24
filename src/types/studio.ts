export type DayId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PlatformId =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'x'
  | 'telegram'
  | 'banner'
  | 'portfolio'
  | 'glassmorphism';

export type AspectRatio = '9:16' | '4:5' | '16:9';

export type FramingMode = 'portrait' | 'waist-up' | 'full-body';

export type ImageModelId = 'gemini-nano-banana-2.1' | 'gemini-3-pro-image';

export type ImageSizeId = '1K' | '2K';

export interface DayTheme {
  dayId: DayId;
  dayName: string;
  shortName: string;
  title: string;
  subtitle: string;
  focusAreas: string[];
  authorities: string[];
  researchPromptFocus: string;
  visualSceneHint: string;
  slogan: string;
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  badgeText: string;
  description: string;
  supportedRatios: AspectRatio[];
  defaultRatio: AspectRatio;
  coverLabel: string;
  carouselLabel: string;
  carouselCount: number;
  hasSocialCopy: boolean;
  isBannerSeries?: boolean;
  artDirection: string;
}

export interface LogoAsset {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  dataUrl: string;
  updatedAt: number;
}

export interface ProfilePhotoAsset {
  id: string;
  name: string;
  framing: FramingMode;
  mimeType: string;
  base64: string;
  dataUrl: string;
  isDefault: boolean;
  createdAt: number;
}

export interface StudioSettings {
  apiKey: string;
  imageModel: ImageModelId;
  imageSize: ImageSizeId;
  autoGenerateCover: boolean;
}

export interface VerifiedSource {
  title: string;
  url: string;
}

export interface VerifiedMetric {
  label: string;
  value: string;
  sourceName: string;
  dateContext: string;
}

export interface VerifiedDailyData {
  dayId: DayId;
  dateKey: string;
  fetchedAt: number;
  headline: string;
  summary: string;
  metrics: VerifiedMetric[];
  keyFindings: string[];
  sources: VerifiedSource[];
  rawNotes?: string;
}

export interface SlideBrief {
  slideNumber: number;
  roleTitle: string;
  headline: string;
  subheadline: string;
  statHighlight?: string;
  visualDirection: string;
}

export interface ProductionBrief {
  platformId: PlatformId;
  dayId: DayId;
  aspectRatio: AspectRatio;
  generatedAt: number;
  cover: SlideBrief;
  slides: SlideBrief[];
  socialCaption: string;
  hashtags: string[];
}

export type VisualSlotKey =
  | 'cover'
  | 'slide-1'
  | 'slide-2'
  | 'slide-3'
  | 'slide-4'
  | 'slide-5';

export interface GeneratedImageAsset {
  slot: VisualSlotKey;
  ratio: AspectRatio;
  dataUrl: string;
  mimeType: string;
  promptUsed: string;
  createdAt: number;
  usedProfilePhoto: boolean;
  framing?: FramingMode;
}

export interface IstanbulDateInfo {
  dayId: DayId;
  dayName: string;
  formattedDate: string;
  dateKey: string;
  timeText: string;
}

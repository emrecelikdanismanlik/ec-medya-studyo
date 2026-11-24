import { BRAND_NAME, BRAND_PHONE, BRAND_WEBSITE } from '../data/themes';
import type {
  AspectRatio,
  DayTheme,
  FramingMode,
  PlatformConfig,
  SlideBrief,
  VerifiedDailyData,
} from '../types/studio';

export interface BuildImagePromptParams {
  platform: PlatformConfig;
  theme: DayTheme;
  ratio: AspectRatio;
  slide: SlideBrief;
  isCover: boolean;
  totalSlides: number;
  verifiedData: VerifiedDailyData | null;
  useProfilePhoto: boolean;
  framingMode: FramingMode;
}

const FRAMING_DESCRIPTIONS: Record<FramingMode, string> = {
  portrait:
    'Close-up to chest-up executive editorial portrait framing (Portre), crisp catchlights on glasses/eyes, sharp facial clarity, subtle depth-of-field background.',
  'waist-up':
    'Medium waist-up executive framing (Belden Yukarı), confident composed posture, seated or standing naturally in tailored attire with balanced negative space for typography.',
  'full-body':
    'Full-body luxury studio/architectural framing (Tam Boy), poised executive stance in tailored suit and polished shoes, clean architectural floor reflection and generous margin for text.',
};

const RATIO_LAYOUT_GUIDANCE: Record<AspectRatio, string> = {
  '9:16':
    'Vertical 9:16 mobile full-screen composition. Keep all headlines, body lines, logo, and CTA strictly inside the center 80% safe zone (avoiding top 10% and bottom 12% UI overlays).',
  '4:5':
    'Vertical 4:5 editorial feed composition. Crisp grid alignment with balanced top/bottom breathing room and clear left-or-top focal typography hierarchy.',
  '16:9':
    'Widescreen 16:9 cinematic horizontal composition. Asymmetric split layout: strong visual subject/portrait or 3D architectural glass scene on one side, ultra-clean left-aligned headline & data panel on the other.',
};

const CAROUSEL_ARC_GUIDANCE: Record<number, string> = {
  1: 'PANEL 1/5 — ÇARPICI BAŞLIK & KANCA: Bold magnetic Turkish hook headline that stops scrolling immediately, establishing institutional authority.',
  2: 'PANEL 2/5 — DOĞRULANMIŞ GÜNCEL VERİ / SORUN: Highlight the verified factual metric/problem clearly inside a clean dark glass data card with exact source attribution.',
  3: 'PANEL 3/5 — STRATEJİK ANALİZ & YAKLAŞIM: Visual comparison or structured insight showing multi-disciplinary strategic analysis.',
  4: 'PANEL 4/5 — UYGULANABİLİR ÇÖZÜM / ÖNERİ: Actionable 2-3 concise steps or roadmap inside sleek cobalt-rimmed glass steps.',
  5: 'PANEL 5/5 — KURUMSAL İMZA, RESMİ LOGO, SLOGAN VE CTA: Hero corporate closing slide featuring the official 3D EÇ logo prominently, brand slogan, and exact contact block: "Emre ÇELİK Danışmanlık Hizmeti", "+90 (540) 045 12 34", "kartvizit.bio/emrecelik".',
};

const BANNER_ARC_GUIDANCE: Record<number, string> = {
  1: 'YATAY BANNER 1/2 — ANA DEĞER ÖNERİSİ & VERİ KANCASI: Left-to-right widescreen hook showcasing the daily theme headline, verified insight, and Dark Obsidian 3D depth.',
  2: 'YATAY BANNER 2/2 — STRATEJİK ÇÖZÜM & KURUMSAL İMZA CTA: Concluding widescreen panel seamlessly matching Panel 1 palette, presenting actionable direction, official EÇ logo, slogan, "+90 (540) 045 12 34", and "kartvizit.bio/emrecelik".',
};

/**
 * Builds the complete prompt injected with mandatory identity, logo, Turkish typography,
 * factual grounding, and strict negative rules for Gemini Image Generation.
 */
export function buildMasterImagePrompt(params: BuildImagePromptParams): string {
  const {
    platform,
    theme,
    ratio,
    slide,
    isCover,
    totalSlides,
    verifiedData,
    useProfilePhoto,
    framingMode,
  } = params;

  const verifiedFactsLine = verifiedData
    ? verifiedData.metrics
        .slice(0, 3)
        .map((m) => `${m.label}: ${m.value} (${m.sourceName})`)
        .join(' | ')
    : 'Sayısal uydurma veri kullanma; yalnızca niteliksel stratejik mesaj ver.';

  const narrativeSection = isCover
    ? `COVER VISUAL (${platform.coverLabel}): High-prestige opening visual introducing "${slide.headline}". Make it immediately authoritative and unmistakable as ${BRAND_NAME}.`
    : platform.isBannerSeries
      ? BANNER_ARC_GUIDANCE[slide.slideNumber] ?? `BANNER SLIDE ${slide.slideNumber}/${totalSlides}`
      : CAROUSEL_ARC_GUIDANCE[slide.slideNumber] ?? `SLIDE ${slide.slideNumber}/${totalSlides}`;

  const identityLockSection = useProfilePhoto
    ? `
[MANDATORY %100 FACE IDENTITY LOCK — %100 YÜZ KİMLİĞİ KİLİDİ]:
- Reference Person Image(s) are attached in this request. Preserve the EXACT face identity, bone structure, eyes, eyebrows, glasses (if worn in reference), facial hair, head shape, and skin tone 100% identically to the reference photo(s).
- Do NOT morph, idealize into another person, age/de-age, or swap facial identity.
- ONLY adapt wardrobe and environment: dress the subject in a crisp tailored dark navy or anthracite executive blazer over a clean white crew-neck t-shirt (smart luxury executive style), and integrate seamlessly with natural studio rim lighting into the Dark Obsidian scene.
- Framing requirement: ${FRAMING_DESCRIPTIONS[framingMode]}`
    : `
[SCENE & SUBJECT DIRECTION (NO PERSON REFERENCE)]:
- Compose an ultra-modern Dark Obsidian architectural, financial, or 3D Glassmorphism centerpiece matching today's theme: ${theme.visualSceneHint}.
- Do NOT invent a random stock face or generic smiling person.`;

  const slideFooterInstruction =
    isCover || slide.slideNumber === totalSlides
      ? `Include clean, legible corporate signature footer: "${BRAND_NAME}" | "${BRAND_PHONE}" | "${BRAND_WEBSITE}".`
      : `Include subtle clean footer signature: "Emre ÇELİK Danışmanlık Hizmeti" and slide indicator "0${slide.slideNumber} / 0${totalSlides}".`;

  return `Create a luxury corporate social media graphic for "${BRAND_NAME}".

[PLATFORM & FORMAT]:
- Platform: ${platform.name} (${platform.artDirection})
- Target Aspect Ratio: ${ratio}
- ${RATIO_LAYOUT_GUIDANCE[ratio]}
- Narrative Role: ${narrativeSection}

[VISUAL STYLE SYSTEM — DARK OBSIDIAN 3D GLASSMORPHISM]:
- Palette: Deep matte obsidian & anthracite background (#0A0D12 to #111622), frosted translucent dark glass cards with subtle 1px cobalt-blue borders (#1D63ED to #0080FF) and crisp specular rim lighting.
- Typography: Sharp geometric sans-serif in brushed titanium white (#F5F7FA) and cobalt blue (#1D63ED / #0080FF) accents. Generous padding, zero text touching image edges.
- Daily Theme Atmosphere: ${theme.title} — ${theme.visualSceneHint}

[TEK RESMİ LOGO KİLİDİ — OFFICIAL EÇ LOGO LOCK]:
- An official reference image of the 3D metallic circular "EÇ" logo is attached.
- Reproduce ONLY this exact official circular 3D logo: metallic cobalt-blue outer ring, brushed silver geometric "E" on the left, cobalt-blue "Ç" on the right with its bottom cedilla dot (noktalı Ç) sharply preserved.
- Never omit the dot under Ç, never distort, flatten, or replace the logo with any other mark.

${identityLockSection}

[VERIFIED TURKISH COPY TO RENDER ON GRAPHIC — EXACT SPELLING]:
- Primary Headline (Large, crystal clear Turkish): "${slide.headline}"
- Supporting Subheadline / Body: "${slide.subheadline}"
${slide.statHighlight ? `- Highlighted Stat / Badge: "${slide.statHighlight}"` : ''}
- Scene Art Direction: ${slide.visualDirection}
- Grounded Verified Context (use ONLY these verified facts if displaying data, never invent numbers): ${verifiedFactsLine}
- ${slideFooterInstruction}

[RESMİ İLETİŞİM & KURUMSAL KİLİT]:
- Brand Name: ${BRAND_NAME}
- Phone: ${BRAND_PHONE}
- Web: ${BRAND_WEBSITE}
- Note: Use ONLY the exact phone and web URL above. Never invent any other address, email, phone, or URL.

[KESİN NEGATİF KURALLAR — STRICTLY FORBIDDEN]:
- NO misspelled, garbled, broken, clipped, or overflowing Turkish text; preserve every Turkish character accurately (Ç, Ğ, İ, Ö, Ş, Ü, ç, ğ, ı, ö, ş, ü — especially keep the cedilla dot on Ç).
- NO unverified or fabricated numbers/statistics.
- NO guaranteed profit or guaranteed return claims (KESİN KAZANÇ / GARANTİLİ GETİRİ İDDİASI YASAK).
- NO distorted or altered EÇ logo, NO third-party or legacy brand names (such as HOMEtime or any unrelated agency logo).
- NO dominant purple, pink, or green color schemes; NO excessive gold or cheap neon glow.
- NO cartoon, anime, plastic CGI, blurry face, deformed hands/fingers, crooked buildings, or low-resolution artifacts.`.trim();
}

import type { DayId, DayTheme } from '../types/studio';

export const BRAND_NAME = 'Emre ÇELİK Danışmanlık Hizmeti';
export const BRAND_SHORT_NAME = 'EMRE ÇELİK DANIŞMANLIK HİZMETİ';
export const BRAND_PHONE = '+90 (540) 045 12 34';
export const BRAND_WEBSITE = 'kartvizit.bio/emrecelik';
export const BRAND_MOTTO = 'Geleceği Şekillendiren Stratejiler, Hata Payını Sıfırlayan Sistematik Yaklaşımlar';

/**
 * Curated brand slogans derived from official Emre ÇELİK Danışmanlık documents,
 * keeping claims realistic and compliant (never promising guaranteed returns).
 */
export const BRAND_SLOGANS: string[] = [
  'Geleceği Şekillendiren Stratejiler, Hata Payını Sıfırlayan Sistematik Yaklaşımlar',
  'Strateji Netse, Sonuç Ölçülebilir.',
  'Doğru Hedef. Doğru Plan. Güçlü Uygulama.',
  'Sadece Mülk Değil, Güven ve Strateji İnşa Ediyoruz.',
  'Kararınızı Veriye Dayandırın; Geleceği Şansa Bırakmayın.',
  'Her Metrekarede Güven, Her Adımda Kurumsal Profesyonellik.',
  'Doğru Lokasyon, Doğru Değerleme, Doğru Danışman.',
  'Veri Odaklı Analizle Riski Yöneten Sistematik Yaklaşım.',
];

export const WEEKLY_THEMES: Record<DayId, DayTheme> = {
  1: {
    dayId: 1,
    dayName: 'Pazartesi',
    shortName: 'Pzt',
    title: 'Stratejik Finans & Yatırım Yönetimi',
    subtitle: 'Veri odaklı portföy yönetimi, ROI analizi, sermaye koruma ve risk yönetimi',
    focusAreas: [
      'Veri odaklı portföy mimarisi ve sermaye koruma',
      'Enflasyon karşısında reel getiri ve ROI optimizasyonu',
      'Makroekonomik risk analizi ve nakit akışı disiplini',
    ],
    authorities: ['TCMB', 'TÜİK', 'BDDK'],
    researchPromptFocus:
      'Türkiye güncel TCMB politika faizi ve enflasyon beklentileri, TÜİK son açıklanan TÜFE/ÜFE veya ekonomik güven endeksi verileri, BDDK güncel kredi/mevduat eğilimleri ve kurumsal sermaye yönetimi göstergeleri',
    visualSceneHint:
      'Dark obsidian luxury executive financial command room, translucent cobalt-blue 3D analytical glass charts and capital allocation grid, architectural glass reflections',
    slogan: 'Kararınızı Veriye Dayandırın; Sermayenizi Stratejik Sistemle Koruyun.',
  },
  2: {
    dayId: 2,
    dayName: 'Salı',
    shortName: 'Sal',
    title: 'Yapay Zekâ & Dijital Dönüşüm Entegrasyonu',
    subtitle: 'İş süreçlerine AI entegrasyonu, otomasyon iş akışları ve kurumsal verimlilik',
    focusAreas: [
      'Kurumsal iş akışlarına yapay zekâ ajanları ve otomasyon kurulumu',
      'Operasyonel hız, hata payını sıfırlayan veri boru hatları',
      'KOBİ ve danışmanlık süreçlerinde ölçülebilir dijital verimlilik',
    ],
    authorities: ['Güncel AI Raporları', 'Teknoloji Endeksleri'],
    researchPromptFocus:
      'Güncel küresel ve Türkiye kurumsal yapay zekâ benimseme oranları, AI otomasyon verimlilik istatistikleri, güvenilir teknoloji araştırma raporlarından (McKinsey, Gartner, Stanford AI Index, TÜİK bilişim) doğrulanmış güncel rakamlar',
    visualSceneHint:
      'Futuristic dark obsidian executive studio, glowing cobalt-blue neural node glass layers and clean holographic workflow schematics, precision lighting',
    slogan: 'Yarının İş Modellerini Yapay Zekâ ve Sistematik Otomasyonla Bugünden İnşa Edin.',
  },
  3: {
    dayId: 3,
    dayName: 'Çarşamba',
    shortName: 'Çar',
    title: 'Bölgesel Pazar İstihbaratı & Gayrimenkul/Ticari Alan Danışmanlığı',
    subtitle: 'İstanbul ve Anadolu Yakası arz-talep dengesi, rayiç değerler ve kentsel dönüşüm',
    focusAreas: [
      'İstanbul & Anadolu Yakası konut ve ticari mülk arz-talep dengesi',
      'Gerçek rayiç değer analizi, amortisman ve kira çarpanı disiplini',
      'Kentsel dönüşüm ve imar fırsatlarında bölgesel istihbarat',
    ],
    authorities: ['TÜİK', 'EİDS', 'TKGM', 'Resmi Gazete'],
    researchPromptFocus:
      'TÜİK son ay Türkiye ve İstanbul konut satış istatistikleri, EİDS (Elektronik İlan Doğrulama Sistemi) güncel uygulamaları, TKGM tapu işlem ve değerleme verileri, kentsel dönüşüm ve emlak vergisi / Resmi Gazete düzenlemeleri',
    visualSceneHint:
      'Modern Istanbul skyline and architectural luxury commercial tower at twilight in obsidian dark blue palette, subtle 3D urban data layers and glass blueprint panels',
    slogan: 'Sadece Metrekare Değil, Doğrulanmış Bölgesel Değer Ölçüyoruz.',
  },
  4: {
    dayId: 4,
    dayName: 'Perşembe',
    shortName: 'Per',
    title: 'Multimedya Prodüksiyon & Görsel Altyapı Danışmanlığı',
    subtitle: 'Marka kimliği, 3D/mimari sunum standartları, kreatif reklam ve sosyal medya stratejisi',
    focusAreas: [
      'Kurumsal otorite inşa eden 3D ve Glassmorphism görsel standartlar',
      'Gayrimenkul ve iş dünyası için yüksek dönüşümlü mimari sunum dili',
      'Sosyal medya algoritmalarına uyumlu kreatif prodüksiyon mimarisi',
    ],
    authorities: ['Dijital Pazarlama Trendleri', 'We Are Social / Sektör Raporları'],
    researchPromptFocus:
      'Güncel Türkiye ve küresel dijital pazarlama, kısa dikey video / carousel etkileşim oranları, 3D görsel sunumun marka güveni ve dönüşüm üzerindeki doğrulanmış istatistikleri',
    visualSceneHint:
      'Ultra-modern obsidian creative production studio, floating 3D metallic glass media frames, studio softbox cobalt rim lighting, architectural presentation panels',
    slogan: 'Markanızın Dijital Yüzünü Kurumsal Mükemmeliyet Standartlarıyla Şekillendirin.',
  },
  5: {
    dayId: 5,
    dayName: 'Cuma',
    shortName: 'Cum',
    title: 'Kurumsal Otorite, Hukuki/Teknik Risk & Süreç Optimizasyonu',
    subtitle: 'EİDS, mevzuat uyumu ve hata payını sıfırlayan operasyonel sistemler',
    focusAreas: [
      'EİDS yetki doğrulaması ve Ticaret Bakanlığı mevzuatına tam uyum',
      'Tapu, sözleşme ve imar süreçlerinde hukuki/teknik risk eliminasyonu',
      'Hata payını en aza indiren uçtan uca kurumsal kontrol listeleri',
    ],
    authorities: ['Resmi Gazete', 'Ticaret Bakanlığı', 'TKGM'],
    researchPromptFocus:
      'Ticaret Bakanlığı EİDS (Elektronik İlan Doğrulama Sistemi) kiralık/satılık taşınmaz düzenlemeleri, Resmi Gazete güncel taşınmaz ticareti / tapu harcı / sözleşme mevzuatı ve TKGM web-tapu güvenlik standartları',
    visualSceneHint:
      'Prestigious dark obsidian executive boardroom, brushed titanium legal-compliance shield motif, cobalt-lit glass verification documents and digital seal',
    slogan: 'Doğru Ekspertiz ve Mevzuat Uyumu ile Sıfır Hata Payı: Emre ÇELİK Güvencesiyle.',
  },
  6: {
    dayId: 6,
    dayName: 'Cumartesi',
    shortName: 'Cmt',
    title: 'Bireysel Girişim & Alternatif Kazanç Stratejileri',
    subtitle: 'Kişiye özel girişim modelleri, portföy çeşitlendirme ve rekabet avantajı',
    focusAreas: [
      'KOSGEB ve güncel girişimcilik destek programlarının stratejik kullanımı',
      'Tek gelire bağlı kalmayan dengeli portföy ve ticari iş modelleri',
      'Bireysel yatırımcılar için ölçeklenebilir rekabet avantajı planlaması',
    ],
    authorities: ['KOSGEB', 'Girişimcilik & Teşvik Raporları'],
    researchPromptFocus:
      'KOSGEB güncel girişimci destek limitleri ve programları, Türkiye güncel KOBİ / startup teşvik raporları ve bireysel girişimcilik ekosistemindeki doğrulanmış destek verileri',
    visualSceneHint:
      'Sleek dark obsidian modern workspace overlooking city lights, ascending 3D cobalt-blue geometric milestones and frosted glass venture roadmap panels',
    slogan: 'Ölçülebilir Yol Haritasıyla Bireysel Potansiyelinizi Sürdürülebilir Değere Dönüştürün.',
  },
  0: {
    dayId: 0,
    dayName: 'Pazar',
    shortName: 'Paz',
    title: 'Vizyoner Özet & Haftalık Stratejik Değerlendirme',
    subtitle: 'Haftanın öne çıkan finans, gayrimenkul ve teknoloji gelişmelerinin makro özeti',
    focusAreas: [
      'Haftanın öne çıkan finansal, mevzuat ve piyasa başlıklarının sentezi',
      'Gayrimenkul, AI dönüşümü ve yatırım ekseninde yeni hafta yol haritası',
      'Makro ölçekte düşünen, mikro ölçekte uygulayan kurumsal vizyon',
    ],
    authorities: ['TCMB', 'TÜİK', 'Resmi Gazete', 'Teknoloji Raporları'],
    researchPromptFocus:
      'Bu hafta Türkiye ve küresel ekonomide öne çıkan en güncel TCMB/TÜİK makro gelişmeleri, gayrimenkul ve yapay zekâ sektöründeki doğrulanmış haftalık başlıklar',
    visualSceneHint:
      'Panoramic dark obsidian observatory lounge, subtle glowing cobalt strategic compass and sleek glass briefing cards summarizing finance, real estate, and AI',
    slogan: 'Makro Ölçekte Düşünür, Mikro Ölçekte Uygularız: Yeni Haftaya Stratejik Hazırlık.',
  },
};

export const ORDERED_DAYS: DayId[] = [1, 2, 3, 4, 5, 6, 0];

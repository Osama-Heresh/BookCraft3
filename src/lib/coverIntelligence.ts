import { BookProject, CoverConcept, CoverConfig, CoverLayoutFamily, PaperStock, BindingMethod, SpineCalculation } from '../types';
import { VISUAL_ASSETS } from './visualAssetLibrary';

export class CoverIntelligenceEngine {
  /**
   * Generates 3 fundamentally distinct, manuscript-aware cover concepts.
   */
  public static generateCoverConcepts(book: BookProject): CoverConcept[] {
    const isArabic = book.language === 'ar' || /[\u0600-\u06FF]/.test(book.title);
    const category = book.category || 'General';

    if (isArabic || category.includes('History') || book.title.includes('تاريخ')) {
      return [
        {
          id: 'concept-heritage-illuminated',
          conceptName: 'Classical Andalusian Illumination',
          conceptNameAr: 'التذهيب والزخرفة الأندلسية الكلاسيكية',
          category: 'Cultural & Heritage',
          visualTheme: 'Ornate Islamic arabesque geometric arch with genuine gold leaf filigree and parchment texture.',
          visualThemeAr: 'عقد أندلسي مزخرف بتوريق نباتي وهندسي مذهب يعكس هيبة المخطوطات القرطبية التاريخية.',
          description: 'Prestigious classical cover balancing illuminated borders with dedicated central medallion for calligraphy.',
          descriptionAr: 'تصميم تراثي فخم يبرز عنوان الكتاب داخل إطار مذهب متناسق مع الحفاظ على وقار العمل العلمي.',
          focalPoint: 'Gilded Central Arch Medallion',
          focalPointAr: 'الميدالية المركزية المذهبة المحتضنة لاسم الكتاب',
          palette: ['#065F46', '#C8A96B', '#FCF9F2', '#0F2942'],
          recommendedArtworkUrl: '/assets/images/arabic_heritage_cover_1792360788309.jpg',
          recommendedLayout: 'premium-heritage',
          contrastMode: 'dark',
          lightingMood: 'Warm museum archive lighting with golden leaf reflections',
        },
        {
          id: 'concept-heritage-editorial',
          conceptName: 'Modern Arabic Editorial Nonfiction',
          conceptNameAr: 'التحرير الصحفي العصري الرصين',
          category: 'Modern Editorial',
          visualTheme: 'Deep teal and warm amber asymmetrical grid with crisp white typographic panel and historical astronomical motif.',
          visualThemeAr: 'شبكة عصرية بتدرجات الفيروزي العميق والكهرماني مع شريط عنوان ناصع وأدوات رصد فلكية دقيقة.',
          description: 'Contemporary aesthetic tailored for modern historical readers, providing maximum legibility at thumbnail and shelf.',
          descriptionAr: 'طابع معاصر يلائم الإصدارات الوثائقية والحديثة، يضمن وضوحاً فائقاً للعنوان في المعارض والمتاجر الرقمية.',
          focalPoint: 'Asymmetrical Title Pillar & Astrolabe Iconography',
          focalPointAr: 'الشريط الطباعي الجانبي وأيقونة الأسطرلاب التاريخي',
          palette: ['#0F766E', '#F59E0B', '#0F172A', '#F8FAFC'],
          recommendedArtworkUrl: '/assets/images/historical_astronomy_scene_1792360789067.jpg',
          recommendedLayout: 'editorial-split',
          contrastMode: 'dark',
          lightingMood: 'Crisp studio split lighting with deep contrast',
        },
        {
          id: 'concept-heritage-minimal',
          conceptName: 'Restrained Literary Monochrome',
          conceptNameAr: 'الأدبي المصغر بنقاء الحرف العربي',
          category: 'Literary & Minimalist',
          visualTheme: 'Parchment cream paper with black ink traditional Arabic calligraphy and single terracotta seal stamp.',
          visualThemeAr: 'أرضية عاجية كلاسيكية مع خط عربي رصين وخاتم تراثي أحمر داكن كعلامة توثيقية حصرية.',
          description: 'Sublime literary restraint where the power of Arabic typography and negative space commands reverence.',
          descriptionAr: 'نقاء بصري استثنائي يمنح الحرف العربي كامل السيادة والهيبة دون زخارف زائدة تشوش على المعنى.',
          focalPoint: 'Hand-Lettered Master Title & Verification Seal',
          focalPointAr: 'العنوان الرئيس المحكم وخاتم الإجازة التوثيقية',
          palette: ['#18181B', '#9A3412', '#FAF7F2', '#71717A'],
          recommendedLayout: 'minimal-typographic',
          contrastMode: 'light',
          lightingMood: 'Soft natural ambient gallery daylight',
        },
      ];
    }

    // Technology / Science / Business
    return [
      {
        id: 'concept-tech-neural',
        conceptName: 'Autonomous Neural Convergence',
        conceptNameAr: 'التلاقي العصبي للأنظمة الذاتية',
        category: 'Technology & AI',
        visualTheme: 'Luminous neural network core converging with geometric architectural crystalline lattice in deep indigo and cobalt.',
        visualThemeAr: 'جوهر شبكة عصبية مضيئة يتلاقى مع شبكة بلورية هندسية ثلاثية الأبعاد تعبر عن الذكاء الاصطناعي السيبراني.',
        description: 'Immersive technological artwork with clear negative space specifically proportioned for high-impact title typography.',
        descriptionAr: 'لوحة بصرية تقنية مبهرة تترك مساحة علوية هادئة تضمن قراءة العنوان بتباين استثنائي.',
        focalPoint: 'Pulsing Neural Synapse Core',
        focalPointAr: 'نواة التوصيلات العصبية المضيئة',
        palette: ['#0F172A', '#0EA5E9', '#10B981', '#38BDF8'],
        recommendedArtworkUrl: '/assets/images/tech_ai_cover_1792360786835.jpg',
        recommendedLayout: 'full-bleed-hero',
        contrastMode: 'dark',
        lightingMood: 'Deep cosmic studio volumetric glow',
      },
      {
        id: 'concept-executive-luxury',
        conceptName: 'Architectural Executive Invariant',
        conceptNameAr: 'الصرح التنفيذي والريادة المؤسسية',
        category: 'Business & Leadership',
        visualTheme: 'Minimalist modern architectural sculpture in brushed titanium and warm stone with champagne gold lighting.',
        visualThemeAr: 'صرح معماري تجريدي من التيتانيوم المصقول والحجر مع إضاءة ذهبية موجهة ترمز للرسوخ القيادي.',
        description: 'Sophisticated executive positioning suited for C-suite publications, whitepapers, and authoritative industry guides.',
        descriptionAr: 'هوية قيادية فاخرة تخاطب صناع القرار والمؤسسات الكبرى بأسلوب بصري يفيض بالثقة والمهنية.',
        focalPoint: 'Ascending Geometric Monolith',
        focalPointAr: 'الكتلة الهندسية الصاعدة نحو النور',
        palette: ['#0F172A', '#D4AF37', '#334155', '#FDFDFC'],
        recommendedArtworkUrl: '/assets/images/luxury_business_cover_1792360789095.jpg',
        recommendedLayout: 'luxury-professional',
        contrastMode: 'dark',
        lightingMood: 'Dramatic directional beam with warm champagne reflections',
      },
      {
        id: 'concept-systems-schematic',
        conceptName: 'High-Precision Systems Schematic',
        conceptNameAr: 'المخطط الهندسي للمنظومات المعقدة',
        category: 'Engineering & Science',
        visualTheme: 'Mathematical grid layout with verified multi-tiered architecture diagram and structured technical metadata.',
        visualThemeAr: 'شبكة هندسية دقيقة تضم رسماً معمارياً للمنظومة مع حواشٍ رقمية ووسوم تحقق معيارية.',
        description: 'Disciplined academic and engineering presentation separating theoretical proofs from pragmatic implementation.',
        descriptionAr: 'تنسيق أكاديمي رصين ومتقن يفصل الأسس النظرية عن براهين التطبيق الميداني بدقة متناهية.',
        focalPoint: 'Cognitive Reasoning Loop Schematic',
        focalPointAr: 'مخطط حلقة الاستدلال المعرفي والبرمجة الحتمية',
        palette: ['#0A0A0A', '#D97706', '#0284C7', '#E2E8F0'],
        recommendedArtworkUrl: '/assets/images/ai_agents_diagram_1792360790515.jpg',
        recommendedLayout: 'editorial-split',
        contrastMode: 'dark',
        lightingMood: 'Clean industrial instrument illumination',
      },
    ];
  }

  /**
   * Calculates spine width and full print spread geometry from actual paper stock and binding specs.
   * Standard paper PPI (Pages Per Inch) and thickness values:
   * 50# White Offset: 512 PPI (~0.0496 mm/page -> ~0.0992 mm/sheet for double-sided)
   * 60# Cream: 434 PPI (~0.0585 mm/page -> ~0.117 mm/sheet)
   * 70# White: 384 PPI (~0.0661 mm/page -> ~0.132 mm/sheet)
   * 80# Gloss: 350 PPI (~0.0725 mm/page -> ~0.145 mm/sheet)
   */
  public static calculateSpine(
    pageCount: number = 200,
    paperStock: PaperStock = '60_cream',
    bindingMethod: BindingMethod = 'perfect_paperback',
    trimWidthMm: number = 152.4, // 6 in
    trimHeightMm: number = 228.6 // 9 in
  ): SpineCalculation {
    const pages = Math.max(pageCount, 24);
    const sheets = Math.ceil(pages / 2);

    let sheetThicknessMm = 0.117; // default 60# cream
    if (paperStock === '50_white') sheetThicknessMm = 0.0992;
    else if (paperStock === '60_cream') sheetThicknessMm = 0.117;
    else if (paperStock === '70_white') sheetThicknessMm = 0.132;
    else if (paperStock === '80_gloss') sheetThicknessMm = 0.145;

    // Hardcover adds binder board thickness (~2.5mm total board + hinge allowance)
    const bindingAllowanceMm = bindingMethod === 'case_hardcover' ? 3.0 : 0.8;
    const rawSpine = sheets * sheetThicknessMm + bindingAllowanceMm;
    const spineWidthMm = Math.round(rawSpine * 10) / 10;

    // Minimum spine width for legible printed text is typically 6.5 - 7.0 mm
    const hasSpineText = spineWidthMm >= 6.8;

    const bleedMm = 3.175; // 0.125 inches standard commercial print bleed
    const safeMarginMm = 6.35; // 0.25 inches safe live text margin

    // Full cover spread: Bleed + Back Cover + Spine + Front Cover + Bleed
    const fullCoverWidthMm = Math.round((bleedMm * 2 + trimWidthMm * 2 + spineWidthMm) * 10) / 10;
    const fullCoverHeightMm = Math.round((bleedMm * 2 + trimHeightMm) * 10) / 10;

    return {
      pageCount: pages,
      paperStock,
      bindingMethod,
      pageThicknessMm: sheetThicknessMm / 2,
      spineWidthMm,
      hasSpineText,
      safeMarginMm,
      bleedMm,
      fullCoverWidthMm,
      fullCoverHeightMm,
    };
  }
}

import { DesignSystem, PageTemplateInfo } from '../types';

export const PAGE_TEMPLATES: PageTemplateInfo[] = [
  {
    id: 'chapter-opener',
    name: 'Chapter Opener Spread',
    nameAr: 'مطلع الفصل المزدوج',
    tagline: 'Hero chapter title with distinctive identity',
    taglineAr: 'استهلال الفصل مع هوية بصرية متميزة',
    description: 'Dramatic opening spread with oversized chapter numeral/arch, prominent title panel, and styled drop cap.',
    descriptionAr: 'صفحة افتتاحية لافتة تضم ترقيم الفصل، وعنواناً مؤطراً متناسقاً، وحرفاً استهلالياً مكبّراً.',
  },
  {
    id: 'text-callout',
    name: 'Text & Key Concept Callout',
    nameAr: 'المتن مع صندوق الإبراز المعرفي',
    tagline: 'Reading cadence with illuminated takeaway box',
    taglineAr: 'إيقاع قراءة مريح مع صندوق للأفكار الجوهرية',
    description: 'Harmonious long-form reading typography paired with a high-impact quotation or foundational rule box.',
    descriptionAr: 'تنسيق قراءة متزن للنصوص الطويلة مدعوماً بصندوق إبراز للمفاهيم الذهبية أو الاقتباسات الرنانة.',
  },
  {
    id: 'two-column-framework',
    name: 'Multi-Column & Framework Matrix',
    nameAr: 'المصفوفة التحليلية ونقاط التركيز',
    tagline: 'Structured multi-point grid & comparison cards',
    taglineAr: 'شبكة متعددة الأعمدة وبطاقات مقارنة منظمة',
    description: 'Editorial grid presenting structured principles, numbered pillar cards, and comparative frameworks.',
    descriptionAr: 'توزيع شبكي منظم يعرض المبادئ الأساسية، وبطاقات الركائز المرقمة، وأطر المقارنة الواضحة.',
  },
  {
    id: 'figure-caption',
    name: 'Figure & Analytical Breakdown',
    nameAr: 'الشكل البياني والتوضيح التحليلي',
    tagline: 'Full-spread diagram with descriptive metadata',
    taglineAr: 'مخطط بصري عريض مع حواشي تفسيرية دقيقة',
    description: 'Integrated visual figure page with architectural caption strip, category tag, and surrounding analytical prose.',
    descriptionAr: 'صفحة شكل توضيحي مدمجة مع شريط تعليق تحليلي، ووسم تصنيفي، ونصوص شرح محكمة.',
  },
  {
    id: 'summary-takeaways',
    name: 'Executive Summary & Checklist',
    nameAr: 'ملخص الفصل وقائمة التطبيق العملي',
    tagline: 'Key takeaways with review questions & checklist',
    taglineAr: 'خلاصات الفصل مع أسئلة مراجعة وقائمة تدقيق',
    description: 'Structured conclusion spread with numbered key takeaways, action checklist, and self-assessment prompts.',
    descriptionAr: 'صفحة ختامية مميزة تضم النقاط الجوهرية، وقائمة بنود التنفيذ العملي، وأسئلة التدريب والتقييم.',
  },
];

export const DESIGN_FAMILIES: DesignSystem[] = [
  {
    id: 'premium-arabic-heritage',
    name: 'Premium Arabic Heritage',
    nameAr: 'التراث العربي الفاخر',
    category: 'Cultural & History',
    description: 'Refined classical Arabic typography, ornate geometric Islamic motifs, gold and emerald accents, and warm parchment paper.',
    descriptionAr: 'طباعة كلاسيكية أصيلة، زخارف هندسية إسلامية مذهبة، درجات الأخضر الزمردي والورق العاجي الفاخر.',
    bodyFont: "'Amiri', 'EB Garamond', serif",
    headingFont: "'Amiri', 'Cairo', serif",
    primaryAccent: '#065F46', // Emerald Green
    secondaryAccent: '#C8A96B', // Gold Leaf
    pageBackground: '#FCF9F2', // Warm Parchment
    textColor: '#1A2E26',
    trimSize: '6x9',
    sampleQuote: 'A book is a companion that does not flatter, and a friend that does not tire.',
    sampleQuoteAr: 'الكتاب وعاءٌ مُلئ علمًا، وظَرف حُشي ظَرفًا، وبستانٌ يُحمَل في كم.',
    chapterStyle: 'arch',
    headerStyle: 'ornate-divider',
    ornamentStyle: 'islamic-geometric',
  },
  {
    id: 'modern-arabic-editorial',
    name: 'Modern Arabic Editorial',
    nameAr: 'التحرير الصحفي العصري',
    category: 'Nonfiction & Essays',
    description: 'Contemporary Arabic typography with asymmetric layout grids, prominent vertical accent bars, and crisp section pills.',
    descriptionAr: 'تنسيق تحريري متطور مع شبكات غير متناظرة، وشريط جانبي ملون بارز، وعناوين ذات حضور حداثي.',
    bodyFont: "'Cairo', 'Inter', sans-serif",
    headingFont: "'Cairo', sans-serif",
    primaryAccent: '#0F766E', // Deep Teal
    secondaryAccent: '#F59E0B', // Warm Amber
    pageBackground: '#FFFFFF',
    textColor: '#0F172A',
    trimSize: '6x9',
    sampleQuote: 'Transforming specialized expertise into an enduring published volume requires optical rhythm.',
    sampleQuoteAr: 'تحويل الخبرة المتخصصة إلى مؤلف خالد يتطلب تناغمًا بصريًا دقيقًا بين الحبر والمساحات البيضاء.',
    chapterStyle: 'asymmetric-bar',
    headerStyle: 'asymmetric-pill',
    ornamentStyle: 'modern-line',
  },
  {
    id: 'luxury-professional',
    name: 'Luxury Professional',
    nameAr: 'التميز التنفيذي الفاخر',
    category: 'Business & Leadership',
    description: 'Restrained elegance, midnight slate and champagne gold hairline double rules, executive summary cards, and refined folios.',
    descriptionAr: 'فخامة هادئة، خطوط مزدوجة ذهبية رفيعة، أزرق كحلي ملكي، وبطاقات إيجاز تنفيذي رفيعة المستوى.',
    bodyFont: "'EB Garamond', Georgia, serif",
    headingFont: "'Cinzel', 'Cairo', serif",
    primaryAccent: '#0F172A', // Midnight Slate
    secondaryAccent: '#D4AF37', // Champagne Gold
    pageBackground: '#FDFDFC',
    textColor: '#1E293B',
    trimSize: '6x9',
    sampleQuote: 'Strategy without rigorous execution is merely the hallucination of progress.',
    sampleQuoteAr: 'الاستراتيجية بلا تنفيذ محكم ليست سوى وهم الإنجاز.',
    chapterStyle: 'luxury-rule',
    headerStyle: 'hairline-rule',
    ornamentStyle: 'hairline',
  },
  {
    id: 'minimalist-editorial',
    name: 'Minimalist Editorial',
    nameAr: 'التحرير البسيط الراقي',
    category: 'Philosophy & Essays',
    description: 'Pure typographic restraint, generous white space, stark charcoal with warm terracotta accents, and airy margins.',
    descriptionAr: 'نقاء بصري فائق، التخلي عن الزخارف الفائضة لصالح فخامة الحرف والمساحات البيضاء الرحبة.',
    bodyFont: "'EB Garamond', 'Amiri', serif",
    headingFont: "'Inter', sans-serif",
    primaryAccent: '#18181B', // Zinc Black
    secondaryAccent: '#9A3412', // Terracotta Ochre
    pageBackground: '#FFFFFF',
    textColor: '#27272A',
    trimSize: '6x9',
    sampleQuote: 'Perfection is achieved when there is nothing left to take away.',
    sampleQuoteAr: 'تتحقق البلاغة حين لا تجد كلمةً يمكنك الاستغناء عنها.',
    chapterStyle: 'minimal',
    headerStyle: 'minimal-clean',
    ornamentStyle: 'none',
  },
  {
    id: 'visual-learning-workbook',
    name: 'Visual Learning & Workbook',
    nameAr: 'التعلم البصري ودليل التدريب',
    category: 'Education & Manuals',
    description: 'Structured modular blocks, illustrated step cards, key takeaway callouts, exercise checklists, and diagram flows.',
    descriptionAr: 'كتل تعلم مقسمة، بطاقات خطوات مصورة، صناديق للقواعد الذهبية، وقوائم مراجعة للممارس العملي.',
    bodyFont: "'Inter', 'Cairo', sans-serif",
    headingFont: "'Cairo', 'Inter', sans-serif",
    primaryAccent: '#1D4ED8', // Royal Cobalt
    secondaryAccent: '#F59E0B', // Amber Gold
    pageBackground: '#FFFFFF',
    textColor: '#1E293B',
    trimSize: 'a4',
    sampleQuote: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
    sampleQuoteAr: 'قل لي وسأنسى، علمني وسأتذكر، أشركني وسأتعلم.',
    chapterStyle: 'workbook-card',
    headerStyle: 'badge-tracker',
    ornamentStyle: 'bold-block',
  },
  {
    id: 'image-led-editorial',
    name: 'Image-Led Editorial',
    nameAr: 'الافتتاحيات المصورة والسرد البصري',
    category: 'Visual & Arts',
    description: 'Magazine-grade editorial spreads, dramatic hero artwork headers, floating pull-quote ribbons, and structured captions.',
    descriptionAr: 'تنسيق مجلات عالمية، صور افتتاحية عريضة، أشرطة اقتباس عائمة، وبطاقات تعليق محكمة.',
    bodyFont: "'Inter', sans-serif",
    headingFont: "'Inter', 'Cairo', sans-serif",
    primaryAccent: '#E11D48', // Editorial Rose / Crimson
    secondaryAccent: '#0284C7', // Sky Blue
    pageBackground: '#FAFAFA',
    textColor: '#18181B',
    trimSize: 'a4',
    sampleQuote: 'Visual storytelling does not decorate text; it deepens comprehension.',
    sampleQuoteAr: 'السرد البصري ليس زينةً للنص، بل هو روحٌ تعمّق الفهم وتستقر في الوجدان.',
    chapterStyle: 'photo-hero',
    headerStyle: 'caption-strip',
    ornamentStyle: 'modern-line',
  },
  {
    id: 'academic-research',
    name: 'Academic & Research',
    nameAr: 'البحث الأكاديمي والتوثيق',
    category: 'Academic & Science',
    description: 'Disciplined academic hierarchy, dual running headers, formal citation callouts, footnote rules, and methodological rigor.',
    descriptionAr: 'تدرج أكاديمي معياري، ترويسة مزدوجة، صناديق للأطر المنهجية، وحواشي توثيق علمية صارمة.',
    bodyFont: "'Times New Roman', 'Amiri', serif",
    headingFont: "'EB Garamond', 'Cairo', serif",
    primaryAccent: '#1E293B', // Slate Navy
    secondaryAccent: '#475569', // Cool Gray
    pageBackground: '#FCFCFD',
    textColor: '#0F172A',
    trimSize: 'a4',
    sampleQuote: 'Empirical verification distinguishes conjecture from enduring principle.',
    sampleQuoteAr: 'البرهان العلمي هو الفيصل بين الفرضية العابرة والحقيقة الراسخة.',
    chapterStyle: 'academic-frame',
    headerStyle: 'dual-academic-rule',
    ornamentStyle: 'hairline',
  },
  {
    id: 'bold-contemporary',
    name: 'Bold Contemporary',
    nameAr: 'المعاصر الجريء',
    category: 'Design & Technology',
    description: 'Massive expressive chapter numbers, high-contrast black and electric cyan/amber, sharp geometric dividers, and bold energy.',
    descriptionAr: 'أرقام فصول عملاقة لافتة، تباين لوني جريء بين الأسود والكهرماني، وفواصل هندسية حادة.',
    bodyFont: "'Inter', sans-serif",
    headingFont: "'JetBrains Mono', 'Inter', monospace",
    primaryAccent: '#0A0A0A', // Pitch Black
    secondaryAccent: '#D97706', // Electric Amber
    pageBackground: '#FFFFFF',
    textColor: '#171717',
    trimSize: '6x9',
    sampleQuote: 'Simplicity is not the lack of clutter; it is the presence of purpose.',
    sampleQuoteAr: 'البساطة الهندسية والوضوح الجريء هما روح الابتكار الحقيقي.',
    chapterStyle: 'bold-numeral',
    headerStyle: 'solid-contrast-tab',
    ornamentStyle: 'bold-block',
  },
  {
    id: 'illustrated-narrative',
    name: 'Illustrated Narrative',
    nameAr: 'السرد الأدبي المصور',
    category: 'Memoir & Narrative',
    description: 'Warm literary proportions, floral/vignette chapter heads, centered lyrical pull quotes, and intimate reading atmosphere.',
    descriptionAr: 'أبعاد أدبية شاعريّة، استهلالات مؤطرة بزخارف نباتية لطيفة، واقتباسات وسطية تأسر الفؤاد.',
    bodyFont: "'EB Garamond', 'Amiri', serif",
    headingFont: "'Cinzel', 'Amiri', serif",
    primaryAccent: '#581C87', // Royal Plum
    secondaryAccent: '#C8A96B', // Antique Gold
    pageBackground: '#FFFEFA',
    textColor: '#2E1065',
    trimSize: '6x9',
    sampleQuote: 'We do not remember days; we remember moments etched into the soul.',
    sampleQuoteAr: 'نحن لا نتذكر الأيام المجردة، بل اللحظات الخالدة المنقوشة في الوجدان.',
    chapterStyle: 'narrative-vignette',
    headerStyle: 'delicate-italic',
    ornamentStyle: 'botanical-flourish',
  },
];

// Alias map for backwards compatibility with any projects created with earlier IDs
const ID_ALIASES: Record<string, string> = {
  'historical-archive': 'premium-arabic-heritage',
  'modern-editorial': 'modern-arabic-editorial',
  'business-executive': 'luxury-professional',
  'minimalist-literary': 'minimalist-editorial',
  'educational-illustrated': 'visual-learning-workbook',
  'healthcare-professional': 'image-led-editorial',
  'technical-engineering': 'bold-contemporary',
  'biography-memoir': 'illustrated-narrative',
};

export function getDesignFamily(familyId: string | undefined): DesignSystem {
  if (!familyId) return DESIGN_FAMILIES[0];
  const resolvedId = ID_ALIASES[familyId] || familyId;
  const match = DESIGN_FAMILIES.find((d) => d.id === resolvedId || d.id === familyId);
  return match || DESIGN_FAMILIES[0];
}

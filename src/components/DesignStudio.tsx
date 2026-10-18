import React, { useState } from 'react';
import {
  Palette,
  Check,
  BookOpen,
  Layout,
  Columns,
  Eye,
  Sparkles,
  Quote,
  ListChecks,
  Image as ImageIcon,
  Bookmark,
  FileText,
  CheckCircle2,
  Sliders,
  Layers,
} from 'lucide-react';
import { BookProject, Chapter, DesignSystem, PageTemplateId, TrimSize } from '../types';
import { Language, translations } from '../lib/i18n';
import { DESIGN_FAMILIES, PAGE_TEMPLATES, getDesignFamily } from '../lib/designFamilies';

interface DesignStudioProps {
  book: BookProject;
  chapters: Chapter[];
  onUpdateBook: (updated: Partial<BookProject>) => void;
  language: Language;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({
  book,
  chapters,
  onUpdateBook,
  language,
}) => {
  const t = translations[language];

  const currentFamilyId = book.designFamily || 'premium-arabic-heritage';
  const selectedFamily = getDesignFamily(currentFamilyId);

  const [activeTemplate, setActiveTemplate] = useState<PageTemplateId>(
    book.preferredPageTemplate || 'chapter-opener'
  );
  const [spreadMode, setSpreadMode] = useState<'single' | 'two-page'>('two-page');
  const [showDropCaps, setShowDropCaps] = useState(true);

  const isArabic = book.language === 'ar' || language === 'ar';
  const isRtl = isArabic;

  const previewChapter = chapters[0] || {
    title: isArabic ? 'مدخل إلى النظام المعرفي والتأسيس' : 'Foundations of Modern Architecture',
    subtitle: isArabic ? 'المفاهيم النظرية والأطر التأسيسية للمؤلف' : 'Principles, Invariants, and Formal Methods',
    userEditedContent: isArabic
      ? 'يعد توثيق المعرفة الإنسانية وتحويلها إلى مؤلفات منشورة ركيزة أساسية في بناء الحضارة وتراكم الخبرات العلمية. لا يقتصر النشر على نقل المعلومات، بل يتعداه إلى صياغة الأفكار في قالب بصري وطباعي يحفظ هيبتها وييسر استيعابها لدى القارئ، محققاً التوازن الدقيق بين الحبر والمساحات البيضاء التي تتنفس من خلالها الكلمات.'
      : 'Transforming specialized expertise into an enduring published volume requires more than raw text; it demands an architectural harmony between typography, whitespace, and reader cadence. True typographic discipline does not call attention to itself—it elevates the author voice and brings lasting gravitas to every page.',
  };

  const handleSelectFamily = (family: DesignSystem) => {
    onUpdateBook({
      designFamily: family.id,
      trimSize: family.trimSize,
    });
  };

  const handleSelectTemplate = (templateId: PageTemplateId) => {
    setActiveTemplate(templateId);
    onUpdateBook({ preferredPageTemplate: templateId });
  };

  const handleTrimSizeChange = (trimSize: TrimSize) => {
    onUpdateBook({ trimSize });
  };

  // Family styling tokens
  const primary = selectedFamily.primaryAccent;
  const secondary = selectedFamily.secondaryAccent;
  const bg = selectedFamily.pageBackground;
  const textColor = selectedFamily.textColor || '#1E293B';
  const headingFont = isArabic ? 'var(--font-arabic)' : selectedFamily.headingFont;
  const bodyFont = isArabic ? 'var(--font-arabic-serif)' : selectedFamily.bodyFont;

  // Render decorative header based on family
  const renderHeader = (pageNumber: number, titleText: string, isVerso: boolean) => {
    const style = selectedFamily.headerStyle;

    if (style === 'ornate-divider') {
      return (
        <div className="flex flex-col gap-1 w-full text-[10px] pb-2 border-b" style={{ borderColor: `${secondary}60` }}>
          <div className="flex items-center justify-between text-slate-700 font-semibold" style={{ color: primary }}>
            <span className="font-mono text-xs">{pageNumber}</span>
            <span className="truncate max-w-[200px] tracking-wide" style={{ fontFamily: headingFont }}>
              {titleText}
            </span>
            <span className="text-[10px] opacity-75">{isVerso ? '❖' : '✦'}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 opacity-60">
            <span className="h-[1px] flex-1" style={{ backgroundColor: secondary }} />
            <span className="text-[8px]" style={{ color: secondary }}>♦</span>
            <span className="h-[1px] flex-1" style={{ backgroundColor: secondary }} />
          </div>
        </div>
      );
    }

    if (style === 'asymmetric-pill') {
      return (
        <div className="flex items-center justify-between text-[10px] pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: primary }}
            >
              {isVerso ? 'BookCraft' : 'Ch. 01'}
            </span>
            <span className="font-semibold text-slate-700 truncate max-w-[180px]" style={{ fontFamily: headingFont }}>
              {titleText}
            </span>
          </div>
          <span className="font-mono font-bold text-xs" style={{ color: primary }}>
            {pageNumber}
          </span>
        </div>
      );
    }

    if (style === 'hairline-rule') {
      return (
        <div className="w-full pb-2 mb-2 border-b" style={{ borderColor: `${secondary}50` }}>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-600">
            <span className="font-serif font-bold text-xs" style={{ color: primary }}>
              {pageNumber}
            </span>
            <span className="truncate max-w-[200px]" style={{ fontFamily: headingFont }}>
              {titleText}
            </span>
            <span className="text-[9px] text-amber-700">♦</span>
          </div>
        </div>
      );
    }

    if (style === 'solid-contrast-tab') {
      return (
        <div className="flex items-center justify-between text-[10px] pb-2 border-b-2 border-black">
          <span className="bg-black text-amber-400 font-mono font-bold px-2 py-0.5 text-[9px]">
            FOLIO // {pageNumber}
          </span>
          <span className="font-mono uppercase font-bold text-slate-800 tracking-wider truncate max-w-[200px]">
            {titleText}
          </span>
        </div>
      );
    }

    if (style === 'badge-tracker') {
      return (
        <div className="flex items-center justify-between text-[10px] pb-1.5 border-b border-blue-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondary }} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-900">
              {isVerso ? 'Foundation Unit' : 'Core Module'}
            </span>
          </div>
          <span className="font-bold text-slate-700 truncate max-w-[180px]">{titleText}</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
            {pageNumber}
          </span>
        </div>
      );
    }

    // Default / dual-academic-rule
    return (
      <div className="flex items-center justify-between text-[10px] pb-1 border-b-2 border-double border-slate-300">
        <span className="font-mono text-slate-700 font-bold">{pageNumber}</span>
        <span className="font-serif italic text-slate-600 truncate max-w-[200px]">{titleText}</span>
        <span className="text-[9px] text-slate-400">§ 1.2</span>
      </div>
    );
  };

  // Render decorative footer based on family
  const renderFooter = (pageNumber: number, label: string) => {
    return (
      <div
        className="flex items-center justify-between text-[10px] pt-2 border-t mt-auto"
        style={{ borderColor: `${primary}25`, color: primary }}
      >
        <span className="text-[9px] opacity-75 tracking-wider uppercase font-medium">BookCraft AI</span>
        <span className="font-bold tracking-widest text-xs">
          {selectedFamily.headerStyle === 'ornate-divider'
            ? `— ❖ ${pageNumber} ❖ —`
            : selectedFamily.headerStyle === 'hairline-rule'
            ? `• ${pageNumber} •`
            : `— ${pageNumber} —`}
        </span>
        <span className="text-[9px] opacity-75 font-medium">{label}</span>
      </div>
    );
  };

  // Template 1: Chapter Opener Spread (Verso: Title/Theme Intro + Recto: Hero Chapter Opener)
  const renderChapterOpenerVerso = () => (
    <div className="flex flex-col justify-between h-full space-y-4">
      {renderHeader(14, book.title, true)}

      <div className="my-auto space-y-4">
        {/* Decorative badge / theme icon */}
        <div className="flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner border"
            style={{ backgroundColor: `${secondary}20`, borderColor: `${secondary}60` }}
          >
            <Bookmark className="w-5 h-5" style={{ color: primary }} />
          </div>
        </div>

        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: secondary }}>
            {isArabic ? 'القسم الأول — الأصول المنهجية' : 'PART ONE — THEORETICAL INVARIANTS'}
          </span>
          <h4 className="text-base font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: headingFont }}>
            {book.title}
          </h4>
        </div>

        {/* Framing quote */}
        <div
          className="p-3.5 rounded-xl border text-xs leading-relaxed italic text-center relative"
          style={{
            backgroundColor: `${primary}08`,
            borderColor: `${secondary}40`,
            color: textColor,
          }}
        >
          <Quote className="w-4 h-4 mx-auto mb-1 opacity-40" style={{ color: primary }} />
          <p>{isArabic ? selectedFamily.sampleQuoteAr : selectedFamily.sampleQuote}</p>
        </div>

        <p className="text-xs leading-relaxed text-slate-700 text-justify">
          {isArabic
            ? 'إن صناعة الكتاب لا تقف عند حدود الصياغة اللفظية، بل تتجاوزها إلى الهندسة الدقيقة لحركة عين القارئ عبر الصفحة، وتوازن الكتل النصية مع الفراغات البيضاء التي تتيح للنص أن يتنفس.'
            : 'The architecture of a book transcends prose composition; it establishes an optical rhythm between ink and silence. When page margins respect reader focus, ideas achieve lasting gravitas.'}
        </p>
      </div>

      {renderFooter(14, isArabic ? 'صفحة التمهيد' : 'Verso Intro')}
    </div>
  );

  const renderChapterOpenerRecto = () => {
    const style = selectedFamily.chapterStyle;

    return (
      <div className="flex flex-col justify-between h-full space-y-3">
        {renderHeader(15, previewChapter.title, false)}

        <div className="my-auto space-y-3">
          {/* Chapter Hero Head based on Family Style */}
          {style === 'arch' && (
            <div
              className="rounded-xl p-4 text-center border relative overflow-hidden shadow-sm"
              style={{
                backgroundColor: `${primary}10`,
                borderColor: `${secondary}80`,
              }}
            >
              <div
                className="w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md mb-2"
                style={{ backgroundColor: primary }}
              >
                ١
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase block" style={{ color: primary }}>
                {isArabic ? 'الفصل الأول' : 'CHAPTER ONE'}
              </span>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-1" style={{ fontFamily: headingFont }}>
                {previewChapter.title}
              </h3>
              {previewChapter.subtitle && (
                <p className="text-[11px] text-slate-600 mt-1 font-medium">{previewChapter.subtitle}</p>
              )}
              {/* Islamic geometric divider */}
              <div className="flex items-center justify-center gap-2 mt-2 opacity-70">
                <span className="h-[1px] w-12" style={{ backgroundColor: secondary }} />
                <span className="text-[9px]" style={{ color: secondary }}>❖ ✦ ❖</span>
                <span className="h-[1px] w-12" style={{ backgroundColor: secondary }} />
              </div>
            </div>
          )}

          {style === 'asymmetric-bar' && (
            <div className="flex items-stretch gap-3 pl-1 rtl:pr-1 rtl:pl-0">
              <div className="w-2 rounded-full shrink-0" style={{ backgroundColor: primary }} />
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-teal-700 uppercase">
                  01 // CHAPTER ONE
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight" style={{ fontFamily: headingFont }}>
                  {previewChapter.title}
                </h3>
                {previewChapter.subtitle && (
                  <p className="text-xs text-slate-600 font-medium">{previewChapter.subtitle}</p>
                )}
              </div>
            </div>
          )}

          {style === 'luxury-rule' && (
            <div
              className="p-3.5 text-center space-y-1 border-t-2 border-b-2"
              style={{ borderColor: secondary }}
            >
              <span className="text-[10px] tracking-widest font-serif uppercase text-amber-800">
                — CHAPTER I —
              </span>
              <h3 className="text-base font-serif font-bold text-slate-900" style={{ fontFamily: headingFont }}>
                {previewChapter.title}
              </h3>
              {previewChapter.subtitle && (
                <span className="text-[11px] italic text-slate-600 block">{previewChapter.subtitle}</span>
              )}
            </div>
          )}

          {style === 'bold-numeral' && (
            <div className="flex items-center justify-between border-b-4 border-black pb-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500">SECTION 01</span>
                <h3 className="text-base font-extrabold text-black uppercase tracking-tight" style={{ fontFamily: headingFont }}>
                  {previewChapter.title}
                </h3>
              </div>
              <span className="text-4xl font-extrabold text-amber-500 font-mono">01</span>
            </div>
          )}

          {style === 'workbook-card' && (
            <div
              className="rounded-xl p-3 text-white shadow-md space-y-1"
              style={{ backgroundColor: primary }}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                  Module 01
                </span>
                <span className="opacity-80 font-mono">Core Competency</span>
              </div>
              <h3 className="text-sm md:text-base font-bold leading-tight text-white">{previewChapter.title}</h3>
            </div>
          )}

          {(style === 'minimal' || style === 'academic-frame' || style === 'photo-hero' || style === 'narrative-vignette') && (
            <div className="pb-2 border-b border-slate-300 space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase block" style={{ color: primary }}>
                {isArabic ? 'الفصل الأول' : 'CHAPTER ONE'}
              </span>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: headingFont }}>
                {previewChapter.title}
              </h3>
            </div>
          )}

          {/* Opening Body Paragraph with Drop Cap */}
          <div className="text-xs md:text-sm leading-relaxed text-slate-800 text-justify space-y-2">
            <p>
              {showDropCaps && (
                <span
                  className="float-left rtl:float-right text-3xl md:text-4xl leading-none font-extrabold mr-2 rtl:ml-2 rtl:mr-0 rounded p-1 shadow-sm"
                  style={{
                    color: primary,
                    backgroundColor: `${primary}12`,
                    fontFamily: headingFont,
                  }}
                >
                  {previewChapter.userEditedContent?.charAt(0) || 'ي'}
                </span>
              )}
              {previewChapter.userEditedContent?.slice(showDropCaps ? 1 : 0, 360) || '...'}
            </p>
          </div>
        </div>

        {renderFooter(15, isArabic ? 'مطلع الفصل' : 'Chapter Opener')}
      </div>
    );
  };

  // Template 2: Text & Key Concept Callout (Verso: Body Prose + Recto: Illuminated Callout Box)
  const renderTextCalloutVerso = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(16, book.title, true)}

      <div className="my-auto space-y-3 text-xs md:text-sm leading-relaxed text-slate-800 text-justify">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1" style={{ color: primary }}>
          {isArabic ? '١.١ الإطار المنهجي وتراكم الخبرات' : '1.1 Foundations & Knowledge Architecture'}
        </h4>
        <p>
          {isArabic
            ? 'إن أي نظام معرفي محكم ينطلق من تثبيت المبادئ التي لا تتبدل بتبدل الظروف العارضة. فالبناء الفكري المتين يشبه الصرح الهندسي؛ لا يمكن تعليته إلا إذا استقرت قواعده في تربة صلبة من البراهين والاستدلالات السليمة.'
            : 'Any enduring conceptual framework begins by establishing invariants that remain steadfast amidst shifting contingencies. Intellectual architecture mirrors physical engineering: one cannot elevate upper tiers without securing immovable footings.'}
        </p>
        <p>
          {isArabic
            ? 'وهنا يتجلى دور التوثيق المنهجي؛ إذ يحمي الأفكار من التلاشي ويمنحها قابلية الانتقال والتطبيق عبر الأجيال والمؤسسات دون تشويه أو تحريف.'
            : 'Systematic manuscript discipline preserves ideas from entropy, guaranteeing that foundational principles transition cleanly across institutions without semantic decay.'}
        </p>
      </div>

      {renderFooter(16, isArabic ? 'متن القراءة' : 'Reading Text')}
    </div>
  );

  const renderTextCalloutRecto = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(17, previewChapter.title, false)}

      <div className="my-auto space-y-3">
        <p className="text-xs leading-relaxed text-slate-800 text-justify">
          {isArabic
            ? 'ولتحقيق هذا الاتزان، يعتمد المحرر المحترف على تسليط الضوء على الخلاصات المحورية بحيث تقع عليها عين القارئ فوراً:'
            : 'To achieve reader retention, the master editorial designer isolates foundational rules into high-contrast visual callouts:'}
        </p>

        {/* Illuminated Key Concept Callout Box */}
        <div
          className="rounded-xl p-4 border relative overflow-hidden shadow-sm"
          style={{
            backgroundColor: `${primary}08`,
            borderColor: `${secondary}80`,
            borderLeftWidth: isRtl ? '1px' : '4px',
            borderRightWidth: isRtl ? '4px' : '1px',
            borderRightColor: isRtl ? primary : `${secondary}80`,
            borderLeftColor: isRtl ? `${secondary}80` : primary,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: primary }}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primary }}>
              {isArabic ? 'قاعدة جوهرية (Key Invariant)' : 'Core Principle & Key Takeaway'}
            </span>
          </div>

          <p className="text-xs leading-relaxed font-medium text-slate-900 italic">
            "{isArabic ? selectedFamily.sampleQuoteAr : selectedFamily.sampleQuote}"
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>{isArabic ? 'مرجع: الأصول المعرفية ص 42' : 'Ref: Methodological Invariants § 3'}</span>
            <span className="font-semibold text-emerald-700">✓ {isArabic ? 'مبدأ معتمد' : 'Verified Rule'}</span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-800 text-justify">
          {isArabic
            ? 'إن دمج هذه الصناديق في السياق الطباعي يكسر رتابة الصفحات الطويلة ويوجه تركيز القارئ نحو المعارف العملية القابلة للتطبيق المباشر.'
            : 'Embedding structured callout modules interrupts prose fatigue, anchoring long-form discourse with actionable cognitive signposts.'}
        </p>
      </div>

      {renderFooter(17, isArabic ? 'إبراز معرفي' : 'Callout Spread')}
    </div>
  );

  // Template 3: Multi-Column & Framework Matrix (Verso: 3 Pillars + Recto: Matrix Cards)
  const renderFrameworkVerso = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(18, book.title, true)}

      <div className="my-auto space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: secondary }}>
            {isArabic ? 'هندسة النشر والمحتوى' : 'Architectural Framework'}
          </span>
          <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: headingFont }}>
            {isArabic ? 'الركائز الثلاث للبناء المعرفي' : 'The Three Pillars of Publishing Discipline'}
          </h4>
        </div>

        {/* 3 Pillar Cards */}
        <div className="space-y-2">
          {[
            {
              num: '01',
              title: isArabic ? 'أصالة الصوت التحريري' : 'Voice Authenticity',
              desc: isArabic ? 'صون لغة المؤلف وهويته الخاصة دون تسطيح.' : 'Preserving unique author cadence and specialized terms.',
            },
            {
              num: '02',
              title: isArabic ? 'الانضباط الهندسي للطباعة' : 'Typographic Invariants',
              desc: isArabic ? 'توزيع هوامش متزنة ونقاء طباعي يريح البصر.' : 'Rigorous margins, optical leading, and whitespace.',
            },
            {
              num: '03',
              title: isArabic ? 'النزاهة والتوثيق المرجعي' : 'Source Integrity',
              desc: isArabic ? 'دقة الإسناد وتدقيق الوقائع والاستشهادات.' : 'Bulletproof factual citations and verified datasets.',
            },
          ].map((col, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border flex items-start gap-2.5"
              style={{
                backgroundColor: `${primary}05`,
                borderColor: `${primary}20`,
              }}
            >
              <span
                className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs text-white shrink-0"
                style={{ backgroundColor: primary }}
              >
                {col.num}
              </span>
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-slate-900">{col.title}</h5>
                <p className="text-[11px] text-slate-600 leading-snug">{col.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderFooter(18, isArabic ? 'ركائز الإطار' : 'Framework Pillars')}
    </div>
  );

  const renderFrameworkRecto = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(19, previewChapter.title, false)}

      <div className="my-auto space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1" style={{ color: primary }}>
          {isArabic ? 'مصفوفة التطبيق ومقارنة المخرجات' : 'Implementation Matrix & Tradeoffs'}
        </h4>

        {/* 2-Column Comparison Layout */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-900 block text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {isArabic ? 'الممارسات الاحترافية' : 'Approved Best Practice'}
            </span>
            <ul className="space-y-1 text-slate-700 list-disc list-inside text-[10px]">
              <li>{isArabic ? 'تحديد هوامش مريحة لا تقل عن 1 بوصة' : '1-inch margins with proper gutter allowance'}</li>
              <li>{isArabic ? 'محاذاة كاملة للفقرات مع فواصل فصول' : 'Full paragraph justification with clean breaks'}</li>
              <li>{isArabic ? 'ربط الحروف العربية دون تشويه' : 'OpenType contextual shaping and Identity-H'}</li>
            </ul>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
            <span className="font-bold text-rose-900 block text-xs">
              ⚠️ {isArabic ? 'أخطاء التنسيق الشائعة' : 'Common Anti-Patterns'}
            </span>
            <ul className="space-y-1 text-slate-700 list-disc list-inside text-[10px]">
              <li>{isArabic ? 'التصاق الكلمات بحواف الصفحة' : 'Text crowding outer page boundaries'}</li>
              <li>{isArabic ? 'حروف عربية متقطعة أو معكوسة' : 'Disconnected or reversed glyph strings'}</li>
              <li>{isArabic ? 'غياب أرقام الصفحات والترويسة' : 'Missing folios and unanchored running headers'}</li>
            </ul>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-800 text-justify">
          {isArabic
            ? 'يتيح هذا التقسيم الثنائي مقارنة سريعة تساعد فريق التأليف والإنتاج على الالتزام الصارم بمعايير النشر الدولية.'
            : 'This dual-matrix layout furnishes immediate editorial alignment, safeguarding production teams against common layout errors.'}
        </p>
      </div>

      {renderFooter(19, isArabic ? 'مصفوفة المقارنة' : 'Matrix Spread')}
    </div>
  );

  // Template 4: Figure & Analytical Breakdown (Verso: Visual Graphic + Recto: Deep Explanation)
  const renderFigureVerso = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(20, book.title, true)}

      <div className="my-auto space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          FIGURE 1.1 // ARCHITECTURE MODEL
        </span>

        {/* High-craft SVG diagram simulation */}
        <div
          className="w-full aspect-[16/10] rounded-xl border flex flex-col items-center justify-center p-3 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primary}15 0%, ${secondary}15 100%)`,
            borderColor: `${primary}30`,
          }}
        >
          <div className="flex items-center gap-3 z-10">
            <div className="w-16 h-16 rounded-xl bg-white shadow-md border border-slate-200 flex flex-col items-center justify-center p-1 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-600">INPUT</span>
              <span className="text-[11px] font-extrabold" style={{ color: primary }}>المسودة</span>
            </div>
            <span className="text-xs font-bold" style={{ color: secondary }}>➔</span>
            <div
              className="w-20 h-20 rounded-xl shadow-lg border flex flex-col items-center justify-center p-1 text-center text-white"
              style={{ backgroundColor: primary, borderColor: secondary }}
            >
              <Sparkles className="w-4 h-4 text-amber-300 mb-0.5" />
              <span className="text-[10px] font-extrabold">BookCraft</span>
              <span className="text-[8px] opacity-80">Design Engine</span>
            </div>
            <span className="text-xs font-bold" style={{ color: secondary }}>➔</span>
            <div className="w-16 h-16 rounded-xl bg-white shadow-md border border-slate-200 flex flex-col items-center justify-center p-1 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-600">OUTPUT</span>
              <span className="text-[11px] font-extrabold text-emerald-700">PDF / مطبعة</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-500 mt-2 font-mono z-10">
            Deterministic Book Architecture Flow (A4 / 6x9)
          </span>
        </div>

        {/* Caption Bar */}
        <div
          className="p-2.5 rounded-lg border text-[11px] leading-relaxed text-slate-700"
          style={{ backgroundColor: `${primary}05`, borderColor: `${primary}15` }}
        >
          <span className="font-bold text-slate-900 block" style={{ color: primary }}>
            {isArabic ? 'شكل (١-١): مسار التدفق الحتمي لنظام النشر' : 'Figure 1.1: Deterministic Publishing Pipeline'}
          </span>
          <p className="text-[10px] text-slate-600 mt-0.5">
            {isArabic
              ? 'يوضح المخطط كيفية تحويل المسودة الأولية عبر محرك التصميم الحتمي إلى كتاب طباعي معتمد وفق المعايير.'
              : 'Illustrating the algorithmic transition from raw manuscript to print-ready and interactive digital editions.'}
          </p>
        </div>
      </div>

      {renderFooter(20, isArabic ? 'صفحة الشكل' : 'Figure Page')}
    </div>
  );

  const renderFigureRecto = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(21, previewChapter.title, false)}

      <div className="my-auto space-y-3 text-xs md:text-sm leading-relaxed text-slate-800 text-justify">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1" style={{ color: primary }}>
          {isArabic ? 'تحليل المخطط التوضيحي ودلالاته' : 'Detailed Model Interpretation'}
        </h4>
        <p>
          {isArabic
            ? 'كما يتضح من الشكل (١-١) في الصفحة المقابلة، لا تقتصر معالجة الكتاب على تطبيق قوالب جاهزة فحسب، بل تمر بعملية هندسية دقيقة تحسب المسافات الطباعية وتوزيع الكتل البصرية بشكل حتمي.'
            : 'As demonstrated in Figure 1.1 (facing verso), modern publication design cannot rely on generic CSS skins; it requires deterministic layout calculation to balance glyph density with optical margins.'}
        </p>
        <p>
          {isArabic
            ? 'ويضمن هذا النهج عدم حدوث أي تداخل بين النصوص والصور أو تجاوز حدود الصفحات عند تصدير النسخ الورقية الجاهزة للمطابع أو الملفات الرقمية التفاعلية.'
            : 'This rigorous approach guarantees zero text clipping, predictable pagination, and unyielding typographic harmony in commercial presses and digital readers alike.'}
        </p>
      </div>

      {renderFooter(21, isArabic ? 'تحليل الشكل' : 'Figure Analysis')}
    </div>
  );

  // Template 5: Executive Summary & Action Checklist (Verso: Summary Takeaways + Recto: Checklist)
  const renderSummaryVerso = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(22, book.title, true)}

      <div className="my-auto space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: primary }}
          >
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {isArabic ? 'خاتمة الفصل' : 'CHAPTER SUMMARY'}
            </span>
            <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: headingFont }}>
              {isArabic ? 'الخلاصات الجوهرية' : 'Executive Takeaways'}
            </h4>
          </div>
        </div>

        {/* Takeaway Points */}
        <div className="space-y-2">
          {[
            isArabic ? 'التصميم الطباعي ليس تجميلاً، بل هو هندسة قراءة متكاملة.' : 'Book design is visual engineering, not arbitrary decoration.',
            isArabic ? 'الهوامش المتسعة تمنح الأفكار هيبتها وتيسر الاستيعاب الذهني.' : 'Generous margins provide reading focus and cognitive breathing room.',
            isArabic ? 'الحفاظ على صوت المؤلف الأصيل هو الركيزة الأولى لأي تحرير ناجح.' : 'Preserving authentic author voice remains the core invariant of publishing.',
          ].map((point, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border flex items-start gap-2 text-xs"
              style={{ backgroundColor: `${primary}04`, borderColor: `${primary}20` }}
            >
              <span className="font-bold text-xs" style={{ color: primary }}>
                {idx + 1}.
              </span>
              <span className="text-slate-800 leading-relaxed">{point}</span>
            </div>
          ))}
        </div>
      </div>

      {renderFooter(22, isArabic ? 'خلاصة الفصل' : 'Takeaways')}
    </div>
  );

  const renderSummaryRecto = () => (
    <div className="flex flex-col justify-between h-full space-y-3">
      {renderHeader(23, previewChapter.title, false)}

      <div className="my-auto space-y-3">
        <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: `${primary}30` }}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5" style={{ color: primary }}>
            <ListChecks className="w-4 h-4 text-emerald-600" />
            {isArabic ? 'قائمة التحقق والتطبيق العملي' : 'Action Checklist & Self-Audit'}
          </h4>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
            Audit 100%
          </span>
        </div>

        {/* Interactive-looking checklist items */}
        <div className="space-y-2">
          {[
            { label: isArabic ? 'اعتماد عائلة تصميم متوافقة مع موضوع الكتاب' : 'Select design family aligned with manuscript theme', done: true },
            { label: isArabic ? 'تدقيق هوامش الصفحات وضبط المحاذاة التامة' : 'Confirm 1-inch margins and full paragraph justification', done: true },
            { label: isArabic ? 'التأكد من سلامة ربط الحروف العربية والأرقام' : 'Verify Arabic contextual shaping and font embedding', done: true },
            { label: isArabic ? 'فصل الخاتمة ونبذة المؤلف في صفحات مستقلة' : 'Isolate Conclusion and Author Bio to dedicated spreads', done: true },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-xs font-medium text-slate-800">{item.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">OK</span>
            </div>
          ))}
        </div>

        <div
          className="p-2.5 rounded-lg border text-center text-[11px] font-medium"
          style={{ backgroundColor: `${secondary}15`, borderColor: `${secondary}50`, color: primary }}
        >
          {isArabic
            ? '✓ مسودتك مستوفية لكافة معايير الجودة الطباعية العالمية.'
            : '✓ Manuscript complies with international editorial publishing standards.'}
        </div>
      </div>

      {renderFooter(23, isArabic ? 'قائمة التطبيق' : 'Checklist Spread')}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Industrial InDesign-Grade Book Design Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t.design.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.design.subtitle}</p>
        </div>

        {/* Trim Size Control */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-1.5 text-xs">
          <span className="text-slate-400 px-2 font-semibold">{t.design.trimSize}:</span>
          {(['6x9', 'a4', 'us_letter'] as TrimSize[]).map((size) => (
            <button
              key={size}
              onClick={() => handleTrimSizeChange(size)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-colors cursor-pointer ${
                book.trimSize === size
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {size.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Internal Page Templates Selector (InDesign Templates Bar) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              {t.design.templates}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isArabic
                ? 'اختر من بين 5 تصميمات وقوالب متقنة لصفحات الكتاب الداخلية تماثل قوالب أدوبي إن ديزاين (InDesign)'
                : 'Choose from 5 distinct InDesign-grade internal page spread compositions'}
            </p>
          </div>

          <span className="text-[11px] text-teal-400 font-mono px-2.5 py-1 bg-slate-950 rounded-full border border-teal-500/30">
            {PAGE_TEMPLATES.length} InDesign Templates Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PAGE_TEMPLATES.map((tmpl) => {
            const isActive = activeTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-md shadow-teal-950/40 ring-1 ring-teal-500/60 -translate-y-0.5'
                    : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tmpl.id === 'chapter-opener' ? 'Template 1' : tmpl.id === 'text-callout' ? 'Template 2' : tmpl.id === 'two-column-framework' ? 'Template 3' : tmpl.id === 'figure-caption' ? 'Template 4' : 'Template 5'}
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {language === 'ar' ? tmpl.nameAr : tmpl.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {language === 'ar' ? tmpl.taglineAr : tmpl.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-teal-400 font-semibold flex items-center justify-between">
                  <span>{isActive ? (isArabic ? 'القالب النشط' : 'Active Template') : (isArabic ? 'معاينة وتفعيل' : 'Select')}</span>
                  <span>➔</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Page Composition Spread Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-400" />
              {t.design.pagePreview}
            </h3>
            <span className="text-xs text-slate-400">
              {isArabic ? selectedFamily.nameAr : selectedFamily.name} • {PAGE_TEMPLATES.find((p) => p.id === activeTemplate)?.name} • {book.trimSize.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDropCaps}
                onChange={(e) => setShowDropCaps(e.target.checked)}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
              />
              <span>{t.design.dropCaps}</span>
            </label>

            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
              <button
                onClick={() => setSpreadMode('single')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  spreadMode === 'single' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.design.singlePage}
              </button>
              <button
                onClick={() => setSpreadMode('two-page')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  spreadMode === 'two-page' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.design.twoPageSpread}
              </button>
            </div>
          </div>
        </div>

        {/* Live Book Pages Simulation */}
        <div className="bg-slate-950 p-4 md:p-10 rounded-xl flex items-center justify-center overflow-x-auto shadow-inner">
          <div
            className={`flex items-center gap-3 md:gap-5 ${
              spreadMode === 'single' ? 'max-w-md' : 'max-w-4xl'
            } w-full transition-all`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Left Page (Verso) - Only in two-page spread */}
            {spreadMode === 'two-page' && (
              <div
                className="flex-1 aspect-[1/1.42] rounded-l-md shadow-2xl p-5 md:p-7 flex flex-col justify-between relative overflow-hidden transition-all"
                style={{
                  backgroundColor: bg,
                  color: textColor,
                  fontFamily: bodyFont,
                  border: `2px solid ${primary}`,
                  boxShadow: `inset 0 0 0 3px ${bg}, inset 0 0 0 4.5px ${secondary}50`,
                }}
              >
                {activeTemplate === 'chapter-opener' && renderChapterOpenerVerso()}
                {activeTemplate === 'text-callout' && renderTextCalloutVerso()}
                {activeTemplate === 'two-column-framework' && renderFrameworkVerso()}
                {activeTemplate === 'figure-caption' && renderFigureVerso()}
                {activeTemplate === 'summary-takeaways' && renderSummaryVerso()}
              </div>
            )}

            {/* Right Page (Recto) */}
            <div
              className={`flex-1 aspect-[1/1.42] ${
                spreadMode === 'two-page' ? 'rounded-r-md' : 'rounded-md'
              } shadow-2xl p-5 md:p-7 flex flex-col justify-between relative overflow-hidden transition-all`}
              style={{
                backgroundColor: bg,
                color: textColor,
                fontFamily: bodyFont,
                border: `2px solid ${primary}`,
                boxShadow: `inset 0 0 0 3px ${bg}, inset 0 0 0 4.5px ${secondary}50`,
              }}
            >
              {activeTemplate === 'chapter-opener' && renderChapterOpenerRecto()}
              {activeTemplate === 'text-callout' && renderTextCalloutRecto()}
              {activeTemplate === 'two-column-framework' && renderFrameworkRecto()}
              {activeTemplate === 'figure-caption' && renderFigureRecto()}
              {activeTemplate === 'summary-takeaways' && renderSummaryRecto()}
            </div>
          </div>
        </div>
      </div>

      {/* Design Families Selector Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layout className="w-4 h-4 text-teal-400" />
            {t.design.families}
          </h3>
          <span className="text-xs text-slate-400">
            {DESIGN_FAMILIES.length} {isArabic ? 'عائلات تصميم متخصصة' : 'Distinct Editorial Art Directions'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DESIGN_FAMILIES.map((fam) => {
            const isSelected = fam.id === selectedFamily.id;
            return (
              <div
                key={fam.id}
                onClick={() => handleSelectFamily(fam)}
                className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-teal-500 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/50 -translate-y-0.5'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full shadow-xs"
                      style={{ backgroundColor: fam.primaryAccent }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full -ml-1 rtl:-mr-1"
                      style={{ backgroundColor: fam.secondaryAccent }}
                    />
                    <h4 className="text-sm font-bold text-white">
                      {language === 'ar' ? fam.nameAr : fam.name}
                    </h4>
                  </div>

                  <span className="text-[10px] text-teal-400 font-medium px-2 py-0.5 bg-slate-950 rounded-full border border-slate-800 inline-block">
                    {fam.category}
                  </span>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'ar' ? fam.descriptionAr : fam.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                    {fam.trimSize.toUpperCase()}
                  </span>
                  <span className="text-slate-300 italic truncate max-w-[150px]">
                    {language === 'ar' ? fam.sampleQuoteAr : fam.sampleQuote}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

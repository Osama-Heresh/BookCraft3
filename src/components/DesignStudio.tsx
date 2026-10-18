import React, { useState } from 'react';
import {
  Palette,
  Check,
  BookOpen,
  Layout,
  Maximize2,
  FileSpreadsheet,
  Columns,
  Eye,
} from 'lucide-react';
import { BookProject, Chapter, DesignSystem, TrimSize } from '../types';
import { Language, translations } from '../lib/i18n';
import { DESIGN_FAMILIES } from '../lib/designFamilies';

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

  const currentFamilyId = book.designFamily || 'modern-editorial';
  const selectedFamily =
    DESIGN_FAMILIES.find((d) => d.id === currentFamilyId) || DESIGN_FAMILIES[0];

  const [spreadMode, setSpreadMode] = useState<'single' | 'two-page'>('two-page');
  const [showDropCaps, setShowDropCaps] = useState(true);

  const isArabic = book.language === 'ar';
  const previewChapter = chapters[0] || {
    title: isArabic ? 'مدخل إلى النظام المعرفي' : 'Foundations of Modern Architecture',
    subtitle: isArabic ? 'المفاهيم النظرية والأطر التأسيسية' : 'Principles, Invariants, and Formal Methods',
    userEditedContent: isArabic
      ? 'يعد توثيق المعرفة الإنسانية وتحويلها إلى مؤلفات منشورة ركيزة أساسية في بناء الحضارة وتراكم الخبرات العلمية. لا يقتصر النشر على نقل المعلومات، بل يتعداه إلى صياغة الأفكار في قالب بصري وطباعي يحفظ هيبتها وييسر استيعابها لدى القارئ.'
      : 'Transforming specialized expertise into an enduring published volume requires more than raw text; it demands an architectural harmony between typography, whitespace, and reader cadence. True typographic discipline does not call attention to itself—it elevates the author voice.',
  };

  const handleSelectFamily = (family: DesignSystem) => {
    onUpdateBook({
      designFamily: family.id,
      trimSize: family.trimSize,
    });
  };

  const handleTrimSizeChange = (trimSize: TrimSize) => {
    onUpdateBook({ trimSize });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Deterministic Design Engine</span>
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
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-colors ${
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

      {/* Design Families Selector Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layout className="w-4 h-4 text-teal-400" />
          {t.design.families}
        </h3>

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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: fam.primaryAccent }}
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
                  <span className="font-mono text-[10px]">{fam.trimSize.toUpperCase()}</span>
                  <span className="text-slate-300 italic truncate max-w-[150px]">
                    {language === 'ar' ? fam.sampleQuoteAr : fam.sampleQuote}
                  </span>
                </div>
              </div>
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
              Deterministic composition preview ({selectedFamily.name} • {book.trimSize.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDropCaps}
                onChange={(e) => setShowDropCaps(e.target.checked)}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span>{t.design.dropCaps}</span>
            </label>

            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
              <button
                onClick={() => setSpreadMode('single')}
                className={`px-2.5 py-1 rounded font-medium ${
                  spreadMode === 'single' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.design.singlePage}
              </button>
              <button
                onClick={() => setSpreadMode('two-page')}
                className={`px-2.5 py-1 rounded font-medium ${
                  spreadMode === 'two-page' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.design.twoPageSpread}
              </button>
            </div>
          </div>
        </div>

        {/* Live Book Pages Simulation */}
        <div className="bg-slate-950 p-6 md:p-12 rounded-xl flex items-center justify-center overflow-x-auto">
          <div
            className={`flex items-center gap-2 md:gap-4 ${
              spreadMode === 'single' ? 'max-w-md' : 'max-w-4xl'
            } w-full`}
          >
            {/* Left Page (Verso) - Only in two-page spread */}
            {spreadMode === 'two-page' && (
              <div
                className="flex-1 aspect-[1/1.4] rounded-l-md shadow-2xl p-5 md:p-7 flex flex-col justify-between relative overflow-hidden"
                style={{
                  backgroundColor: selectedFamily.pageBackground,
                  color: '#1e293b',
                  fontFamily: isArabic ? 'var(--font-arabic-serif)' : 'var(--font-serif)',
                  border: `2px solid ${selectedFamily.primaryAccent}`,
                  boxShadow: `inset 0 0 0 3px ${selectedFamily.pageBackground}, inset 0 0 0 4.5px ${selectedFamily.primaryAccent}60`,
                }}
              >
                {/* Running Header inside a Colored Rectangle */}
                <div
                  className="flex items-center justify-between text-[10px] text-white rounded px-2.5 py-1 shadow-sm"
                  style={{ backgroundColor: selectedFamily.primaryAccent }}
                >
                  <span className="font-mono font-bold">14</span>
                  <span className="uppercase tracking-wider font-medium truncate max-w-[180px]">{book.title.slice(0, 30)}</span>
                </div>

                {/* Left Page Content */}
                <div className="space-y-3 text-xs md:text-sm leading-relaxed my-auto">
                  <p>
                    {isArabic
                      ? 'إن صناعة الكتاب لا تقف عند حدود الصياغة اللفظية، بل تتجاوزها إلى الهندسة الدقيقة لحركة عين القارئ عبر الصفحة، وتوازن الكتل النصية مع الفراغات البيضاء التي تتيح للنص أن يتنفس.'
                      : 'The architecture of a book transcends prose composition; it establishes an optical rhythm between ink and silence. When page margins respect reader focus, ideas achieve lasting gravitas.'}
                  </p>
                  <p>
                    {isArabic
                      ? 'ومن هنا جاءت عائلات التصميم في BookCraft AI لتكون تعبيرًا بصريًا متناغمًا مع طبيعة المعرفة المقدمة، سواء أكانت بحثًا تاريخيًا أم أطروحة أكاديمية أم دليلاً تقنيًا.'
                      : 'Each design system embodies a distinct publishing ethic—calibrating heading proportion, leading, and folio placement to harmonize with the author voice.'}
                  </p>
                </div>

                {/* Left Footer with Page Number */}
                <div
                  className="flex items-center justify-between text-[10px] pt-2 border-t"
                  style={{
                    borderColor: `${selectedFamily.primaryAccent}30`,
                    color: selectedFamily.primaryAccent,
                  }}
                >
                  <span className="text-[9px] opacity-75">BookCraft AI</span>
                  <span className="font-bold tracking-wider">— 14 —</span>
                  <span className="text-[9px] opacity-75">{isArabic ? 'صفحة داخلية' : 'Verso'}</span>
                </div>
              </div>
            )}

            {/* Right Page (Recto) */}
            <div
              className={`flex-1 aspect-[1/1.4] ${
                spreadMode === 'two-page' ? 'rounded-r-md' : 'rounded-md'
              } shadow-2xl p-5 md:p-7 flex flex-col justify-between relative overflow-hidden`}
              style={{
                backgroundColor: selectedFamily.pageBackground,
                color: '#1e293b',
                fontFamily: isArabic ? 'var(--font-arabic-serif)' : 'var(--font-serif)',
                border: `2px solid ${selectedFamily.primaryAccent}`,
                boxShadow: `inset 0 0 0 3px ${selectedFamily.pageBackground}, inset 0 0 0 4.5px ${selectedFamily.primaryAccent}60`,
              }}
            >
              {/* Running Header inside a Colored Rectangle */}
              <div
                className="flex items-center justify-between text-[10px] text-white rounded px-2.5 py-1 shadow-sm"
                style={{ backgroundColor: selectedFamily.primaryAccent }}
              >
                <span className="uppercase tracking-wider font-medium truncate max-w-[180px]">{previewChapter.title.slice(0, 30)}</span>
                <span className="font-mono font-bold">{spreadMode === 'two-page' ? '15' : '1'}</span>
              </div>

              {/* Chapter Opening Head in a Colored Rectangular Box */}
              <div className="my-auto space-y-3">
                <div
                  className="rounded-lg p-3 text-center text-white shadow-md"
                  style={{ backgroundColor: selectedFamily.primaryAccent }}
                >
                  <span className="text-[10px] font-bold tracking-widest uppercase block opacity-90">
                    {isArabic ? 'الفصل الأول' : 'CHAPTER ONE'}
                  </span>
                  <h4
                    className="text-sm md:text-base font-bold tracking-tight text-white mt-0.5"
                    style={{
                      fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-serif)',
                    }}
                  >
                    {previewChapter.title}
                  </h4>
                </div>

                {/* Body paragraph with drop cap */}
                <p className="text-xs md:text-sm leading-relaxed text-slate-800">
                  {showDropCaps && (
                    <span
                      className="float-left rtl:float-right text-3xl md:text-4xl leading-none font-bold mr-2 rtl:ml-2 rtl:mr-0"
                      style={{ color: selectedFamily.primaryAccent }}
                    >
                      {previewChapter.userEditedContent?.charAt(0) || 'T'}
                    </span>
                  )}
                  {previewChapter.userEditedContent?.slice(showDropCaps ? 1 : 0, 350) || '...'}
                </p>
              </div>

              {/* Right Footer with Page Number */}
              <div
                className="flex items-center justify-between text-[10px] pt-2 border-t"
                style={{
                  borderColor: `${selectedFamily.primaryAccent}30`,
                  color: selectedFamily.primaryAccent,
                }}
              >
                <span className="text-[9px] opacity-75">{selectedFamily.name}</span>
                <span className="font-bold tracking-wider">— {spreadMode === 'two-page' ? '15' : '1'} —</span>
                <span className="text-[9px] opacity-75">{isArabic ? 'مطلع الفصل' : 'Recto'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

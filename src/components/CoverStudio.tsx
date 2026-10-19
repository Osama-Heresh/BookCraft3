import React, { useState, useEffect, useRef } from 'react';
import {
  BookMarked,
  Sparkles,
  Barcode,
  Layers,
  Palette,
  Eye,
  RefreshCw,
  Loader2,
  Check,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  User,
  X,
  Printer,
  Download,
  Sliders,
  CheckCircle2,
  FileCheck,
  Layout,
  Bookmark,
} from 'lucide-react';
import { BookProject, Chapter, CoverConfig, CoverConcept, CoverLayoutFamily, PaperStock, BindingMethod } from '../types';
import { Language, translations } from '../lib/i18n';
import { CoverIntelligenceEngine } from '../lib/coverIntelligence';
import { VISUAL_ASSETS } from '../lib/visualAssetLibrary';

interface CoverStudioProps {
  book: BookProject;
  chapters: Chapter[];
  cover: CoverConfig | null;
  onSaveCover: (cover: CoverConfig) => void;
  language: Language;
}

export const CoverStudio: React.FC<CoverStudioProps> = ({
  book,
  chapters,
  cover,
  onSaveCover,
  language,
}) => {
  const t = translations[language];
  const isArabic = book.language === 'ar' || language === 'ar';
  const isRtl = isArabic;

  // Calculate estimated page count
  const totalWords = chapters.reduce(
    (acc, c) =>
      acc +
      (c.userEditedContent || c.processedContent || c.originalContent || '')
        .split(/\s+/)
        .filter(Boolean).length,
    0
  );
  const estimatedPages = Math.max(24, Math.round(totalWords / 250) + 12);

  // Concepts from Intelligence Director
  const [concepts, setConcepts] = useState<CoverConcept[]>(() =>
    CoverIntelligenceEngine.generateCoverConcepts(book)
  );
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    cover?.activeConceptId || concepts[0]?.id || 'concept-1'
  );

  const initialCover: CoverConfig = cover || {
    id: 'cov-' + book.id,
    bookId: book.id,
    ownerId: 'current-user',
    frontTitle: book.title,
    frontSubtitle: book.subtitle,
    authorName: book.authorName,
    spineText: `${book.title} • ${book.authorName}`,
    spineWidthMm: 14.0,
    backBlurb:
      book.description ||
      'A comprehensive, deeply researched exploration of knowledge and craft.',
    authorBio: `${book.authorName || 'The author'} is a dedicated subject-matter specialist.`,
    isbn: '978-1-954321-00-8',
    themeColor: '#0F172A',
    fontStyle: 'Modern Sans Geometric',
    coverLayoutFamily: 'full-bleed-hero',
    paperStock: '60_cream',
    bindingMethod: 'perfect_paperback',
    pageCount: estimatedPages,
    coverArtworkUrl: concepts[0]?.recommendedArtworkUrl,
    publisherName: isArabic ? 'منشورات بوك كرافت' : 'BookCraft Publishing',
    updatedAt: new Date().toISOString(),
  };

  const [localCover, setLocalCover] = useState<CoverConfig>(initialCover);
  const [viewMode, setViewMode] = useState<'front' | 'wraparound' | 'back'>('front');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [generatingArtwork, setGeneratingArtwork] = useState(false);
  const [coverSuccessMessage, setCoverSuccessMessage] = useState<string | null>(null);
  const [coverErrorMessage, setCoverErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cover) {
      setLocalCover(cover);
    }
  }, [cover]);

  // Recalculate spine geometry dynamically
  const spineCalc = CoverIntelligenceEngine.calculateSpine(
    localCover.pageCount || estimatedPages,
    localCover.paperStock || '60_cream',
    localCover.bindingMethod || 'perfect_paperback'
  );

  const handleUpdate = (field: keyof CoverConfig, val: any) => {
    const updated = {
      ...localCover,
      [field]: val,
      updatedAt: new Date().toISOString(),
    };
    if (field === 'pageCount' || field === 'paperStock' || field === 'bindingMethod') {
      const newSpine = CoverIntelligenceEngine.calculateSpine(
        field === 'pageCount' ? val : (updated.pageCount || estimatedPages),
        field === 'paperStock' ? val : (updated.paperStock || '60_cream'),
        field === 'bindingMethod' ? val : (updated.bindingMethod || 'perfect_paperback')
      );
      updated.spineWidthMm = newSpine.spineWidthMm;
    }
    setLocalCover(updated);
    onSaveCover(updated);
  };

  const handleSelectConcept = (concept: CoverConcept) => {
    setSelectedConceptId(concept.id);
    const updated: CoverConfig = {
      ...localCover,
      activeConceptId: concept.id,
      themeColor: concept.palette[0] || localCover.themeColor,
      coverLayoutFamily: concept.recommendedLayout,
      coverArtworkUrl: concept.recommendedArtworkUrl || localCover.coverArtworkUrl,
      updatedAt: new Date().toISOString(),
    };
    setLocalCover(updated);
    onSaveCover(updated);
    setCoverSuccessMessage(
      isArabic
        ? `تم تطبيق مفهوم الغلاف: "${concept.conceptNameAr}"!`
        : `Applied cover concept: "${concept.conceptName}"!`
    );
  };

  // Upload custom high-resolution image
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCoverErrorMessage('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleUpdate('coverArtworkUrl', dataUrl);
        setCoverSuccessMessage(
          isArabic ? 'تم تحميل صورة الغلاف بنجاح!' : 'Custom cover artwork uploaded successfully!'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate artwork via API or Visual Library
  const handleGenerateArtworkOnly = async () => {
    setGeneratingArtwork(true);
    setCoverSuccessMessage(null);
    setCoverErrorMessage(null);
    try {
      const artPrompt = `Masterpiece publication book cover artwork for: ${
        localCover.frontTitle || book.title
      }. Category: ${book.category || 'General'}. Studio lighting, publication standard artwork.`;

      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: artPrompt,
          aspectRatio: '3:4',
          visualType: 'illustration',
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        handleUpdate('coverArtworkUrl', data.imageUrl);
        setCoverSuccessMessage(
          data.note ||
            (isArabic
              ? 'تم إنشاء صورة الغلاف الأصلية بنجاح!'
              : 'Original cover artwork generated successfully!')
        );
      } else {
        throw new Error(data.error || 'Artwork generation failed.');
      }
    } catch (err: any) {
      setCoverErrorMessage(err.message || 'Error generating cover artwork.');
    } finally {
      setGeneratingArtwork(false);
    }
  };

  const layoutFamily: CoverLayoutFamily = localCover.coverLayoutFamily || 'full-bleed-hero';
  const theme = localCover.themeColor || '#0F172A';

  // Render Front Cover Composition
  const renderFrontCover = () => {
    const title = localCover.frontTitle || book.title;
    const subtitle = localCover.frontSubtitle || book.subtitle;
    const author = localCover.authorName || book.authorName || 'Author';

    return (
      <div
        className="w-full aspect-[1/1.48] rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 transition-all border border-slate-700/60"
        style={{
          backgroundColor: theme,
          color: '#FFFFFF',
          fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-sans)',
        }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Background Artwork Layer */}
        {localCover.coverArtworkUrl ? (
          <img
            src={localCover.coverArtworkUrl}
            alt="Cover Artwork"
            className="absolute inset-0 w-full h-full object-cover z-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="absolute inset-0 z-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${theme} 0%, #000000 100%)`,
            }}
          />
        )}

        {/* Layout Overlay Gradients */}
        {layoutFamily === 'full-bleed-hero' && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/80 z-1" />
        )}
        {layoutFamily === 'editorial-split' && (
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-slate-950/95 border-t border-teal-500/40 z-1 backdrop-blur-xs" />
        )}
        {layoutFamily === 'premium-heritage' && (
          <div className="absolute inset-2 border-2 border-amber-400/60 rounded-lg pointer-events-none z-2 shadow-[inset_0_0_12px_rgba(200,169,107,0.3)]">
            <div className="absolute inset-1 border border-amber-300/30 rounded" />
          </div>
        )}
        {layoutFamily === 'luxury-professional' && (
          <div className="absolute inset-3 border-t border-b border-amber-300/60 pointer-events-none z-2 flex flex-col justify-between py-1">
            <span className="text-[9px] text-amber-300/80 tracking-widest uppercase text-center block">
              AUTHORITATIVE EDITION
            </span>
            <span className="text-[9px] text-amber-300/80 tracking-widest uppercase text-center block">
              BOOKCRAFT PRESS
            </span>
          </div>
        )}

        {/* Foreground Content (Deterministic Real Typography) */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Top Header / Category Pill */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 backdrop-blur-xs text-teal-300">
              {book.category || 'Nonfiction'}
            </span>
            <span className="text-[10px] text-slate-300 font-mono opacity-80">
              {book.trimSize.toUpperCase()}
            </span>
          </div>

          {/* Central / Lower Title Block */}
          <div className={`space-y-2.5 ${layoutFamily === 'editorial-split' ? 'mt-auto pt-4' : 'my-auto'}`}>
            <h1
              className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight drop-shadow-md"
              style={{
                fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-serif)',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className="text-xs sm:text-sm font-medium leading-relaxed text-slate-200 opacity-95 drop-shadow"
                style={{
                  fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-sans)',
                  textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                }}
              >
                {subtitle}
              </p>
            )}

            {/* Decorative divider */}
            <div className="flex items-center gap-2 pt-1 opacity-80">
              <span className="h-[1.5px] w-8 bg-amber-400" />
              <span className="text-[9px] text-amber-300">❖</span>
              <span className="h-[1.5px] w-8 bg-amber-400" />
            </div>
          </div>

          {/* Author Name & Colophon */}
          <div className="pt-2 border-t border-white/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-wider block text-slate-300">
                {isArabic ? 'تأليف' : 'BY'}
              </span>
              <span className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-serif)' }}>
                {author}
              </span>
            </div>

            <span className="text-[9px] font-mono opacity-75 text-slate-300">
              {localCover.publisherName || 'BookCraft'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Coordinated Back Cover
  const renderBackCover = () => {
    return (
      <div
        className="w-full aspect-[1/1.48] rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 transition-all border border-slate-700/60"
        style={{
          backgroundColor: theme,
          color: '#FFFFFF',
          fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-sans)',
        }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="absolute inset-0 bg-slate-950/85 z-0" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          {/* Header */}
          <div className="border-b border-slate-700/80 pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-teal-400 block">
              {isArabic ? 'نبذة عن الإصدار' : 'ABOUT THIS PUBLICATION'}
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5 truncate">{localCover.frontTitle}</h3>
          </div>

          {/* Blurb */}
          <div className="space-y-3 my-auto">
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200 text-justify">
              {localCover.backBlurb || book.description || 'A comprehensive treatise exploring foundational principles and empirical insights.'}
            </p>

            {/* Author Bio Box */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              {localCover.authorPhotoUrl ? (
                <img
                  src={localCover.authorPhotoUrl}
                  alt={localCover.authorName}
                  className="w-11 h-11 rounded-full object-cover object-top border border-teal-500/50 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-teal-300 block uppercase">
                  {isArabic ? 'عن المؤلف' : 'ABOUT THE AUTHOR'}
                </span>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                  {localCover.authorBio}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Publisher and Barcode */}
          <div className="pt-3 border-t border-slate-800 flex items-end justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
                {localCover.publisherName || 'BookCraft AI Press'}
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold">
                ISBN {localCover.isbn || '978-1-954321-00-8'}
              </span>
            </div>

            {/* Barcode box */}
            <div className="w-24 h-11 bg-white rounded p-1 flex flex-col items-center justify-center shadow-xs">
              <Barcode className="w-full h-7 text-black stroke-[1.5]" />
              <span className="text-[7px] font-mono text-black -mt-1 font-bold">
                {localCover.isbn?.replace(/[^0-9]/g, '').slice(0, 13) || '9781954321008'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Full Print Cover Spread (Back Cover + Spine + Front Cover)
  const renderFullSpread = () => {
    const isRtlBook = isArabic;

    return (
      <div className="w-full bg-slate-950 p-4 md:p-8 rounded-2xl flex items-center justify-center overflow-x-auto shadow-inner">
        <div
          className="flex items-stretch border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl relative"
          style={{ width: '840px', height: '460px' }}
        >
          {/* Guide Bleed Lines */}
          <div className="absolute inset-0 pointer-events-none border border-dashed border-rose-500/30 z-30" />

          {/* Left Panel */}
          <div className="flex-1 h-full overflow-hidden relative">
            {isRtlBook ? renderFrontCover() : renderBackCover()}
          </div>

          {/* Center Spine */}
          <div
            className="h-full flex flex-col justify-between items-center py-4 px-1.5 relative border-x border-slate-700/80 z-20 shadow-lg"
            style={{
              width: `${Math.max(spineCalc.spineWidthMm * 2.8, 42)}px`,
              backgroundColor: theme,
              color: '#FFFFFF',
            }}
          >
            <span className="text-[8px] font-mono opacity-80 uppercase tracking-tighter">
              {book.trimSize.toUpperCase()}
            </span>

            {/* Spine Title (Vertical) */}
            <div className="my-auto [writing-mode:vertical-rl] rotate-180 flex items-center gap-3 text-[11px] font-bold tracking-wider truncate max-h-[300px]">
              <span className="truncate max-w-[180px]">{localCover.frontTitle}</span>
              <span className="opacity-60">•</span>
              <span className="truncate max-w-[120px] font-medium opacity-90">{localCover.authorName}</span>
            </div>

            <span className="text-[8px] font-mono opacity-80">
              {spineCalc.spineWidthMm}mm
            </span>
          </div>

          {/* Right Panel */}
          <div className="flex-1 h-full overflow-hidden relative">
            {isRtlBook ? renderBackCover() : renderFrontCover()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Professional Cover Studio & Print Director</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t.cover.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.cover.subtitle}</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-1.5 text-xs">
          <button
            onClick={() => setViewMode('front')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              viewMode === 'front'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {isArabic ? 'الغلاف الأمامي' : 'Front Cover'}
          </button>
          <button
            onClick={() => setViewMode('wraparound')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              viewMode === 'wraparound'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {isArabic ? 'فردة الغلاف الطباعية كاملة (مع الكعب)' : 'Full Print Spread (Spine + Back)'}
          </button>
          <button
            onClick={() => setViewMode('back')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              viewMode === 'back'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {isArabic ? 'الغلاف الخلفي' : 'Back Cover'}
          </button>
        </div>
      </div>

      {coverSuccessMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{coverSuccessMessage}</span>
        </div>
      )}

      {coverErrorMessage && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{coverErrorMessage}</span>
        </div>
      )}

      {/* 3 Fundamentally Distinct Cover Concepts Gallery */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isArabic ? 'مفاهيم الغلاف الإبداعية الثلاثة (Cover Concept Director)' : 'Intelligent Cover Concept Director (3 Distinct Concepts)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isArabic
                ? 'ثلاثة مفاهيم إخراجية مختلفة جوهرياً تم بناؤها بناءً على محتوى مسودتك وهويتها التحريرية'
                : 'Three fundamentally distinct art directions tailored to your manuscript theme and target audience'}
            </p>
          </div>

          <span className="text-[11px] text-amber-400 font-mono px-2.5 py-1 bg-slate-950 rounded-full border border-amber-500/30">
            3 Concept Variations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {concepts.map((concept, idx) => {
            const isSelected = selectedConceptId === concept.id;
            return (
              <div
                key={concept.id}
                onClick={() => handleSelectConcept(concept)}
                className={`p-4 rounded-xl border text-start cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/60 -translate-y-0.5'
                    : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono">
                      Concept 0{idx + 1}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {language === 'ar' ? concept.conceptNameAr : concept.conceptName}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'ar' ? concept.descriptionAr : concept.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-[10px] text-slate-400 font-medium">Focal Point:</span>
                    <span className="text-slate-300 font-bold truncate max-w-[150px]">
                      {language === 'ar' ? concept.focalPointAr : concept.focalPoint}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {concept.palette.map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {isSelected ? (isArabic ? 'المفهوم المعتمد' : 'Applied') : (isArabic ? 'تطبيق المفهوم ➔' : 'Apply ➔')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Studio Workspace: Live Preview & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preview Container (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-mono text-teal-400 font-semibold">
              Live Compositor Preview ({layoutFamily.toUpperCase()})
            </span>
            <span>
              {isArabic ? 'دقة عالية جاهزة للمطابع' : 'Print-Ready Vector Typography Layers'}
            </span>
          </div>

          {viewMode === 'front' && (
            <div className="w-full max-w-sm">{renderFrontCover()}</div>
          )}
          {viewMode === 'back' && (
            <div className="w-full max-w-sm">{renderBackCover()}</div>
          )}
          {viewMode === 'wraparound' && renderFullSpread()}

          {/* Quick Action Toolbar */}
          <div className="w-full pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-teal-400" />
              <span>{isArabic ? 'مكتبة الأصول الفنية' : 'Artwork Library'}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{isArabic ? 'رفع صورة غلاف' : 'Upload Artwork'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
              />
            </label>

            <button
              onClick={handleGenerateArtworkOnly}
              disabled={generatingArtwork}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              {generatingArtwork ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isArabic ? 'توليد لوحة غلاف جديدة' : 'Generate Artwork'}</span>
            </button>
          </div>
        </div>

        {/* Editor & Configuration Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-teal-400" />
            {isArabic ? 'أدوات ضبط الغلاف والطباعة' : 'Cover Composition & Print Controls'}
          </h3>

          {/* Cover Layout Families Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              {isArabic ? 'نمط تركيبة الغلاف (Layout Family):' : 'Cover Layout Family:'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'full-bleed-hero', name: isArabic ? 'صورة عريضة كاملة' : 'Full-Bleed Hero' },
                { id: 'premium-heritage', name: isArabic ? 'التراث المذهب الفاخر' : 'Premium Heritage' },
                { id: 'editorial-split', name: isArabic ? 'التحرير الصحفي المقسوم' : 'Editorial Split' },
                { id: 'luxury-professional', name: isArabic ? 'التميز التنفيذي' : 'Luxury Executive' },
                { id: 'minimal-typographic', name: isArabic ? 'النقاء الأدبي المصغر' : 'Minimal Typographic' },
                { id: 'bold-contemporary', name: isArabic ? 'المعاصر الجريء' : 'Bold Contemporary' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleUpdate('coverLayoutFamily', layout.id)}
                  className={`p-2 rounded-lg border text-start font-medium transition-colors cursor-pointer ${
                    layoutFamily === layout.id
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {layout.name}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Layer Editing (Instant update without image regen) */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isArabic ? 'عنوان الكتاب على الغلاف:' : 'Front Title Text:'}
              </label>
              <input
                type="text"
                value={localCover.frontTitle}
                onChange={(e) => handleUpdate('frontTitle', e.target.value)}
                className="w-full bg-slate-800 text-sm text-white border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isArabic ? 'العنوان الفرعي:' : 'Subtitle Text:'}
              </label>
              <input
                type="text"
                value={localCover.frontSubtitle}
                onChange={(e) => handleUpdate('frontSubtitle', e.target.value)}
                className="w-full bg-slate-800 text-sm text-white border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isArabic ? 'اسم المؤلف:' : 'Author Name:'}
              </label>
              <input
                type="text"
                value={localCover.authorName}
                onChange={(e) => handleUpdate('authorName', e.target.value)}
                className="w-full bg-slate-800 text-sm text-white border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isArabic ? 'سيرة المؤلف:' : 'Author Bio:'}
              </label>
              <textarea
                value={localCover.authorBio}
                onChange={(e) => handleUpdate('authorBio', e.target.value)}
                className="w-full bg-slate-800 text-sm text-white border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none h-24"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isArabic ? 'صورة المؤلف:' : 'Author Photo:'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => handleUpdate('authorPhotoUrl', event.target?.result as string);
                    reader.readAsDataURL(file);
                }}
                className="w-full bg-slate-800 text-sm text-slate-300 border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Print Specification & Spine Controls */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              {isArabic ? 'حساب كعب الغلاف ومواصفات المطبعة' : 'Spine & Commercial Print Specs'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{isArabic ? 'نوع الورق:' : 'Paper Stock:'}</label>
                <select
                  value={localCover.paperStock || '60_cream'}
                  onChange={(e) => handleUpdate('paperStock', e.target.value as PaperStock)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 focus:outline-none text-xs"
                >
                  <option value="50_white">50# White Offset (Light)</option>
                  <option value="60_cream">60# Cream (Standard Trade)</option>
                  <option value="70_white">70# White (Heavy Academic)</option>
                  <option value="80_gloss">80# Gloss (Color Art)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isArabic ? 'نوع التجليد:' : 'Binding Method:'}</label>
                <select
                  value={localCover.bindingMethod || 'perfect_paperback'}
                  onChange={(e) => handleUpdate('bindingMethod', e.target.value as BindingMethod)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 focus:outline-none text-xs"
                >
                  <option value="perfect_paperback">Perfect Bound (Paperback)</option>
                  <option value="case_hardcover">Case Bound (Hardcover)</option>
                </select>
              </div>
            </div>

            {/* Calculated Geometry Card */}
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>{isArabic ? 'عرض الكعب المحسوب:' : 'Calculated Spine Width:'}</span>
                <span className="font-mono font-bold text-teal-400">{spineCalc.spineWidthMm} mm</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{isArabic ? 'إجمالي الصفحات المقدر:' : 'Total Pages:'}</span>
                <span className="font-mono">{spineCalc.pageCount} pp</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{isArabic ? 'إجمالي الفردة الطباعية:' : 'Full Spread Size:'}</span>
                <span className="font-mono">{spineCalc.fullCoverWidthMm} × {spineCalc.fullCoverHeightMm} mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Asset Library Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-400" />
                {isArabic ? 'مكتبة الأصول الفنية الأصيلة للنشر' : 'Visual Publishing Asset Library'}
              </h3>
              <button
                onClick={() => setShowAssetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {isArabic
                ? 'اختر لوحة فنية أصلية فائقة الدقة مرسومة خصيصاً لتناسب مجالات الذكاء الاصطناعي، التراث العربي، القيادة، والعلوم:'
                : 'Select an authentic, museum-grade artwork calibrated for AI technology, Arabic heritage, leadership, and science:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {VISUAL_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    handleUpdate('coverArtworkUrl', asset.url);
                    setShowAssetModal(false);
                    setCoverSuccessMessage(
                      isArabic ? `تم تعيين اللوحة: ${asset.titleAr}` : `Applied artwork: ${asset.title}`
                    );
                  }}
                  className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-teal-500 cursor-pointer bg-slate-950 flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                    <img
                      src={asset.url}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2.5 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-teal-400">
                      {asset.category}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">
                      {language === 'ar' ? asset.titleAr : asset.title}
                    </h5>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

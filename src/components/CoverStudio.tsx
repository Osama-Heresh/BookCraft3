import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { BookProject, Chapter, CoverConfig } from '../types';
import { Language, translations } from '../lib/i18n';

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

  // Calculate estimated page count
  const totalWords = chapters.reduce(
    (acc, c) =>
      acc +
      (c.userEditedContent || c.processedContent || c.originalContent || '')
        .split(/\s+/)
        .filter(Boolean).length,
    0
  );
  const estimatedPages = Math.max(24, Math.round(totalWords / 250) + 8);
  const calculatedSpineMm = Number((estimatedPages * 0.057 + 0.8).toFixed(2));

  const initialCover: CoverConfig = cover || {
    id: 'cov-' + book.id,
    bookId: book.id,
    ownerId: 'current-user',
    frontTitle: book.title,
    frontSubtitle: book.subtitle,
    authorName: book.authorName,
    spineText: `${book.title} • ${book.authorName}`,
    spineWidthMm: calculatedSpineMm,
    backBlurb:
      book.description ||
      'A comprehensive, deeply researched exploration of knowledge and craft.',
    authorBio: `${book.authorName || 'The author'} is a dedicated subject-matter specialist.`,
    isbn: '978-1-954321-00-8',
    themeColor: '#0F172A', // Midnight Navy
    fontStyle: 'Modern Sans Geometric',
    updatedAt: new Date().toISOString(),
  };

  const [localCover, setLocalCover] = useState<CoverConfig>(initialCover);
  const [viewMode, setViewMode] = useState<'wraparound' | 'front' | 'back'>('wraparound');
  const [generating, setGenerating] = useState(false);
  const [generatingArtwork, setGeneratingArtwork] = useState(false);
  const [coverSuccessMessage, setCoverSuccessMessage] = useState<string | null>(null);
  const [coverErrorMessage, setCoverErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cover) {
      setLocalCover(cover);
    }
  }, [cover]);

  const isArabic = book.language === 'ar';

  const handleUpdate = (field: keyof CoverConfig, val: any) => {
    const updated = {
      ...localCover,
      [field]: val,
      updatedAt: new Date().toISOString(),
    };
    setLocalCover(updated);
    onSaveCover(updated);
  };

  // 1. Direct Artwork Generation (Image Only)
  const handleGenerateArtworkOnly = async () => {
    setGeneratingArtwork(true);
    setCoverSuccessMessage(null);
    setCoverErrorMessage(null);
    try {
      const artPrompt = `Masterpiece publication book cover artwork illustration for: ${
        localCover.frontTitle || book.title
      }. Category/Subject: ${book.category || 'General'}. Highly artistic, publication-grade masterpiece book cover art. Rich color palette, elegant geometry, suitable for print.`;

      let imageUrl: string | null = null;
      try {
        const imgRes = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: artPrompt,
            aspectRatio: '3:4',
            visualType: 'illustration',
          }),
        });
        const imgData = await imgRes.json();
        if (imgData.imageUrl) {
          imageUrl = imgData.imageUrl;
        }
      } catch {
        // Fallback to client SVG
      }

      if (!imageUrl) {
        const [w, h] = [600, 800];
        const safeTitle = (localCover.frontTitle || book.title).replace(/[<>&"]/g, '').slice(0, 40);
        const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F2B36"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C8A96B"/>
      <stop offset="100%" stop-color="#E4C88A"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="36" y="36" width="${w - 72}" height="${h - 72}" fill="none" stroke="#0F766E" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.45"/>
  <rect x="48" y="48" width="${w - 96}" height="${h - 96}" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.6"/>
  <circle cx="${w / 2}" cy="${h / 2 - 40}" r="120" fill="#0F766E" opacity="0.25"/>
  <polygon points="${w / 2},${h / 2 - 120} ${w / 2 + 70},${h / 2 - 10} ${w / 2},${h / 2 - 30} ${w / 2 - 70},${h / 2 - 10}" fill="url(#gold)" opacity="0.9"/>
  <text x="${w / 2}" y="${h / 2 + 90}" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#F8FAFC" text-anchor="middle" letter-spacing="2">BOOKCRAFT EDITION</text>
  <text x="${w / 2}" y="${h / 2 + 125}" font-family="system-ui, sans-serif" font-size="14" fill="#94A3B8" text-anchor="middle">${safeTitle}</text>
</svg>`;
        imageUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      }

      const updated = {
        ...localCover,
        coverArtworkUrl: imageUrl,
        updatedAt: new Date().toISOString(),
      };
      setLocalCover(updated);
      onSaveCover(updated);
      setCoverSuccessMessage(
        isArabic
          ? 'تم توليد العمل الفني للغلاف بنجاح وإدراجه في التصميم!'
          : 'Cover artwork generated and embedded successfully!'
      );
    } catch (err: any) {
      setCoverErrorMessage(
        isArabic
          ? 'تعذر توليد لوحة الغلاف: ' + err.message
          : 'Failed to generate cover artwork: ' + err.message
      );
    } finally {
      setGeneratingArtwork(false);
    }
  };

  // 2. Coordinated Concept + Palette + Artwork Generation
  const handleGenerateConcept = async () => {
    setGenerating(true);
    setCoverSuccessMessage(null);
    setCoverErrorMessage(null);
    try {
      // 1. Generate text concept, theme and palette
      const res = await fetch('/api/gemini/cover-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: book.title,
          subtitle: book.subtitle,
          authorName: book.authorName,
          category: book.category,
          language: book.language,
          pageCount: estimatedPages,
          trimSize: book.trimSize,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 2. Generate Cover Artwork Image
      let artworkUrl = localCover.coverArtworkUrl;
      try {
        const artPrompt = `Breathtaking book cover artwork illustration: ${
          data.coverConceptDescription || data.frontTitle || book.title
        }. Category: ${book.category}. Highly artistic, publication-grade masterpiece book cover art.`;

        const imgRes = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: artPrompt,
            aspectRatio: '3:4',
            visualType: 'illustration',
          }),
        });
        const imgData = await imgRes.json();
        if (imgData.imageUrl) {
          artworkUrl = imgData.imageUrl;
        }
      } catch (imgErr) {
        console.warn('Cover artwork image generation warning:', imgErr);
      }

      const updated: CoverConfig = {
        ...localCover,
        frontTitle: data.frontTitle || localCover.frontTitle,
        frontSubtitle: data.frontSubtitle || localCover.frontSubtitle,
        authorName: data.authorName || localCover.authorName,
        spineText: data.spineText || localCover.spineText,
        spineWidthMm: data.spineWidthMm || calculatedSpineMm,
        backBlurb: data.backBlurb || localCover.backBlurb,
        authorBio: data.authorBio || localCover.authorBio,
        isbn: data.isbnPlaceholder || localCover.isbn,
        themeColor: data.suggestedPalette?.background || '#0F172A',
        fontStyle: data.typographyStyle || 'Modern Sans Geometric',
        coverArtworkUrl: artworkUrl,
        updatedAt: new Date().toISOString(),
      };

      setLocalCover(updated);
      onSaveCover(updated);
      setCoverSuccessMessage(
        isArabic
          ? 'تم تصميم مفهوم الغلاف بالكامل وتوليد اللوحة الفنية بنجاح!'
          : 'Complete cover architecture & artwork generated successfully!'
      );
    } catch (err: any) {
      setCoverErrorMessage(
        isArabic
          ? 'تعذر تصميم الغلاف: ' + err.message
          : 'Cover generation error: ' + err.message
      );
    } finally {
      setGenerating(false);
    }
  };

  // Upload Custom Cover Image
  const handleUploadCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = {
        ...localCover,
        coverArtworkUrl: reader.result as string,
        updatedAt: new Date().toISOString(),
      };
      setLocalCover(updated);
      onSaveCover(updated);
      setCoverSuccessMessage(
        isArabic ? 'تم رفع صورة الغلاف بنجاح!' : 'Cover image uploaded successfully!'
      );
    };
    reader.readAsDataURL(file);
  };

  // Upload Author Picture (maintained automatically on the last cover / back cover)
  const handleUploadAuthorPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = {
        ...localCover,
        authorPhotoUrl: reader.result as string,
        updatedAt: new Date().toISOString(),
      };
      setLocalCover(updated);
      onSaveCover(updated);
      setCoverSuccessMessage(
        isArabic
          ? 'تم حفظ صورة المؤلف بنجاح وتثبيت موقعها تلقائيًا على الغلاف الأخير!'
          : 'Author photo uploaded & positioned automatically on back cover!'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAuthorPhoto = () => {
    const updated = {
      ...localCover,
      authorPhotoUrl: undefined,
      updatedAt: new Date().toISOString(),
    };
    setLocalCover(updated);
    onSaveCover(updated);
    setCoverSuccessMessage(
      isArabic ? 'تمت إزالة صورة المؤلف من الغلاف الأخير' : 'Author photo removed from back cover'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Coordinated Cover Architecture</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t.cover.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.cover.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewMode('wraparound')}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'wraparound'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.cover.wraparoundView}
            </button>
            <button
              onClick={() => setViewMode('front')}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'front'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.cover.frontCover}
            </button>
            <button
              onClick={() => setViewMode('back')}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'back'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isArabic ? 'الغلاف الخلفي (الأخير)' : 'Back Cover (Last)'}
            </button>
          </div>

          {/* Upload Image */}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-colors">
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>{isArabic ? 'رفع صورة' : 'Upload Image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadCoverImage}
              className="hidden"
            />
          </label>

          {/* Primary Action 1: Generate Artwork Only */}
          <button
            onClick={handleGenerateArtworkOnly}
            disabled={generatingArtwork || generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
            title="Generate AI masterpiece artwork for the cover"
          >
            {generatingArtwork ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isArabic ? 'جارٍ رسم العمل الفني...' : 'Painting Artwork...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isArabic ? 'توليد لوحة فنية للغلاف' : 'Generate Cover Artwork'}</span>
              </>
            )}
          </button>

          {/* Action 2: Generate Coordinated Concept & Architecture */}
          <button
            onClick={handleGenerateConcept}
            disabled={generating || generatingArtwork}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Coordinate typography, spine, back blurb, and palette"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isArabic ? 'جارٍ التنسيق...' : 'Architecting...'}</span>
              </>
            ) : (
              <>
                <Palette className="w-3.5 h-3.5 text-teal-400" />
                <span>{isArabic ? 'تنسيق الهيكل والألوان' : 'AI Cover Concept'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {coverSuccessMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>{coverSuccessMessage}</span>
        </div>
      )}

      {coverErrorMessage && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{coverErrorMessage}</span>
        </div>
      )}

      {/* Spine Width Indicator Banner */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-mono font-bold">
            {localCover.spineWidthMm}mm
          </div>
          <div>
            <div className="font-bold text-white">{t.cover.spineWidth}</div>
            <div className="text-slate-400">
              {t.cover.basedOnPages.replace('{pages}', String(estimatedPages))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>Trim: {book.trimSize.toUpperCase()}</span>
          <span>Bleed: 3.175mm</span>
          <span>Stock: 60# Cream</span>
        </div>
      </div>

      {/* Live Cover Canvas Spread */}
      <div className="bg-slate-950 p-6 md:p-10 rounded-2xl border border-slate-800 flex items-center justify-center overflow-x-auto shadow-2xl">
        {viewMode === 'wraparound' ? (
          // Full Wraparound Spread (Back Cover | Spine | Front Cover)
          <div
            className="flex items-stretch shadow-2xl rounded-sm overflow-hidden border border-slate-800 text-slate-100 max-w-5xl w-full"
            style={{
              backgroundColor: localCover.themeColor,
              minHeight: '440px',
            }}
          >
            {/* 1. BACK COVER */}
            <div
              className={`flex-1 p-6 md:p-8 flex flex-col justify-between border-r border-black/20 ${
                isArabic ? 'font-arabic text-right' : 'font-sans'
              }`}
            >
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">
                  {book.category}
                </span>
                <p className="text-xs md:text-sm leading-relaxed text-slate-200 line-clamp-6">
                  {localCover.backBlurb}
                </p>

                {/* Author section with automatically maintained photo location */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-teal-300">
                    {language === 'ar' ? 'نبذة عن المؤلف' : 'About the Author'}
                  </div>
                  <div className="flex items-start gap-3">
                    {localCover.authorPhotoUrl ? (
                      <div className="relative group shrink-0">
                        <img
                          src={localCover.authorPhotoUrl}
                          alt={localCover.authorName}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-teal-400 shadow-md"
                          style={{ objectPosition: 'center 15%' }}
                        />
                        <button
                          onClick={handleRemoveAuthorPhoto}
                          title={isArabic ? 'إزالة صورة المؤلف' : 'Remove Author Photo'}
                          className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-teal-400/40 hover:border-teal-400 bg-black/20 hover:bg-teal-500/10 flex flex-col items-center justify-center cursor-pointer transition-colors text-teal-300">
                        <User className="w-4 h-4 text-teal-300" />
                        <span className="text-[8px] font-medium text-center px-1">
                          {isArabic ? 'صورة المؤلف' : 'Add Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadAuthorPhoto}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-4 flex-1">
                      {localCover.authorBio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barcode & ISBN Box */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  <div>BookCraft AI Publishing</div>
                  <div className="font-mono text-[9px]">{localCover.isbn}</div>
                </div>

                <div className="bg-white p-2 rounded shadow flex items-center gap-2">
                  <Barcode className="w-16 h-8 text-black" />
                </div>
              </div>
            </div>

            {/* 2. CALCULATED SPINE */}
            <div
              className="w-10 sm:w-12 bg-black/30 border-r border-black/20 flex flex-col items-center justify-between py-6 shrink-0"
              style={{
                fontFamily: isArabic ? 'var(--font-arabic)' : 'var(--font-sans)',
              }}
            >
              <span className="text-[9px] uppercase tracking-widest text-teal-400 font-bold rotate-90 whitespace-nowrap mt-4">
                BookCraft
              </span>
              <span className="text-xs font-bold text-white rotate-90 whitespace-nowrap tracking-wider my-auto">
                {localCover.spineText}
              </span>
              <span className="text-[9px] text-slate-400 rotate-90 whitespace-nowrap mb-4">
                {localCover.isbn.slice(-4)}
              </span>
            </div>

            {/* 3. FRONT COVER */}
            <div
              className={`flex-1 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden ${
                isArabic ? 'font-arabic text-right' : 'font-sans'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                  {book.category}
                </span>

                <h1
                  className={`text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight ${
                    isArabic ? 'font-arabic' : 'font-display-book'
                  }`}
                >
                  {localCover.frontTitle}
                </h1>

                {localCover.frontSubtitle && (
                  <p className="text-xs md:text-sm text-slate-300 font-medium">
                    {localCover.frontSubtitle}
                  </p>
                )}

                <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-emerald-500 rounded my-2" />
              </div>

              {/* Cover Artwork Image Display */}
              {localCover.coverArtworkUrl ? (
                <div className="relative z-10 my-3 rounded-xl overflow-hidden border border-white/20 shadow-2xl w-full aspect-[4/3] max-h-56 flex items-center justify-center bg-black/40">
                  <img
                    src={localCover.coverArtworkUrl}
                    alt={localCover.frontTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative z-10 my-3 rounded-xl border border-dashed border-white/20 w-full aspect-[4/3] max-h-56 p-4 flex flex-col items-center justify-center text-center bg-black/20">
                  <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400">
                    {isArabic ? 'لا توجد لوحة فنية للغلاف بعد' : 'No cover artwork generated yet'}
                  </p>
                  <button
                    onClick={handleGenerateArtworkOnly}
                    disabled={generatingArtwork}
                    className="mt-2 text-xs text-teal-400 hover:text-teal-300 underline font-semibold cursor-pointer"
                  >
                    {isArabic ? 'توليد بالذكاء الاصطناعي الآن' : 'Render Artwork with AI'}
                  </button>
                </div>
              )}

              {/* Author Attribution */}
              <div className="relative z-10 pt-4">
                <div className="text-xs text-teal-300 uppercase tracking-widest font-semibold">
                  {language === 'ar' ? 'تأليف' : 'Author'}
                </div>
                <div className="text-base md:text-lg font-bold text-white">
                  {localCover.authorName}
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'back' ? (
          // Back Cover Only Standalone View (The Last Cover)
          <div
            className={`aspect-[1/1.5] max-w-sm w-full p-8 rounded-xl shadow-2xl flex flex-col justify-between border border-slate-700 relative overflow-hidden text-slate-100 ${
              isArabic ? 'font-arabic text-right' : 'font-sans'
            }`}
            style={{ backgroundColor: localCover.themeColor }}
          >
            <div className="space-y-4 relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">
                {book.category}
              </span>
              <p className="text-xs md:text-sm leading-relaxed text-slate-200 line-clamp-7">
                {localCover.backBlurb}
              </p>

              {/* Author section with automatically maintained photo location */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="text-xs font-bold text-teal-300">
                  {language === 'ar' ? 'نبذة عن المؤلف' : 'About the Author'}
                </div>
                <div className="flex items-start gap-3">
                  {localCover.authorPhotoUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={localCover.authorPhotoUrl}
                        alt={localCover.authorName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-teal-400 shadow-md"
                        style={{ objectPosition: 'center 15%' }}
                      />
                      <button
                        onClick={handleRemoveAuthorPhoto}
                        title={isArabic ? 'إزالة صورة المؤلف' : 'Remove Author Photo'}
                        className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="shrink-0 w-16 h-16 rounded-full border-2 border-dashed border-teal-400/40 hover:border-teal-400 bg-black/20 hover:bg-teal-500/10 flex flex-col items-center justify-center cursor-pointer transition-colors text-teal-300">
                      <User className="w-5 h-5 text-teal-300" />
                      <span className="text-[9px] font-medium text-center px-1">
                        {isArabic ? 'صورة المؤلف' : 'Add Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadAuthorPhoto}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-white">
                      {localCover.authorName}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-4">
                      {localCover.authorBio}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode & ISBN Box */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="text-[10px] text-slate-400">
                <div>BookCraft AI Publishing</div>
                <div className="font-mono text-[9px]">{localCover.isbn}</div>
              </div>

              <div className="bg-white p-2 rounded shadow flex items-center gap-2">
                <Barcode className="w-16 h-8 text-black" />
              </div>
            </div>
          </div>
        ) : (
          // Front Cover Only Standalone View
          <div
            className={`aspect-[1/1.5] max-w-sm w-full p-8 rounded-xl shadow-2xl flex flex-col justify-between border border-slate-700 relative overflow-hidden ${
              isArabic ? 'font-arabic text-right' : 'font-sans'
            }`}
            style={{ backgroundColor: localCover.themeColor }}
          >
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                {book.category}
              </span>

              <h1
                className={`text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight ${
                  isArabic ? 'font-arabic' : 'font-display-book'
                }`}
              >
                {localCover.frontTitle}
              </h1>

              {localCover.frontSubtitle && (
                <p className="text-xs md:text-sm text-slate-300 font-medium">
                  {localCover.frontSubtitle}
                </p>
              )}
              <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-emerald-500 rounded my-2" />
            </div>

            {/* Artwork frame */}
            {localCover.coverArtworkUrl ? (
              <div className="relative z-10 my-4 rounded-xl overflow-hidden border border-white/20 shadow-2xl w-full aspect-[4/3] max-h-60 flex items-center justify-center bg-black/40">
                <img
                  src={localCover.coverArtworkUrl}
                  alt={localCover.frontTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative z-10 my-4 rounded-xl border border-dashed border-white/20 w-full aspect-[4/3] max-h-60 p-6 flex flex-col items-center justify-center text-center bg-black/20">
                <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                <button
                  onClick={handleGenerateArtworkOnly}
                  disabled={generatingArtwork}
                  className="text-xs text-teal-400 hover:text-teal-300 underline font-semibold cursor-pointer"
                >
                  {isArabic ? 'توليد بالذكاء الاصطناعي الآن' : 'Render Artwork with AI'}
                </button>
              </div>
            )}

            <div className="pt-4 relative z-10">
              <div className="text-xs text-teal-300 uppercase tracking-widest font-semibold">
                {language === 'ar' ? 'تأليف' : 'Author'}
              </div>
              <div className="text-base md:text-lg font-bold text-white">
                {localCover.authorName}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editable Cover Form Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-teal-400" />
          Cover Content & Production Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t.cover.frontTitle}</label>
              <input
                type="text"
                value={localCover.frontTitle}
                onChange={(e) => handleUpdate('frontTitle', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t.cover.frontSubtitle}</label>
              <input
                type="text"
                value={localCover.frontSubtitle}
                onChange={(e) => handleUpdate('frontSubtitle', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t.cover.authorName}</label>
              <input
                type="text"
                value={localCover.authorName}
                onChange={(e) => handleUpdate('authorName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={localCover.themeColor}
                  onChange={(e) => handleUpdate('themeColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={localCover.themeColor}
                  onChange={(e) => handleUpdate('themeColor', e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono w-32"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t.cover.backBlurb}</label>
              <textarea
                rows={3}
                value={localCover.backBlurb}
                onChange={(e) => handleUpdate('backBlurb', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t.cover.authorBio}</label>
              <textarea
                rows={2}
                value={localCover.authorBio}
                onChange={(e) => handleUpdate('authorBio', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white leading-relaxed"
              />
            </div>

            {/* Author Photo Upload Card (Last Cover / Back Cover) */}
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isArabic ? 'صورة المؤلف (للغلاف الأخير / الخلفي)' : 'Author Picture (Last Cover)'}</span>
                </label>
                {localCover.authorPhotoUrl && (
                  <button
                    onClick={handleRemoveAuthorPhoto}
                    className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    {isArabic ? 'إزالة الصورة' : 'Remove Photo'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {localCover.authorPhotoUrl ? (
                  <img
                    src={localCover.authorPhotoUrl}
                    alt={localCover.authorName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 shadow-md shrink-0"
                    style={{ objectPosition: 'center 15%' }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-700/80 border border-dashed border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {localCover.authorPhotoUrl
                        ? isArabic
                          ? 'تغيير صورة المؤلف'
                          : 'Change Photo'
                        : isArabic
                        ? 'رفع صورة المؤلف'
                        : 'Upload Author Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadAuthorPhoto}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {isArabic
                      ? 'يتم تثبيت الصورة تلقائيًا في موقعها المخصص على الغلاف الأخير وفي صفحة نبذة عن المؤلف.'
                      : 'Maintained automatically in the back cover author bio block and interior About Author page.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t.cover.isbn}</label>
              <input
                type="text"
                value={localCover.isbn}
                onChange={(e) => handleUpdate('isbn', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

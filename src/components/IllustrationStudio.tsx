import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Layers,
} from 'lucide-react';
import { BookProject, Chapter, IllustrationItem, VisualType, AspectRatio, ImagePlacement } from '../types';
import { Language, translations } from '../lib/i18n';

interface IllustrationStudioProps {
  book: BookProject;
  chapters: Chapter[];
  illustrations: IllustrationItem[];
  onSaveIllustration: (item: IllustrationItem) => void;
  onDeleteIllustration: (id: string) => void;
  language: Language;
}

export const IllustrationStudio: React.FC<IllustrationStudioProps> = ({
  book,
  chapters,
  illustrations,
  onSaveIllustration,
  onDeleteIllustration,
  language,
}) => {
  const t = translations[language];

  const [planning, setPlanning] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-Plan Visuals via BookDirector
  const handleAutoPlan = async () => {
    setPlanning(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/plan-illustrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          category: book.category,
          chapters: chapters.map((c) => ({
            chapterNumber: c.chapterNumber,
            title: c.title,
            summary: c.userEditedContent?.slice(0, 300) || c.originalContent?.slice(0, 300),
          })),
          language: book.language,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.illustrationPlan && Array.isArray(data.illustrationPlan)) {
        for (const planItem of data.illustrationPlan) {
          const newItem: IllustrationItem = {
            id: 'ill-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            bookId: book.id,
            chapterNumber: planItem.chapterNumber || 1,
            ownerId: 'current-user',
            purpose: planItem.purpose || 'Chapter Illustration',
            description: planItem.description || 'Editorial visual graphic',
            visualType: planItem.visualType || 'diagram',
            aspectRatio: planItem.aspectRatio || '16:9',
            placement: planItem.placement || 'chapter_header',
            caption: planItem.caption || '',
            status: 'planned',
            createdAt: new Date().toISOString(),
          };
          onSaveIllustration(newItem);
        }
        setStatusMessage(
          language === 'ar'
            ? `تم وضع خطة الرسوم التوضيحية بنجاح (${data.illustrationPlan.length} رسم)!`
            : `Visual plan generated successfully with ${data.illustrationPlan.length} editorial artworks!`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error planning illustrations.');
    } finally {
      setPlanning(false);
    }
  };

  // Generate Image for Item
  const handleGenerateImage = async (item: IllustrationItem) => {
    setGeneratingId(item.id);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      let imageUrl: string | null = null;
      try {
        const res = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${item.purpose || 'Chapter visual'}. ${item.description || ''}`,
            aspectRatio: item.aspectRatio || '16:9',
            visualType: item.visualType || 'diagram',
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          imageUrl = data.imageUrl;
        }
      } catch {
        // network or server error, fallback to client SVG
      }

      if (!imageUrl) {
        const prompt = `${item.purpose || 'Chapter visual'}. ${item.description || ''}`;
        const aspectRatio = item.aspectRatio || '16:9';
        let [w, h] = [800, 450];
        if ((aspectRatio as string) === '3:4') [w, h] = [600, 800];
        else if ((aspectRatio as string) === '4:3') [w, h] = [800, 600];
        else if ((aspectRatio as string) === '1:1') [w, h] = [800, 800];
        const safeText = prompt.replace(/[<>&"]/g, '').slice(0, 50);
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
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#0F766E" stroke-width="2" stroke-dasharray="6 4" opacity="0.4"/>
  <circle cx="${w / 2}" cy="${h / 2 - 20}" r="${Math.min(w, h) * 0.22}" fill="#0F766E" opacity="0.25"/>
  <polygon points="${w / 2},${h / 2 - 55} ${w / 2 + 35},${h / 2 - 5} ${w / 2},${h / 2 - 15} ${w / 2 - 35},${h / 2 - 5}" fill="url(#gold)" opacity="0.85"/>
  <text x="${w / 2}" y="${h / 2 + 55}" font-family="system-ui, sans-serif" font-weight="700" font-size="18" fill="#F8FAFC" text-anchor="middle">BOOKCRAFT ILLUSTRATION</text>
  <text x="${w / 2}" y="${h / 2 + 80}" font-family="system-ui, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">${safeText}</text>
</svg>`;
        imageUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      }

      onSaveIllustration({
        ...item,
        imageUrl,
        status: 'generated',
      });
      setStatusMessage(
        language === 'ar'
          ? `تم توليد الرسم التوضيحي للفصل ${item.chapterNumber || 1} بنجاح!`
          : `Artwork for Chapter ${item.chapterNumber || 1} rendered successfully!`
      );
    } catch (err: any) {
      setErrorMessage(
        language === 'ar'
          ? `تعذر توليد الرسم: ${err.message || 'خطأ غير متوقع'}`
          : `Failed to generate artwork: ${err.message || 'Unexpected error'}`
      );
    } finally {
      setGeneratingId(null);
    }
  };

  // Add Manual Item
  const handleAddManual = () => {
    const newItem: IllustrationItem = {
      id: 'ill-' + Date.now(),
      bookId: book.id,
      chapterNumber: 1,
      ownerId: 'current-user',
      purpose: 'Technical or Conceptual Figure',
      description: 'Illustration or diagram description for the chapter.',
      visualType: 'diagram',
      aspectRatio: '16:9',
      placement: 'chapter_header',
      caption: 'Figure description and source reference.',
      status: 'planned',
      createdAt: new Date().toISOString(),
    };
    onSaveIllustration(newItem);
  };

  // Upload Custom Image Replacement
  const handleUploadCustom = (item: IllustrationItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onSaveIllustration({
        ...item,
        imageUrl: reader.result as string,
        status: 'generated',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Illustration Planning & Generation</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t.illustrations.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.illustrations.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddManual}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.illustrations.addVisual}</span>
          </button>

          <button
            onClick={handleAutoPlan}
            disabled={planning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
          >
            {planning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Planning Visuals...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.illustrations.planNewVisuals}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Visuals List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            {t.illustrations.planTitle} ({illustrations.length})
          </span>
          <span className="text-xs text-slate-400">
            {illustrations.filter((i) => i.status === 'generated').length} generated
          </span>
        </h3>

        {illustrations.length === 0 ? (
          <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-white">No Visual Elements Planned Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click &quot;Auto-Plan Visuals for Manuscript&quot; to have the AI identify key diagram and illustration opportunities across your chapters.
            </p>
            <button
              onClick={handleAutoPlan}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors"
            >
              Auto-Plan Visuals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {illustrations.map((item) => {
              const isGenerating = generatingId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Item Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-bold">
                          Ch.{item.chapterNumber || 1}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase">
                          {item.visualType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.aspectRatio}
                        </span>
                        <button
                          onClick={() => onDeleteIllustration(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Purpose & Description */}
                    <div>
                      <input
                        type="text"
                        value={item.purpose}
                        onChange={(e) =>
                          onSaveIllustration({ ...item, purpose: e.target.value })
                        }
                        className="text-sm font-bold text-white bg-transparent border-b border-slate-800 focus:border-teal-500 focus:outline-none w-full pb-1"
                        placeholder="Purpose of Visual"
                      />
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) =>
                          onSaveIllustration({ ...item, description: e.target.value })
                        }
                        className="text-xs text-slate-300 bg-slate-950/50 border border-slate-800 rounded-lg p-2 w-full mt-2 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                        placeholder="Detailed prompt description..."
                      />
                    </div>

                    {/* Visual Preview / Canvas */}
                    <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.purpose}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4 space-y-1 text-slate-500">
                          <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                          <div className="text-xs font-medium">No graphic generated yet</div>
                        </div>
                      )}

                      {/* Hover Overlay with Upload Trigger */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white flex items-center gap-1.5 border border-slate-600">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadCustom(item, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Caption Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">
                        {t.illustrations.caption}
                      </label>
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) =>
                          onSaveIllustration({ ...item, caption: e.target.value })
                        }
                        className="text-xs text-slate-300 bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder="Figure caption in published book"
                      />
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.status === 'generated'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>

                    <button
                      onClick={() => handleGenerateImage(item)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Rendering...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{item.imageUrl ? 'Regenerate' : 'Generate Graphic'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

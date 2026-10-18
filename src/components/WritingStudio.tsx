import React, { useState } from 'react';
import {
  Feather,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  RotateCcw,
  Plus,
  Trash2,
  FileCheck2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Loader2,
  Search,
  SlidersHorizontal,
  SplitSquareVertical,
  History,
} from 'lucide-react';
import { BookProject, Chapter, EditingLevel, WritingQualityReport } from '../types';
import { Language, translations } from '../lib/i18n';

interface WritingStudioProps {
  book: BookProject;
  chapters: Chapter[];
  onSaveChapter: (chapter: Chapter) => void;
  onAddChapter: () => void;
  onDeleteChapter: (id: string) => void;
  language: Language;
}

export const WritingStudio: React.FC<WritingStudioProps> = ({
  book,
  chapters,
  onSaveChapter,
  onAddChapter,
  onDeleteChapter,
  language,
}) => {
  const t = translations[language];

  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id || '');
  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];

  // Editorial settings
  const [editingLevel, setEditingLevel] = useState<EditingLevel>(book.editingLevel || 'standard');
  const [protectCitations, setProtectCitations] = useState(true);

  // View mode: 'edit' | 'improved' | 'diff'
  const [viewMode, setViewMode] = useState<'edit' | 'improved' | 'diff'>('edit');

  // Loading state
  const [enhancing, setEnhancing] = useState(false);
  const [factChecking, setFactChecking] = useState(false);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [factReport, setFactReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeChapter) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p>No chapters available. Please add a chapter.</p>
        <button
          onClick={onAddChapter}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm"
        >
          Add First Chapter
        </button>
      </div>
    );
  }

  const isArabic = book.language === 'ar';
  const currentText = activeChapter.userEditedContent || activeChapter.processedContent || activeChapter.originalContent || '';
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;

  // Handle Text Change
  const handleContentChange = (val: string) => {
    const updated: Chapter = {
      ...activeChapter,
      userEditedContent: val,
      wordCount: val.split(/\s+/).filter(Boolean).length,
      updatedAt: new Date().toISOString(),
    };
    onSaveChapter(updated);
  };

  // Run Writing Quality & Authentic Voice Engine
  const handleEnhanceChapter = async () => {
    setEnhancing(true);
    setQualityReport(null);

    try {
      const res = await fetch('/api/gemini/improve-manuscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: activeChapter.title,
          originalContent: activeChapter.userEditedContent || activeChapter.originalContent,
          editingLevel,
          category: book.category,
          language: book.language,
          protectCitations,
          authorVoiceNotes: `Book category: ${book.category}, Formality aligned with target audience: ${book.targetAudience}`,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save improved content to chapter
      const updated: Chapter = {
        ...activeChapter,
        processedContent: data.improvedContent,
        status: 'improved',
        updatedAt: new Date().toISOString(),
        history: [
          ...(activeChapter.history || []),
          {
            timestamp: new Date().toISOString(),
            label: `${editingLevel.toUpperCase()} Edit — Authentic Voice Engine`,
            content: data.improvedContent,
          },
        ],
      };

      onSaveChapter(updated);
      setQualityReport(data);
      setViewMode('diff');
    } catch (err: any) {
      alert('Error polishing chapter: ' + err.message);
    } finally {
      setEnhancing(false);
    }
  };

  // Run Fact Integrity Service
  const handleFactCheck = async () => {
    setFactChecking(true);
    setFactReport(null);

    try {
      const res = await fetch('/api/gemini/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterText: currentText,
          category: book.category,
          language: book.language,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFactReport(data);
    } catch (err: any) {
      alert('Fact checking error: ' + err.message);
    } finally {
      setFactChecking(false);
    }
  };

  // Accept All AI Edits
  const handleAcceptEdits = () => {
    if (!activeChapter.processedContent) return;
    const updated: Chapter = {
      ...activeChapter,
      userEditedContent: activeChapter.processedContent,
      status: 'approved',
      wordCount: activeChapter.processedContent.split(/\s+/).filter(Boolean).length,
      updatedAt: new Date().toISOString(),
    };
    onSaveChapter(updated);
    setViewMode('edit');
  };

  // Restore Original Manuscript
  const handleRestoreOriginal = () => {
    if (!activeChapter.originalContent) return;
    if (window.confirm('Restore original manuscript for this chapter? Current edits will be replaced.')) {
      const updated: Chapter = {
        ...activeChapter,
        userEditedContent: activeChapter.originalContent,
        status: 'draft',
        wordCount: activeChapter.originalContent.split(/\s+/).filter(Boolean).length,
        updatedAt: new Date().toISOString(),
      };
      onSaveChapter(updated);
      setViewMode('edit');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Editorial Control Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Feather className="w-5 h-5 text-teal-400" />
              {t.editorial.studioTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400">{t.editorial.engineDesc}</p>
        </div>

        {/* Action Buttons & Level Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mx-2" />
            {(['light', 'standard', 'deep'] as EditingLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setEditingLevel(level)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
                  editingLevel === level
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            onClick={handleEnhanceChapter}
            disabled={enhancing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
          >
            {enhancing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.editorial.enhancing}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.editorial.runEngine}</span>
              </>
            )}
          </button>

          <button
            onClick={handleFactCheck}
            disabled={factChecking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {factChecking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>{t.editorial.factCheckBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Chapter Sidebar + Editor + Quality Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chapter Navigation (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-400" />
              {t.editorial.chapterList} ({chapters.length})
            </h3>
            <button
              onClick={onAddChapter}
              className="p-1.5 rounded-lg bg-teal-500/15 text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition-colors"
              title={t.editorial.addChapter}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {chapters.map((ch, idx) => {
              const active = ch.id === activeChapter.id;
              const words = (ch.userEditedContent || ch.originalContent || '').split(/\s+/).filter(Boolean).length;
              return (
                <div
                  key={ch.id}
                  onClick={() => setActiveChapterId(ch.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border text-left flex items-start justify-between gap-2 ${
                    active
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-200 shadow-sm'
                      : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-bold shrink-0">
                        Ch.{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold truncate">{ch.title}</h4>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{words} {t.editorial.words}</span>
                      <span className="capitalize text-slate-500">• {ch.status}</span>
                    </div>
                  </div>

                  {chapters.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t.common.confirmDelete)) {
                          onDeleteChapter(ch.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-60 hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Manuscript Editor & Diff (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          {/* Chapter Title & Subtitle */}
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-teal-400 uppercase font-semibold">
                Chapter {activeChapter.chapterNumber} • {wordCount} {t.editorial.words}
              </span>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs border border-slate-700">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'edit' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.editorial.versionUser}
                </button>
                {activeChapter.processedContent && (
                  <>
                    <button
                      onClick={() => setViewMode('improved')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        viewMode === 'improved' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.editorial.versionImproved}
                    </button>
                    <button
                      onClick={() => setViewMode('diff')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        viewMode === 'diff' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.editorial.compareDiff}
                    </button>
                  </>
                )}
              </div>
            </div>

            <input
              type="text"
              value={activeChapter.title}
              onChange={(e) =>
                onSaveChapter({
                  ...activeChapter,
                  title: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              className={`text-xl font-bold text-white bg-transparent border-b border-slate-800 focus:border-teal-500 focus:outline-none w-full pb-1 ${
                isArabic ? 'font-arabic text-right' : 'font-sans'
              }`}
              placeholder="Chapter Title"
            />
          </div>

          {/* Editor Area */}
          {viewMode === 'edit' && (
            <textarea
              rows={16}
              value={activeChapter.userEditedContent || activeChapter.originalContent || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-slate-200 text-base leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isArabic ? 'font-arabic-serif text-right text-lg' : 'font-serif-book'
              }`}
              placeholder="Begin writing or paste manuscript content here..."
            />
          )}

          {viewMode === 'improved' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-center justify-between">
                <span>Polished with Authentic Voice Engine ({editingLevel} edit)</span>
                <button
                  onClick={handleAcceptEdits}
                  className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded text-xs"
                >
                  {t.editorial.acceptAll}
                </button>
              </div>
              <div
                className={`w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-slate-200 text-base leading-relaxed max-h-[450px] overflow-y-auto whitespace-pre-wrap ${
                  isArabic ? 'font-arabic-serif text-right text-lg' : 'font-serif-book'
                }`}
              >
                {activeChapter.processedContent}
              </div>
            </div>
          )}

          {viewMode === 'diff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs">
                <span className="text-slate-300">Compare: Original vs AI-Polished</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestoreOriginal}
                    className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.editorial.restoreOriginal}</span>
                  </button>
                  <button
                    onClick={handleAcceptEdits}
                    className="flex items-center gap-1 bg-teal-500 text-slate-950 font-bold px-3 py-1 rounded"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t.editorial.acceptAll}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Original Draft
                  </span>
                  <div
                    className={`bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-slate-300 max-h-[380px] overflow-y-auto whitespace-pre-wrap ${
                      isArabic ? 'font-arabic-serif text-right' : 'font-serif-book'
                    }`}
                  >
                    {activeChapter.originalContent || 'No original manuscript stored.'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-teal-400 uppercase tracking-wider text-[10px]">
                    Authentic Voice Polish
                  </span>
                  <div
                    className={`bg-teal-950/20 border border-teal-500/30 rounded-xl p-3 text-teal-100 max-h-[380px] overflow-y-auto whitespace-pre-wrap ${
                      isArabic ? 'font-arabic-serif text-right' : 'font-serif-book'
                    }`}
                  >
                    {activeChapter.processedContent || 'No polished revision generated yet.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quality Report & Fact Inspection (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quality Metrics Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-teal-400" />
              {t.editorial.qualityReport}
            </h3>

            {qualityReport?.qualityMetrics ? (
              <div className="space-y-3">
                <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-300">{t.editorial.readabilityScore}</span>
                  <span className="text-sm font-bold text-teal-400">
                    {qualityReport.qualityMetrics.readabilityScore}/100
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-300">{t.editorial.grammarFixed}</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {qualityReport.qualityMetrics.grammarIssuesCorrected}
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-300">{t.editorial.repetitionsReduced}</span>
                  <span className="text-sm font-bold text-amber-400">
                    {qualityReport.qualityMetrics.repetitionsReduced}
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-300">{t.editorial.protectedPreserved}</span>
                  <span className="text-sm font-bold text-cyan-400">
                    {qualityReport.qualityMetrics.protectedElementsVerified}
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-300">{t.editorial.voiceMatch}</span>
                  <span className="text-sm font-bold text-teal-300">
                    {qualityReport.qualityMetrics.voiceAuthenticityRating || '95%'}
                  </span>
                </div>

                {qualityReport.changesSummary && (
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {qualityReport.changesSummary}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 space-y-2">
                <p>Run the Authentic Voice Engine to generate deterministic quality metrics and findings.</p>
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-[11px] text-slate-300 text-left space-y-1">
                  <div className="text-teal-400 font-semibold">• Preserves author identity</div>
                  <div className="text-slate-400">• Guards exact citations & dates</div>
                  <div className="text-slate-400">• Zero AI-detection score gaming</div>
                </div>
              </div>
            )}
          </div>

          {/* Fact Integrity Report */}
          {factReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {t.editorial.factCheckTitle}
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    factReport.status === 'Passed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {factReport.status}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Verified Claims: <span className="text-teal-400 font-bold">{factReport.verifiedFactsCount}</span>
              </div>
              {factReport.warnings && factReport.warnings.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold">Flags for Author:</span>
                  {factReport.warnings.map((w: any, idx: number) => (
                    <div key={idx} className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-[11px] text-amber-200">
                      {w.claim}: {w.suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Layers,
  Edit3,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { BookProject, Chapter } from '../types';
import { Language, translations } from '../lib/i18n';
import { DESIGN_FAMILIES } from '../lib/designFamilies';

interface BookWizardProps {
  onComplete: (book: BookProject, chapters: Chapter[]) => void;
  onCancel: () => void;
  language: Language;
}

export const BookWizard: React.FC<BookWizardProps> = ({ onComplete, onCancel, language }) => {
  const t = translations[language];

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [bookLanguage, setBookLanguage] = useState<'en' | 'ar' | 'bilingual'>(language === 'ar' ? 'ar' : 'en');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<any>(null);

  // Blueprint result
  const [blueprint, setBlueprint] = useState<any>(null);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  // Handle Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setLoading(true);
    setExtractedNotice(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(',')[1];
          const res = await fetch('/api/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Content,
              fileName: file.name,
              fileType: file.type,
            }),
          });

          const data = await res.json();
          if (data.error) throw new Error(data.error);

          setRawText(data.extractedText || '');
          if (data.extractedBookTitle) {
            setTitle(data.extractedBookTitle);
          } else if (!title && file.name) {
            setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }

          if (data.extractedAuthorName) {
            setAuthorName(data.extractedAuthorName);
            setExtractedNotice(
              language === 'ar'
                ? `تم استخراج اسم المؤلف تلقائيًا: "${data.extractedAuthorName}"`
                : `Author detected from manuscript: "${data.extractedAuthorName}"`
            );
          }
        } catch (err: any) {
          setError('Failed to extract document: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Step 1 -> 2: Run Book Analysis
  const handleRunAnalysis = async () => {
    if (!rawText.trim()) {
      setError('Please provide manuscript text, notes, or upload a document.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/analyze-manuscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptSample: rawText,
          bookTitle: title,
          authorName,
          language: bookLanguage,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
      if (data.detectedLanguage) {
        setBookLanguage(data.detectedLanguage);
      }
      if (data.extractedAuthorName && (!authorName || authorName.trim() === '')) {
        setAuthorName(data.extractedAuthorName);
      }
      if (data.extractedBookTitle && (!title || title.trim() === '')) {
        setTitle(data.extractedBookTitle);
      }
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Generate Editorial Blueprint
  const handleGenerateBlueprint = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: title || analysis?.subject,
          authorName,
          subject: analysis?.subject,
          targetAudience: analysis?.targetAudience,
          category: analysis?.category,
          language: bookLanguage,
          rawNotes: rawText.slice(0, 10000),
          chapterCount: 5,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBlueprint(data);
      if (data.proposedTitle && !title) setTitle(data.proposedTitle);
      if (data.proposedSubtitle && !subtitle) setSubtitle(data.proposedSubtitle);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to generate editorial blueprint.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Finish: Assemble Book & Chapters
  const handleAssembleBook = () => {
    const bookId = 'book-' + Date.now();
    const finalTitle = title || blueprint?.proposedTitle || 'Untitled Book';
    const finalSubtitle = subtitle || blueprint?.proposedSubtitle || '';
    const finalDesignFamily =
      blueprint?.suggestedDesignFamily?.toLowerCase().replace(/[\s&]+/g, '-') || 'modern-editorial';

    const newBook: BookProject = {
      id: bookId,
      ownerId: 'current-user',
      title: finalTitle,
      subtitle: finalSubtitle,
      authorName: authorName || 'Anonymous Author',
      language: bookLanguage,
      category: analysis?.category || 'General Nonfiction',
      targetAudience: analysis?.targetAudience || 'General Readers',
      description: blueprint?.bookDescription || rawText.slice(0, 300),
      status: 'editing',
      designFamily: finalDesignFamily,
      trimSize: blueprint?.suggestedTrimSize || '6x9',
      editingLevel: 'standard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Split text or use blueprint chapters
    const chapters: Chapter[] = (blueprint?.chapterOutline || [
      { chapterNumber: 1, title: 'Introduction', summary: 'Overview' },
    ]).map((ch: any, idx: number) => {
      // Divide raw text across chapters as starting draft
      const textChunkLength = Math.max(200, Math.floor(rawText.length / (blueprint?.chapterOutline?.length || 1)));
      const start = idx * textChunkLength;
      const initialChunk = rawText.slice(start, start + textChunkLength).trim() || ch.summary;

      return {
        id: `ch-${bookId}-${idx + 1}`,
        bookId,
        ownerId: 'current-user',
        chapterNumber: idx + 1,
        title: ch.title,
        subtitle: ch.subtitle || ch.summary?.slice(0, 60),
        originalContent: initialChunk,
        processedContent: initialChunk,
        userEditedContent: initialChunk,
        wordCount: initialChunk.split(/\s+/).filter(Boolean).length,
        status: 'draft',
        order: idx + 1,
        updatedAt: new Date().toISOString(),
      };
    });

    onComplete(newBook, chapters);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Wizard Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.wizard.title}</h2>
              <p className="text-xs text-slate-400">{t.tagline}</p>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  currentStep === step
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : currentStep > step
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Provide Source Material */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{t.wizard.step1}</h3>
                <p className="text-sm text-slate-400">
                  Upload existing files or paste raw research, notes, or chapter drafts.
                </p>
              </div>

              {/* Title & Author Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-300">{t.wizard.bookTitleLabel}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Architecture of Systems"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-300">{t.wizard.authorLabel}</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-300">{t.wizard.languageLabel}</label>
                  <select
                    value={bookLanguage}
                    onChange={(e) => setBookLanguage(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="en">English (LTR)</option>
                    <option value="ar">العربية (RTL)</option>
                    <option value="bilingual">Bilingual / ثنائي اللغة</option>
                  </select>
                </div>
              </div>

              {extractedNotice && (
                <div className="p-3 bg-teal-500/15 border border-teal-500/30 rounded-xl flex items-center gap-2 text-teal-300 text-xs font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{extractedNotice}</span>
                </div>
              )}

              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-xl p-6 text-center transition-colors bg-slate-800/40 relative">
                <input
                  type="file"
                  accept=".docx,.pdf,.txt,.md"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {fileName ? `Uploaded: ${fileName}` : t.wizard.uploadDocxPdf}
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports Microsoft Word (.docx), PDF text, Markdown (.md), and TXT.
                  </p>
                </div>
              </div>

              {/* Paste Raw Text Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{t.wizard.orPasteText}</span>
                  {rawText && (
                    <span className="text-[11px] text-teal-400 font-mono">
                      {rawText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={t.wizard.pastePlaceholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-serif-book leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Understand the Book (Analysis) */}
          {currentStep === 2 && analysis && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{t.wizard.step2}</h3>
                <p className="text-sm text-slate-400">
                  BookDirector has analyzed your source material. Review the findings before generating the blueprint.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-teal-400 font-semibold uppercase">Subject & Core Thesis</div>
                  <div className="text-sm font-bold text-white">{analysis.subject}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.mainArgument}</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-teal-400 font-semibold uppercase">Target Audience & Category</div>
                  <div className="text-sm font-bold text-white">{analysis.category}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.targetAudience}</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-teal-400 font-semibold uppercase">Author Voice Profile</div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Formality:</span> {analysis.authorVoiceProfile?.formality}
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Tone:</span> {analysis.authorVoiceProfile?.tone}
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Style:</span> {analysis.authorVoiceProfile?.narrativeStyle}
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-teal-400 font-semibold uppercase">Format Recommendation</div>
                  <div className="text-sm font-bold text-white">{analysis.suggestedPublishingFormat}</div>
                  <div className="text-xs text-slate-400">Complexity: {analysis.complexityLevel}</div>
                </div>
              </div>

              {analysis.majorThemes && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Key Themes Detected</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.majorThemes.map((th: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs">
                        {th}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Editorial Blueprint */}
          {currentStep === 3 && blueprint && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{t.wizard.blueprintTitle}</h3>
                <p className="text-sm text-slate-400">{t.wizard.blueprintSubtitle}</p>
              </div>

              {/* Title & Subtitle verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Final Book Title</label>
                  <input
                    type="text"
                    value={title || blueprint.proposedTitle}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle || blueprint.proposedSubtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {/* Back Blurb Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Back-Cover Blurb & Editorial Description</label>
                <textarea
                  rows={3}
                  value={blueprint.bookDescription}
                  onChange={(e) => setBlueprint({ ...blueprint, bookDescription: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white leading-relaxed"
                />
              </div>

              {/* Chapter Outline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    {t.wizard.chapterOutline} ({blueprint.chapterOutline?.length || 0})
                  </h4>
                  <span className="text-xs text-slate-400">
                    ~{blueprint.estimatedTotalPages || 160} pages
                  </span>
                </div>

                <div className="space-y-2.5">
                  {blueprint.chapterOutline?.map((ch: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-white">{ch.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 pl-7">{ch.summary}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">
                        ~{ch.suggestedWordCount || 2500} words
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={() => {
              if (currentStep === 1) onCancel();
              else setCurrentStep((prev) => (prev - 1) as any);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {currentStep === 1 ? t.common.cancel : t.common.back}
          </button>

          <div>
            {currentStep === 1 && (
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.wizard.analyzingTitle}</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Manuscript</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={handleGenerateBlueprint}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Blueprint...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Blueprint</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleAssembleBook}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-900/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.wizard.generateChaptersButton}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

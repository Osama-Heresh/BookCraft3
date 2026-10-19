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
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Network,
  BarChart3,
  Calendar,
  X,
  Sliders,
  Check,
} from 'lucide-react';
import { BookProject, Chapter, IllustrationItem, VisualOpportunity, VisualType, AspectRatio, ImagePlacement } from '../types';
import { Language, translations } from '../lib/i18n';
import { IllustrationIntelligenceEngine } from '../lib/illustrationIntelligence';
import { VISUAL_ASSETS, generateDeterministicDiagram } from '../lib/visualAssetLibrary';

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
  const isArabic = book.language === 'ar' || language === 'ar';
  const isRtl = isArabic;

  const [analyzingPlan, setAnalyzingPlan] = useState(false);
  const [opportunities, setOpportunities] = useState<VisualOpportunity[]>(() =>
    IllustrationIntelligenceEngine.analyzeManuscriptVisualPlan(book, chapters)
  );
  const [selectedAssetForItemId, setSelectedAssetForItemId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Re-run manuscript analysis
  const handleRunVisualIntelligence = () => {
    setAnalyzingPlan(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const opps = IllustrationIntelligenceEngine.analyzeManuscriptVisualPlan(book, chapters);
      setOpportunities(opps);
      setStatusMessage(
        isArabic
          ? `تم فحص المسودة واقتراح ${opps.length} فرصة إيضاحية بصرية متسقة مع الفصول!`
          : `Manuscript analyzed: detected ${opps.length} principled visual opportunities!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error analyzing manuscript.');
    } finally {
      setAnalyzingPlan(false);
    }
  };

  // Adopt opportunity into live illustration items
  const handleAdoptOpportunity = (opp: VisualOpportunity) => {
    const item = IllustrationIntelligenceEngine.instantiateIllustration(opp, book.id, 'current-user');
    onSaveIllustration(item);
    setStatusMessage(
      isArabic
        ? `تم اعتماد الرسم "${opp.conceptName}" وإدراجه في الفصل ${opp.chapterNumber}!`
        : `Approved visual "${opp.conceptName}" for Chapter ${opp.chapterNumber}!`
    );
    setTimeout(() => {
      document.getElementById('approved-visuals-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Upload custom high-res image for an item
  const handleUploadImageForItem = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const target = illustrations.find((i) => i.id === itemId);
      if (target && dataUrl) {
        onSaveIllustration({
          ...target,
          imageUrl: dataUrl,
          status: 'approved',
        });
        setStatusMessage(
          isArabic ? 'تم رفع الصورة المخصصة وتعيينها للشكل!' : 'Custom high-res image uploaded for illustration!'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate deterministic technical diagram for an item
  const handleGenerateDeterministicDiagram = (item: IllustrationItem) => {
    const diagramUrl = generateDeterministicDiagram({
      title: item.purpose,
      subtitle: item.caption,
      type: 'architecture',
      nodes: [
        { id: '1', label: isArabic ? 'مدخلات الإدراك' : 'Perception Ingestion', role: isArabic ? 'مرحلة جمع البيانات' : 'Sensory Feed', color: '#0F766E' },
        { id: '2', label: isArabic ? 'حلقة الاستدلال المركزي' : 'Cognitive Core', role: isArabic ? 'المعالجة الحتمية' : 'Deterministic Loop', color: '#38BDF8' },
        { id: '3', label: isArabic ? 'أدوات التنفيذ الموثقة' : 'Verified Actuators', role: isArabic ? 'تنفيذ الإجراءات' : 'Safety Gate', color: '#C8A96B' },
      ],
      isRtl,
    });

    onSaveIllustration({
      ...item,
      imageUrl: diagramUrl,
      visualType: 'technical_diagram',
      status: 'approved',
    });
    setStatusMessage(
      isArabic ? 'تم إنشاء مخطط هندسي حتمي دقيق مع الحواشي!' : 'Deterministic technical diagram generated with verified labels!'
    );
  };

  // Generate image via API
  const handleGenerateImage = async (item: IllustrationItem) => {
    setGeneratingId(item.id);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const prompt = `Professional editorial publication illustration: ${item.purpose}. ${item.description}. Clean lighting, publication standard artwork.`;
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: item.aspectRatio || '16:9',
          visualType: item.visualType || 'editorial_illustration',
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        onSaveIllustration({
          ...item,
          imageUrl: data.imageUrl,
          status: 'approved',
        });
        setStatusMessage(
          data.note ||
            (isArabic ? 'تم توليد الصورة واعتمادها بنجاح!' : 'Illustration generated and approved successfully!')
        );
      } else {
        throw new Error(data.error || 'Failed to generate image.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Generation quota limit reached. You can select an authentic artwork from the Visual Library or create a deterministic diagram.'
      );
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Illustration Intelligence & Editorial Visual Studio</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t.illustrations.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.illustrations.subtitle}</p>
        </div>

        <button
          onClick={handleRunVisualIntelligence}
          disabled={analyzingPlan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          {analyzingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isArabic ? 'إعادة تحليل المسودة والتخطيط البصري' : 'Analyze Manuscript Visual Plan'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manuscript Visual Intelligence Opportunities Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              {isArabic ? 'الفرص الإيضاحية المقترحة من محرك الذكاء البصري' : 'Principled Visual Opportunities (Manuscript-Grounded)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isArabic
                ? 'فرص إيضاحية مبنية على قراءة فصول الكتاب لتجنب الرسوم الزخرفية العشوائية وحساب كثافة الإيضاح المعيارية'
                : 'Curated visual opportunities derived from manuscript text analysis to avoid gratuitous decorative filler'}
            </p>
          </div>

          <span className="text-[11px] text-teal-400 font-mono px-2.5 py-1 bg-slate-950 rounded-full border border-teal-500/30">
            {opportunities.length} Opportunities Detected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => {
            const alreadyAdopted = illustrations.some((i) => i.purpose === opp.conceptName);
            return (
              <div
                key={opp.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-850/60 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono">
                      Ch. {opp.chapterNumber} • {opp.recommendedVisualType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        opp.importance === 'essential'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {opp.importance}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-tight">{opp.conceptName}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {opp.educationalPurpose}
                  </p>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[10px] text-slate-400 italic line-clamp-2">
                    "{opp.relevantPassageSnippet}"
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {opp.aspectRatio}
                  </span>
                  <button
                    onClick={() => handleAdoptOpportunity(opp)}
                    disabled={alreadyAdopted}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      alreadyAdopted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                    }`}
                  >
                    {alreadyAdopted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{alreadyAdopted ? (isArabic ? 'معتمد في الكتاب' : 'Approved') : (isArabic ? 'اعتماد وإدراج' : 'Approve for Book')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Approved Visuals in the Book */}
      <div id="approved-visuals-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              {isArabic ? 'الرسوم والأشكال المعتمدة داخل الكتاب' : 'Approved Visual Assets in Manuscript'}
            </h3>
            <span className="text-xs text-slate-400">
              {illustrations.length} {isArabic ? 'عناصر بصرية مدمجة في التصدير' : 'assets integrated into exported PDF & DOCX'}
            </span>
          </div>
        </div>

        {illustrations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No illustrations approved yet.</p>
            <p className="text-xs text-slate-500">Adopt an opportunity above or create a technical diagram.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {illustrations.map((item) => (
              <div
                key={item.id}
                className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between"
              >
                {/* Visual Artwork Container */}
                <div className="aspect-[16/9] w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.purpose}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-4 text-center text-slate-500 space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
                      <span className="text-xs block">Visual Pending Generation</span>
                    </div>
                  )}

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 rtl:right-2 rtl:left-auto flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900/90 text-teal-300 border border-slate-700 font-mono">
                      Ch. {item.chapterNumber || 1} • {item.visualType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/90 text-slate-950 font-mono">
                      APPROVED ✓
                    </span>
                  </div>
                </div>

                {/* Details & Controls */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{item.purpose}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                  </div>

                  {/* Caption input */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      {isArabic ? 'التعليق التوضيحي المعتمد في الصفحة:' : 'Printed Caption in Manuscript:'}
                    </label>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => onSaveIllustration({ ...item, caption: e.target.value })}
                      className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAssetForItemId(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                        title="Choose from Asset Library"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>

                      <label
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                        title="Upload Custom Image"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImageForItem(item.id, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => handleGenerateDeterministicDiagram(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-medium cursor-pointer"
                        title="Generate Deterministic Diagram"
                      >
                        <Network className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleGenerateImage(item)}
                        disabled={generatingId === item.id}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                        title="Regenerate with AI"
                      >
                        {generatingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => onDeleteIllustration(item.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 text-xs cursor-pointer"
                      title="Remove from book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Selection Modal */}
      {selectedAssetForItemId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-400" />
                {isArabic ? 'اختر عملاً فنياً من مكتبة النشر' : 'Select Curated Publishing Artwork'}
              </h3>
              <button
                onClick={() => setSelectedAssetForItemId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {VISUAL_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    const target = illustrations.find((i) => i.id === selectedAssetForItemId);
                    if (target) {
                      onSaveIllustration({
                        ...target,
                        imageUrl: asset.url,
                        visualType: asset.visualType,
                        status: 'approved',
                      });
                    }
                    setSelectedAssetForItemId(null);
                  }}
                  className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-teal-500 cursor-pointer bg-slate-950 flex flex-col justify-between"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900">
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

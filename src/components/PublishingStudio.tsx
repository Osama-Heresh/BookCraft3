import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  FileCheck,
  Loader2,
  Download,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { BookProject, Chapter, CoverConfig, IllustrationItem, PreflightReport } from '../types';
import { Language, translations } from '../lib/i18n';
import { ExportService } from '../lib/exportService';

interface PublishingStudioProps {
  book: BookProject;
  chapters: Chapter[];
  cover: CoverConfig | null;
  illustrations: IllustrationItem[];
  language: Language;
}

export const PublishingStudio: React.FC<PublishingStudioProps> = ({
  book,
  chapters,
  cover,
  illustrations,
  language,
}) => {
  const t = translations[language];

  const [preflight, setPreflight] = useState<PreflightReport>(() =>
    ExportService.runPreflightCheck(book, chapters, cover, illustrations)
  );
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleRunPreflight = () => {
    const report = ExportService.runPreflightCheck(book, chapters, cover, illustrations);
    setPreflight(report);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Print-Ready PDF
  const handleExportPrintPDF = async () => {
    setExportingFormat('print_pdf');
    setDownloadSuccess(null);
    setExportError(null);
    try {
      const blob = await ExportService.generatePDF(book, chapters, cover, illustrations, 'print');
      const filename = `${book.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_Print_Ready.pdf`;
      downloadBlob(blob, filename);
      setDownloadSuccess(
        language === 'ar'
          ? 'تم إنشاء وتنزيل ملف PDF الجاهز للمطابع بنجاح مع ربط الخط العربي وتضمين الصور!'
          : 'Print-Ready PDF generated and downloaded successfully with Arabic shaping & embedded images!'
      );
    } catch (err: any) {
      setExportError(err.message || 'PDF export failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  // Export Digital PDF
  const handleExportDigitalPDF = async () => {
    setExportingFormat('digital_pdf');
    setDownloadSuccess(null);
    setExportError(null);
    try {
      const blob = await ExportService.generatePDF(book, chapters, cover, illustrations, 'digital');
      const filename = `${book.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_Digital.pdf`;
      downloadBlob(blob, filename);
      setDownloadSuccess(
        language === 'ar'
          ? 'تم إنشاء وتنزيل ملف PDF الرقمي التفاعلي بنجاح!'
          : 'Digital PDF generated and downloaded successfully!'
      );
    } catch (err: any) {
      setExportError(err.message || 'Digital PDF export failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  // Export DOCX
  const handleExportDOCX = async () => {
    setExportingFormat('docx');
    setDownloadSuccess(null);
    setExportError(null);
    try {
      const blob = await ExportService.generateDOCX(book, chapters, cover, illustrations);
      const filename = `${book.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_Manuscript.docx`;
      downloadBlob(blob, filename);
      setDownloadSuccess(
        language === 'ar'
          ? 'تم إنشاء وتنزيل ملف Word (.docx) بالمحاذاة التامة لليمين وتضمين الرسوم!'
          : 'Structured Word (.docx) document downloaded with RTL alignment and illustrations!'
      );
    } catch (err: any) {
      setExportError(err.message || 'DOCX export failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
            <Printer className="w-3.5 h-3.5" />
            <span>Industrial Publishing Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t.publishing.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.publishing.subtitle}</p>
        </div>

        <button
          onClick={handleRunPreflight}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>{t.publishing.runPreflight}</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-sm">
          <Check className="w-5 h-5 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {exportError && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Print Preflight Audit Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              {t.publishing.preflightTitle}
            </h3>
            <span className="text-xs text-slate-400">
              Evaluated at {new Date(preflight.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">{t.publishing.preflightStatus}</span>
              <span
                className={`text-sm font-bold px-2.5 py-0.5 rounded-full inline-block ${
                  preflight.status === 'Passed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {preflight.status} ({preflight.score}%)
              </span>
            </div>
          </div>
        </div>

        {/* Preflight Checks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {preflight.checks.map((c, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                c.passed
                  ? 'bg-slate-800/40 border-slate-800 text-slate-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {c.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-white">{c.name}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Formats Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileDown className="w-4 h-4 text-teal-400" />
          {t.publishing.formats}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Print-Ready PDF */}
          <div className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Printer className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">{t.publishing.printPdf}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.publishing.printPdfDesc}
              </p>
              <div className="pt-2 text-[11px] text-teal-400 font-mono space-y-1">
                <div>• Trim: {book.trimSize.toUpperCase()}</div>
                <div>• Gutter: 24mm binding safety margin</div>
                <div>• Running headers & recto/verso folios</div>
              </div>
            </div>

            <button
              onClick={handleExportPrintPDF}
              disabled={exportingFormat === 'print_pdf'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
            >
              {exportingFormat === 'print_pdf' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.publishing.exporting}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.publishing.exportNow}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Digital Interactive PDF */}
          <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">{t.publishing.digitalPdf}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.publishing.digitalPdfDesc}
              </p>
              <div className="pt-2 text-[11px] text-cyan-400 font-mono space-y-1">
                <div>• Screen-optimized reading margins</div>
                <div>• Interactive Table of Contents</div>
                <div>• Embedded high-resolution figures</div>
              </div>
            </div>

            <button
              onClick={handleExportDigitalPDF}
              disabled={exportingFormat === 'digital_pdf'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
            >
              {exportingFormat === 'digital_pdf' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.publishing.exporting}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.publishing.exportNow}</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Editable DOCX */}
          <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">{t.publishing.docxExport}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.publishing.docxDesc}
              </p>
              <div className="pt-2 text-[11px] text-indigo-400 font-mono space-y-1">
                <div>• Standard Microsoft Word styling</div>
                <div>• Heading 1, 2 & Title hierarchies</div>
                <div>• 1.5 line spacing for review</div>
              </div>
            </div>

            <button
              onClick={handleExportDOCX}
              disabled={exportingFormat === 'docx'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
            >
              {exportingFormat === 'docx' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.publishing.exporting}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.publishing.exportNow}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

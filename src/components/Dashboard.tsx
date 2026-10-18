import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Layers,
  ChevronRight,
  Copy,
  Trash2,
  FolderOpen,
  AlertTriangle,
  X,
} from 'lucide-react';
import { BookProject } from '../types';
import { Language, translations } from '../lib/i18n';

interface DashboardProps {
  books: BookProject[];
  onSelectBook: (book: BookProject) => void;
  onNewBook: () => void;
  onDuplicateBook: (book: BookProject) => void;
  onDeleteBook: (id: string) => void;
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  onSelectBook,
  onNewBook,
  onDuplicateBook,
  onDeleteBook,
  language,
}) => {
  const t = translations[language];
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<BookProject | null>(null);

  const inEditingCount = books.filter((b) => b.status === 'editing').length;
  const readyPublishCount = books.filter(
    (b) => b.status === 'design_ready' || b.status === 'export_ready' || b.status === 'published'
  ).length;

  const getStatusBadge = (status: BookProject['status']) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'export_ready':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'design_ready':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'editing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'blueprint_ready':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.tagline}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              {t.dashboard.welcome}
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              {t.dashboard.subtitle}
            </p>
          </div>

          <button
            onClick={onNewBook}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-teal-900/40 hover:scale-102 active:scale-98 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{t.dashboard.createNewBook}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{books.length}</div>
            <div className="text-xs text-slate-400 font-medium">{t.dashboard.stats.totalBooks}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{inEditingCount}</div>
            <div className="text-xs text-slate-400 font-medium">{t.dashboard.stats.inEditing}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{readyPublishCount}</div>
            <div className="text-xs text-slate-400 font-medium">{t.dashboard.stats.readyToPublish}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">9</div>
            <div className="text-xs text-slate-400 font-medium">Design Systems</div>
          </div>
        </div>
      </div>

      {/* Book Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-teal-400" />
            {t.dashboard.recentBooks}
          </h2>
          <span className="text-xs text-slate-400">
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </span>
        </div>

        {books.length === 0 ? (
          <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">{t.dashboard.noBooksTitle}</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{t.dashboard.noBooksDesc}</p>
            <button
              onClick={onNewBook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.dashboard.createNewBook}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const isArabic = book.language === 'ar';
              return (
                <div
                  key={book.id}
                  className="group relative bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 rounded-2xl p-6 transition-all shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          book.status
                        )}`}
                      >
                        {t.dashboard.statusLabels[book.status] || book.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="px-2 py-0.5 bg-slate-900 rounded font-mono text-[10px] uppercase">
                          {book.trimSize}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[10px] uppercase font-bold text-teal-400">
                          {book.language}
                        </span>
                      </div>
                    </div>

                    {/* Book Title */}
                    <div>
                      <h3
                        className={`text-lg font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2 ${
                          isArabic ? 'font-arabic' : 'font-sans'
                        }`}
                      >
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-medium">
                          {book.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Author & Category */}
                    <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/60">
                      <span className="truncate">{book.authorName || 'Author'}</span>
                      <span className="text-teal-400/90 font-medium truncate max-w-[120px]">
                        {book.category}
                      </span>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  {/* Card bottom actions */}
                  <div className="mt-5 pt-4 border-t border-slate-700/70 flex items-center justify-between">
                    <button
                      onClick={() => onSelectBook(book)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <span>{t.dashboard.openStudio}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateBook(book);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title={t.dashboard.duplicate}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmBook(book);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setDeleteConfirmBook(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {t.common.confirmDelete}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-white">"{deleteConfirmBook.title}"</span>? This action cannot be undone and will permanently remove all chapters and assets.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmBook(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBook(deleteConfirmBook.id);
                  setDeleteConfirmBook(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-900/40 transition-colors"
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

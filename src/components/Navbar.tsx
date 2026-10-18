import React from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Feather,
  Palette,
  Image as ImageIcon,
  BookMarked,
  Printer,
  Globe,
  LogIn,
  LogOut,
  User,
  PlusCircle,
} from 'lucide-react';
import { BookProject } from '../types';
import { Language, translations } from '../lib/i18n';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeBook: BookProject | null;
  books: BookProject[];
  onSelectBook: (book: BookProject) => void;
  onNewBook: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  activeBook,
  books,
  onSelectBook,
  onNewBook,
  language,
  onLanguageChange,
  user,
}) => {
  const t = translations[language];

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Google sign-in popup closed or cancelled:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-900/30 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  BookCraft <span className="text-teal-400 font-extrabold">AI</span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-1 font-medium">
                  {language === 'ar' ? 'استوديو النشر الذكي' : 'Publishing Studio'}
                </span>
              </div>
            </button>

            {/* Active Book Selector */}
            {activeBook && (
              <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  {language === 'ar' ? 'المشروع:' : 'Book:'}
                </span>
                <select
                  value={activeBook.id}
                  onChange={(e) => {
                    const found = books.find((b) => b.id === e.target.value);
                    if (found) onSelectBook(found);
                  }}
                  className="bg-slate-800/90 text-sm text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {t.nav.dashboard}
            </button>

            {activeBook && (
              <>
                <button
                  onClick={() => onTabChange('writing')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'writing'
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Feather className="w-4 h-4" />
                  {t.nav.writingStudio}
                </button>

                <button
                  onClick={() => onTabChange('design')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'design'
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  {t.nav.designStudio}
                </button>

                <button
                  onClick={() => onTabChange('illustrations')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'illustrations'
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {t.nav.illustrationStudio}
                </button>

                <button
                  onClick={() => onTabChange('cover')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'cover'
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookMarked className="w-4 h-4" />
                  {t.nav.coverStudio}
                </button>

                <button
                  onClick={() => onTabChange('publishing')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'publishing'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {t.nav.publishing}
                </button>
              </>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* New Book Action Button */}
            <button
              onClick={onNewBook}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              {t.dashboard.createNewBook}
            </button>

            {/* Language Switcher Button */}
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-teal-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                  title={t.nav.signOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-400" />
                {t.nav.signIn}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

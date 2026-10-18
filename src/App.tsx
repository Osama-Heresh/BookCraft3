import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BookWizard } from './components/BookWizard';
import { WritingStudio } from './components/WritingStudio';
import { DesignStudio } from './components/DesignStudio';
import { IllustrationStudio } from './components/IllustrationStudio';
import { CoverStudio } from './components/CoverStudio';
import { PublishingStudio } from './components/PublishingStudio';
import { BookProject, Chapter, CoverConfig, IllustrationItem } from './types';
import { Language } from './lib/i18n';
import { StorageService } from './lib/storage';
import { auth, testConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [books, setBooks] = useState<BookProject[]>([]);
  const [activeBook, setActiveBook] = useState<BookProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [cover, setCover] = useState<CoverConfig | null>(null);
  const [illustrations, setIllustrations] = useState<IllustrationItem[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth & Load Data
  useEffect(() => {
    // Test connection on boot as mandated by Firebase integration rules
    testConnection().catch(console.warn);

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      loadProjects();
    });

    return () => unsubscribe();
  }, []);

  // Update HTML document direction and font when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const loadedBooks = await StorageService.getBooks();
      setBooks(loadedBooks);

      if (loadedBooks.length > 0) {
        const first = loadedBooks[0];
        setActiveBook(first);
        await loadBookDetails(first.id);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookDetails = async (bookId: string) => {
    try {
      const [chs, cov, ills] = await Promise.all([
        StorageService.getChapters(bookId),
        StorageService.getCoverConfig(bookId),
        StorageService.getIllustrations(bookId),
      ]);
      setChapters(chs);
      setCover(cov);
      setIllustrations(ills);
    } catch (err) {
      console.error('Error loading book details:', err);
    }
  };

  const handleSelectBook = async (book: BookProject) => {
    setActiveBook(book);
    await loadBookDetails(book.id);
    if (book.language === 'ar' && language !== 'ar') {
      setLanguage('ar');
    }
  };

  const handleUpdateBook = async (updatedFields: Partial<BookProject>) => {
    if (!activeBook) return;
    const updated = { ...activeBook, ...updatedFields, updatedAt: new Date().toISOString() };
    setActiveBook(updated);
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    await StorageService.saveBook(updated);
  };

  const handleSaveChapter = async (chapter: Chapter) => {
    setChapters((prev) => prev.map((c) => (c.id === chapter.id ? chapter : c)));
    await StorageService.saveChapter(chapter);
  };

  const handleAddChapter = async () => {
    if (!activeBook) return;
    const nextOrder = chapters.length + 1;
    const newChapter: Chapter = {
      id: `ch-${activeBook.id}-${Date.now()}`,
      bookId: activeBook.id,
      ownerId: user?.uid || 'guest-user',
      chapterNumber: nextOrder,
      title: language === 'ar' ? `الفصل ${nextOrder}` : `Chapter ${nextOrder}`,
      subtitle: '',
      originalContent: '',
      processedContent: '',
      userEditedContent: '',
      wordCount: 0,
      status: 'draft',
      order: nextOrder,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = [...chapters, newChapter];
    setChapters(updatedList);
    await StorageService.saveChapter(newChapter);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!activeBook) return;
    const updated = chapters.filter((c) => c.id !== chapterId);
    setChapters(updated);
    localStorage.setItem(`bookcraft_chapters_${activeBook.id}`, JSON.stringify(updated));
  };

  const handleSaveCover = async (updatedCover: CoverConfig) => {
    setCover(updatedCover);
    await StorageService.saveCoverConfig(updatedCover);
  };

  const handleSaveIllustration = async (item: IllustrationItem) => {
    setIllustrations((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
    await StorageService.saveIllustration(item);
  };

  const handleDeleteIllustration = (id: string) => {
    if (!activeBook) return;
    const updated = illustrations.filter((i) => i.id !== id);
    setIllustrations(updated);
    localStorage.setItem(`bookcraft_illustrations_${activeBook.id}`, JSON.stringify(updated));
  };

  const handleWizardComplete = async (newBook: BookProject, newChapters: Chapter[]) => {
    setShowWizard(false);
    const bookToSave = { ...newBook, ownerId: user?.uid || 'guest-user' };
    await StorageService.saveBook(bookToSave);
    await StorageService.saveAllChapters(bookToSave.id, newChapters);

    // Initial default cover
    const defaultCover: CoverConfig = {
      id: 'cov-' + bookToSave.id,
      bookId: bookToSave.id,
      ownerId: user?.uid || 'guest-user',
      frontTitle: bookToSave.title,
      frontSubtitle: bookToSave.subtitle,
      authorName: bookToSave.authorName,
      spineText: `${bookToSave.title} • ${bookToSave.authorName}`,
      spineWidthMm: 12.5,
      backBlurb: bookToSave.description,
      authorBio: `${bookToSave.authorName} is an author and specialist.`,
      isbn: '978-1-954321-00-8',
      themeColor: '#0F172A',
      fontStyle: 'Modern Sans Geometric',
      updatedAt: new Date().toISOString(),
    };
    await StorageService.saveCoverConfig(defaultCover);

    setBooks((prev) => [bookToSave, ...prev]);
    setActiveBook(bookToSave);
    setChapters(newChapters);
    setCover(defaultCover);
    setIllustrations([]);
    setCurrentTab('writing');
  };

  const handleDuplicateBook = async (book: BookProject) => {
    const dupId = 'book-' + Date.now();
    const duplicated: BookProject = {
      ...book,
      id: dupId,
      title: `${book.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await StorageService.saveBook(duplicated);
    setBooks((prev) => [duplicated, ...prev]);
  };

  const handleDeleteBook = async (id: string) => {
    await StorageService.deleteBook(id);
    const remaining = books.filter((b) => b.id !== id);
    setBooks(remaining);
    if (activeBook?.id === id) {
      if (remaining.length > 0) {
        handleSelectBook(remaining[0]);
      } else {
        setActiveBook(null);
        setChapters([]);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeBook={activeBook}
        books={books}
        onSelectBook={handleSelectBook}
        onNewBook={() => setShowWizard(true)}
        language={language}
        onLanguageChange={setLanguage}
        user={user}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <Dashboard
            books={books}
            onSelectBook={(b) => {
              handleSelectBook(b);
              setCurrentTab('writing');
            }}
            onNewBook={() => setShowWizard(true)}
            onDuplicateBook={handleDuplicateBook}
            onDeleteBook={handleDeleteBook}
            language={language}
          />
        )}

        {currentTab === 'writing' && activeBook && (
          <WritingStudio
            book={activeBook}
            chapters={chapters}
            onSaveChapter={handleSaveChapter}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            language={language}
          />
        )}

        {currentTab === 'design' && activeBook && (
          <DesignStudio
            book={activeBook}
            chapters={chapters}
            onUpdateBook={handleUpdateBook}
            language={language}
          />
        )}

        {currentTab === 'illustrations' && activeBook && (
          <IllustrationStudio
            book={activeBook}
            chapters={chapters}
            illustrations={illustrations}
            onSaveIllustration={handleSaveIllustration}
            onDeleteIllustration={handleDeleteIllustration}
            language={language}
          />
        )}

        {currentTab === 'cover' && activeBook && (
          <CoverStudio
            book={activeBook}
            chapters={chapters}
            cover={cover}
            onSaveCover={handleSaveCover}
            language={language}
          />
        )}

        {currentTab === 'publishing' && activeBook && (
          <PublishingStudio
            book={activeBook}
            chapters={chapters}
            cover={cover}
            illustrations={illustrations}
            language={language}
          />
        )}
      </main>

      {/* Guided Creation Wizard Modal */}
      {showWizard && (
        <BookWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          language={language}
        />
      )}
    </div>
  );
}

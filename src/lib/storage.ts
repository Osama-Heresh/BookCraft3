import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { BookProject, Chapter, CoverConfig, IllustrationItem } from '../types';

// Starter data for pre-populated projects
const STARTER_BOOKS: BookProject[] = [
  {
    id: 'book-1',
    ownerId: 'default-owner',
    title: 'تاريخ الفلك والمخطوطات العلمية في الأندلس',
    subtitle: 'دراسة تحليلية للمرصد والمؤلفات الفلكية في القرطبة الإسلامية',
    authorName: 'أ.د. يوسف الحكيم',
    category: 'History & Science',
    targetAudience: 'Academic & Cultural Readers',
    language: 'ar',
    status: 'design_ready',
    designFamily: 'historical-archive',
    trimSize: '6x9',
    editingLevel: 'standard',
    description: 'توثيق علمي وتاريخي شامل لأبرز علماء الفلك وأدوات الرصد والمخطوطات النادرة في الأندلس.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'book-2',
    ownerId: 'default-owner',
    title: 'Autonomous AI Agents: Architectures & Invariant Design',
    subtitle: 'Building resilient multi-modal cognitive systems with vector memory',
    authorName: 'Dr. Jane Smith',
    category: 'Technology & AI',
    targetAudience: 'Software Engineers & Researchers',
    language: 'en',
    status: 'editing',
    designFamily: 'technical-engineering',
    trimSize: 'a4',
    editingLevel: 'deep',
    description: 'A comprehensive engineering guide to autonomous agents, vector retrieval architectures, and safety verification loops.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STARTER_CHAPTERS: Record<string, Chapter[]> = {
  'book-1': [
    {
      id: 'ch-1-1',
      bookId: 'book-1',
      ownerId: 'default-owner',
      chapterNumber: 1,
      title: 'مدخل إلى التراث العلمي الفلكي في الأندلس',
      subtitle: 'الأسس والمصادر التاريخية الأولى',
      originalContent: 'بدأت النهضة العلمية في الأندلس مبكراً بفضل اهتمام الأمويين بالعلوم والرياضيات والفلك...\n\nكان العلماء يعتمدون على الرصد الميداني والجداول الفلكية المتقدمة المستمدة من التراث الهندي والفارسي واليوناني مع إضافات نوعية غيرت وجه العلوم الدقيقة.',
      processedContent: 'بدأت النهضة العلمية في الأندلس مبكراً بفضل اهتمام الأمويين بالعلوم والرياضيات والفلك...\n\nكان العلماء يعتمدون على الرصد الميداني والجداول الفلكية المتقدمة المستمدة من التراث الهندي والفارسي واليوناني مع إضافات نوعية غيرت وجه العلوم الدقيقة.',
      userEditedContent: '',
      wordCount: 120,
      status: 'approved',
      order: 1,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ch-1-2',
      bookId: 'book-1',
      ownerId: 'default-owner',
      chapterNumber: 2,
      title: 'المراصد الفلكية وأدوات القياس المبتكرة',
      subtitle: 'الأسطرلاب والرباعيات النحاسية',
      originalContent: 'برز في قرطبة وسرقسطة نخبة من الفلكيين الذين طوروا صناعة الأسطرلاب والكرة السماوية...\n\nكان الأسطرلاب الأندلسي يتميز بدقة الحسابات الهندسية والنقوش النباتية والهندسية الدقيقة.',
      processedContent: 'برز في قرطبة وسرقسطة نخبة من الفلكيين الذين طوروا صناعة الأسطرلاب والكرة السماوية...\n\nكان الأسطرلاب الأندلسي يتميز بدقة الحسابات الهندسية والنقوش النباتية والهندسية الدقيقة.',
      userEditedContent: '',
      wordCount: 140,
      status: 'approved',
      order: 2,
      updatedAt: new Date().toISOString(),
    },
  ],
  'book-2': [
    {
      id: 'ch-2-1',
      bookId: 'book-2',
      ownerId: 'default-owner',
      chapterNumber: 1,
      title: 'Foundations of Multi-Tier Cognitive Agents',
      subtitle: 'Perception, Reasoning, and Memory Hierarchies',
      originalContent: 'Autonomous agents require robust three-tier architectures that decouple perception ingestion from deterministic reasoning loops and verified actuator execution...\n\nBy leveraging vector memory databases and Retrieval-Augmented Generation (RAG), systems maintain contextual continuity across complex execution graphs.',
      processedContent: 'Autonomous agents require robust three-tier architectures that decouple perception ingestion from deterministic reasoning loops and verified actuator execution...\n\nBy leveraging vector memory databases and Retrieval-Augmented Generation (RAG), systems maintain contextual continuity across complex execution graphs.',
      userEditedContent: '',
      wordCount: 160,
      status: 'approved',
      order: 1,
      updatedAt: new Date().toISOString(),
    },
  ],
};

const STARTER_COVERS: Record<string, CoverConfig> = {
  'book-1': {
    id: 'cover-1',
    bookId: 'book-1',
    ownerId: 'default-owner',
    frontTitle: 'تاريخ الفلك والمخطوطات العلمية في الأندلس',
    frontSubtitle: 'دراسة تحليلية للمرصد والمؤلفات الفلكية',
    authorName: 'أ.د. يوسف الحكيم',
    spineText: 'تاريخ الفلك والأندلس',
    spineWidthMm: 12,
    backBlurb: 'توثيق علمي وتاريخي شامل لأبرز علماء الفلك وأدوات الرصد والمخطوطات النادرة في الأندلس.',
    authorBio: 'أ.د. يوسف الحكيم هو باحث ومؤرخ متخصص في تاريخ العلوم والتراث الفلكي الأندلسي.',
    themeColor: '#0f766e',
    fontStyle: 'Amiri',
    isbn: '978-9953-1-0023-4',
    coverArtworkUrl: '/assets/images/historical_astronomy_scene_1792360789067.jpg',
    updatedAt: new Date().toISOString(),
  },
  'book-2': {
    id: 'cover-2',
    bookId: 'book-2',
    ownerId: 'default-owner',
    frontTitle: 'Autonomous AI Agents',
    frontSubtitle: 'Architectures & Invariant Design',
    authorName: 'Dr. Jane Smith',
    spineText: 'Autonomous AI Agents',
    spineWidthMm: 12,
    backBlurb: 'A comprehensive engineering guide to autonomous agents, vector retrieval architectures, and safety verification loops.',
    authorBio: 'Dr. Jane Smith is a senior AI systems researcher and autonomous agent architect.',
    themeColor: '#0284c7',
    fontStyle: 'EB Garamond',
    isbn: '978-1-954321-00-8',
    coverArtworkUrl: '/assets/images/ai_agents_diagram_1792360790515.jpg',
    updatedAt: new Date().toISOString(),
  },
};

const STARTER_ILLUSTRATIONS: Record<string, IllustrationItem[]> = {
  'book-1': [
    {
      id: 'ill-1',
      bookId: 'book-1',
      chapterNumber: 1,
      ownerId: 'default',
      purpose: 'Historical Astronomical Instruments & Manuscripts',
      description: 'Archival reconstruction of empirical scholars and observational instruments in Cordoba.',
      visualType: 'editorial_illustration',
      aspectRatio: '16:9',
      placement: 'chapter_header',
      caption: 'Figure 1.1: Archival reconstruction of empirical scholars and observational instruments.',
      sourceCredit: 'Kitab al-Tasrif Historical Archives § 30',
      importance: 'essential',
      status: 'approved',
      imageUrl: '/assets/images/historical_astronomy_scene_1792360789067.jpg',
      createdAt: new Date().toISOString(),
    },
  ],
  'book-2': [
    {
      id: 'ill-2',
      bookId: 'book-2',
      chapterNumber: 1,
      ownerId: 'default',
      purpose: 'Autonomous Agent Three-Tier Cognitive System Architecture',
      description: 'Detailed schematic of multi-head self-attention and vector retrieval loop.',
      visualType: 'technical_diagram',
      aspectRatio: '16:9',
      placement: 'chapter_header',
      caption: 'Figure 1.1: Autonomous agent system architecture decoupling vector retrieval from execution state.',
      sourceCredit: 'Autonomous Systems Design Specifications 2026',
      importance: 'essential',
      status: 'approved',
      imageUrl: '/assets/images/ai_agents_diagram_1792360790515.jpg',
      createdAt: new Date().toISOString(),
    },
  ],
};

export class StorageService {
  // --- BOOKS ---
  private static getLocalBooks(): BookProject[] {
    const raw = localStorage.getItem('bookcraft_books');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return STARTER_BOOKS;
  }

  private static saveLocalBooks(books: BookProject[]): void {
    localStorage.setItem('bookcraft_books', JSON.stringify(books));
  }

  static async getBooks(): Promise<BookProject[]> {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(collection(db, 'books'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const fbBooks: BookProject[] = [];
        snap.forEach((d) => fbBooks.push(d.data() as BookProject));
        if (fbBooks.length > 0) {
          this.saveLocalBooks(fbBooks);
          return fbBooks;
        }
      } catch (err) {
        console.warn('Firestore getBooks fallback to local:', err);
      }
    }
    return this.getLocalBooks();
  }

  static async getBookById(id: string): Promise<BookProject | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'books', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as BookProject;
        }
      } catch (err) {
        console.warn('Firestore getBookById error, fallback to local:', err);
      }
    }
    const local = this.getLocalBooks();
    return local.find((b) => b.id === id) || null;
  }

  static async saveBook(book: BookProject): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `books/${book.id}`;
      try {
        const docRef = doc(db, 'books', book.id);
        await setDoc(docRef, { ...book, ownerId: user.uid }, { merge: true });
      } catch (err) {
        console.warn('Firestore saveBook warning (falling back to local storage):', err);
      }
    }

    // Always update local cache successfully
    const local = this.getLocalBooks();
    const idx = local.findIndex((b) => b.id === book.id);
    if (idx >= 0) {
      local[idx] = book;
    } else {
      local.unshift(book);
    }
    this.saveLocalBooks(local);
  }

  static async deleteBook(id: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `books/${id}`;
      try {
        await deleteDoc(doc(db, 'books', id));
      } catch (err) {
        console.warn('Firestore deleteBook warning:', err);
      }
    }

    const local = this.getLocalBooks().filter((b) => b.id !== id);
    this.saveLocalBooks(local);
  }

  // --- CHAPTERS ---
  static async getChapters(bookId: string): Promise<Chapter[]> {
    const user = auth.currentUser;
    if (user) {
      try {
        const chRef = collection(db, 'books', bookId, 'chapters');
        const snap = await getDocs(chRef);
        const fbChapters: Chapter[] = [];
        snap.forEach((d) => fbChapters.push(d.data() as Chapter));
        if (fbChapters.length > 0) {
          return fbChapters.sort((a, b) => a.order - b.order);
        }
      } catch (err) {
        console.warn('Firestore getChapters error, fallback to local:', err);
      }
    }

    const storedChapters = localStorage.getItem(`bookcraft_chapters_${bookId}`);
    if (storedChapters) {
      try {
        return JSON.parse(storedChapters);
      } catch {}
    }

    if (STARTER_CHAPTERS[bookId]) {
      return STARTER_CHAPTERS[bookId];
    }

    return [];
  }

  static async saveChapter(chapter: Chapter): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `books/${chapter.bookId}/chapters/${chapter.id}`;
      try {
        const docRef = doc(db, 'books', chapter.bookId, 'chapters', chapter.id);
        await setDoc(docRef, { ...chapter, ownerId: user.uid }, { merge: true });
      } catch (err) {
        console.warn('Firestore saveChapter warning:', err);
      }
    }

    const current = await this.getChapters(chapter.bookId);
    const idx = current.findIndex((c) => c.id === chapter.id);
    if (idx >= 0) {
      current[idx] = chapter;
    } else {
      current.push(chapter);
    }
    localStorage.setItem(`bookcraft_chapters_${chapter.bookId}`, JSON.stringify(current));
  }

  static async saveAllChapters(bookId: string, chapters: Chapter[]): Promise<void> {
    for (const ch of chapters) {
      await this.saveChapter(ch);
    }
  }

  // --- COVER CONFIG ---
  static async getCoverConfig(bookId: string): Promise<CoverConfig | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'books', bookId, 'coverConfig', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as CoverConfig;
        }
      } catch (err) {
        console.warn('Firestore getCoverConfig fallback:', err);
      }
    }

    const local = localStorage.getItem(`bookcraft_cover_${bookId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    return STARTER_COVERS[bookId] || null;
  }

  static async saveCoverConfig(config: CoverConfig): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `books/${config.bookId}/coverConfig/${config.id}`;
      try {
        const docRef = doc(db, 'books', config.bookId, 'coverConfig', config.id);
        await setDoc(docRef, { ...config, ownerId: user.uid }, { merge: true });
      } catch (err) {
        console.warn('Firestore saveCoverConfig warning:', err);
      }
    }

    localStorage.setItem(`bookcraft_cover_${config.bookId}`, JSON.stringify(config));
  }

  // --- ILLUSTRATIONS ---
  static async getIllustrations(bookId: string): Promise<IllustrationItem[]> {
    const user = auth.currentUser;
    if (user) {
      try {
        const illRef = collection(db, 'books', bookId, 'illustrations');
        const snap = await getDocs(illRef);
        const fbIll: IllustrationItem[] = [];
        snap.forEach((d) => fbIll.push(d.data() as IllustrationItem));
        if (fbIll.length > 0) return fbIll;
      } catch (err) {
        console.warn('Firestore getIllustrations fallback:', err);
      }
    }

    const local = localStorage.getItem(`bookcraft_illustrations_${bookId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    return STARTER_ILLUSTRATIONS[bookId] || [];
  }

  static async saveIllustration(item: IllustrationItem): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `books/${item.bookId}/illustrations/${item.id}`;
      try {
        const docRef = doc(db, 'books', item.bookId, 'illustrations', item.id);
        await setDoc(docRef, { ...item, ownerId: user.uid }, { merge: true });
      } catch (err) {
        console.warn('Firestore saveIllustration warning:', err);
      }
    }

    const list = await this.getIllustrations(item.bookId);
    const idx = list.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem(`bookcraft_illustrations_${item.bookId}`, JSON.stringify(list));
  }
}

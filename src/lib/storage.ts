import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { BookProject, Chapter, CoverConfig, IllustrationItem, WritingQualityReport } from '../types';

const LOCAL_STORAGE_KEY = 'bookcraft_ai_projects';
const ACTIVE_BOOK_KEY = 'bookcraft_active_book_id';

// Default starter books to give users an immediate interactive experience
export const STARTER_BOOKS: BookProject[] = [
  {
    id: 'starter-1',
    ownerId: 'demo-user',
    title: 'The Architecture of Autonomous Systems',
    subtitle: 'From Cognitive Agents to Resilient Infrastructure',
    authorName: 'Dr. Evelyn Vance & Tariq Al-Mansoor',
    language: 'en',
    category: 'Technology & STEM',
    targetAudience: 'Software Engineers, AI Architects, and Technology Leaders',
    description: 'An authoritative guide examining the principles, fault-tolerant patterns, and verifiable safety guarantees necessary to construct autonomous multi-agent systems at industrial scale.',
    status: 'editing',
    designFamily: 'technical-engineering',
    trimSize: '6x9',
    editingLevel: 'standard',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-2',
    ownerId: 'demo-user',
    title: 'تاريخ الطب العربي في الأندلس',
    subtitle: 'من ابن زهر إلى الزهراوي: إسهامات غيرت مجرى الجراحة العالمية',
    authorName: 'أ.د. يوسف الحكيم',
    language: 'ar',
    category: 'History & Genealogy',
    targetAudience: 'المؤرخون، الأطباء، والباحثون في التراث العلمي الإسلامي',
    description: 'دراسة وثائقية تاريخية معمقة تستعرض المخطوطات الطبية الأندلسية، والأدوات الجراحية المبتكرة، ومناهج الفحص السريري التي أرست قواعد الطب الحديث.',
    status: 'design_ready',
    designFamily: 'historical-archive',
    trimSize: '6x9',
    editingLevel: 'deep',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const STARTER_CHAPTERS: Record<string, Chapter[]> = {
  'starter-1': [
    {
      id: 'ch-1-1',
      bookId: 'starter-1',
      ownerId: 'demo-user',
      chapterNumber: 1,
      title: 'Foundations of Agentic Architecture',
      subtitle: 'State Machines, Memory Hierarchies, and Deterministic Orchestration',
      originalContent: `Autonomous software agents represent a decisive shift from reactive request-response paradigms to proactive goal-directed execution. Unlike conventional algorithmic pipelines, an autonomous agent continuously perceives its environment, synthesizes internal state representations, and selects actions calibrated to maximize an objective function.\n\nThe core challenge in modern agentic systems is not reasoning capability in isolation, but reliability under uncertainty. When an agent interacts with external APIs, network latency, transient failures, and ambiguous user instructions introduce non-deterministic variance. Systems architects must therefore construct resilient state machines equipped with self-healing feedback loops and transactional idempotency.\n\nIn this chapter, we delineate the three foundational tiers of autonomous agent architecture: sensory perception, semantic working memory, and execution actuators. By decoupling long-term vector embeddings from ephemeral execution context, architects can achieve predictable latencies while preserving context depth.`,
      processedContent: `Autonomous software agents mark a decisive transition from reactive request-response pipelines to proactive, goal-oriented execution. Rather than executing rigid step-by-step instructions, an agent continuously observes environment feedback, updates internal state representations, and selects actions designed to achieve specified objectives.\n\nHowever, the chief hurdle in production systems is not sheer reasoning power, but deterministic reliability under operational uncertainty. When interacting with distributed APIs and fluctuating network conditions, external variance often derails execution. Architects must therefore construct fault-tolerant state machines with automated recovery loops and transactional idempotency.\n\nWe structure this foundational analysis across three tiers: sensory ingestion, semantic memory hierarchies, and verified actuators. Decoupling vector embeddings from ephemeral execution scratchpads guarantees predictable latency while maintaining rich contextual depth.`,
      userEditedContent: `Autonomous software agents mark a decisive transition from reactive request-response pipelines to proactive, goal-oriented execution. Rather than executing rigid step-by-step instructions, an agent continuously observes environment feedback, updates internal state representations, and selects actions designed to achieve specified objectives.\n\nHowever, the chief hurdle in production systems is not sheer reasoning power, but deterministic reliability under operational uncertainty. When interacting with distributed APIs and fluctuating network conditions, external variance often derails execution. Architects must therefore construct fault-tolerant state machines with automated recovery loops and transactional idempotency.\n\nWe structure this foundational analysis across three tiers: sensory ingestion, semantic memory hierarchies, and verified actuators. Decoupling vector embeddings from ephemeral execution scratchpads guarantees predictable latency while maintaining rich contextual depth.`,
      wordCount: 168,
      status: 'improved',
      order: 1,
      updatedAt: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          label: 'Writing Quality Engine Polish',
          content: 'Autonomous software agents mark a decisive transition from reactive request-response pipelines...',
        },
      ],
    },
    {
      id: 'ch-1-2',
      bookId: 'starter-1',
      ownerId: 'demo-user',
      chapterNumber: 2,
      title: 'Safety Invariants & Formal Verification',
      subtitle: 'Guaranteed Bounds on Tool Invocations and Reversible Actions',
      originalContent: `Without explicit guardrails, autonomous agents possess the capacity to execute irreversible operations with catastrophic velocity. Tool invocation permissions must be rigorously bounded by mathematically verifiable constraints.\n\nStatic security rules and runtime sandboxing are both mandatory. Every mutation must pass through an authorization gateway that verifies identity, role tokens, and transaction limits before execution.`,
      processedContent: `Without explicit guardrails, autonomous agents possess the capacity to execute irreversible operations with catastrophic velocity. Tool invocation permissions must be rigorously bounded by mathematically verifiable constraints.\n\nStatic security rules and runtime sandboxing are both mandatory. Every mutation must pass through an authorization gateway that verifies identity, role tokens, and transaction limits before execution.`,
      userEditedContent: `Without explicit guardrails, autonomous agents possess the capacity to execute irreversible operations with catastrophic velocity. Tool invocation permissions must be rigorously bounded by mathematically verifiable constraints.\n\nStatic security rules and runtime sandboxing are both mandatory. Every mutation must pass through an authorization gateway that verifies identity, role tokens, and transaction limits before execution.`,
      wordCount: 58,
      status: 'draft',
      order: 2,
      updatedAt: new Date().toISOString(),
    },
  ],
  'starter-2': [
    {
      id: 'ch-2-1',
      bookId: 'starter-2',
      ownerId: 'demo-user',
      chapterNumber: 1,
      title: 'فجر الجراحة في قرطبة: عبقرية الزهراوي',
      subtitle: 'كتاب التصريف لمن عجز عن التأليف والأدوات الجراحية الأولى في التاريخ',
      originalContent: `يعد أبو القاسم خلف بن عباس الزهراوي (المتوفى عام 404 هـ / 1013 م) علامة فارقة في تاريخ الطب الإنساني، ورائد فن الجراحة بلا منازع في العصور الوسطى. عاش الزهراوي في مدينة الزهراء بالقرب من قرطبة، وكرّس حياته لتدوين خلاصة تجاربه السريرية في موسوعته الخالدة "التصريف لمن عجز عن التأليف" المكونة من ثلاثين مقالة.\n\nكانت المقالة الثلاثون هي الأهم والأكثر تأثيرًا في تاريخ الجراحة، حيث خصصها بالكامل للعمل الجراحي، وضمّنها أكثر من مائتي رسم توضيحي دقيق للأدوات الجراحية التي ابتكرها بنفسه أو طوّرها، مثل خيوط الجراحة المصنوعة من أمعاء الحيوانات (Catgut) والتي ما تزال تستخدم حتى يومنا هذا، إضافة إلى مقصات استئصال الأورام ومشارط شق الحنجرة.\n\nلم يكن الزهراوي يكتفي بالوصف النظري، بل شدد على ضرورة دراسة علم التشريح دراسة عملية دقيقة قبل الإقدام على أي تدخل جراحي، محذرًا من الجراحين الأدعياء الذين يجهلون مواضع الشرايين والأعصاب الحيوية.`,
      processedContent: `يعد أبو القاسم خلف بن عباس الزهراوي (المتوفى عام 404 هـ / 1013 م) علامة فارقة في تاريخ الطب الإنساني، ورائد فن الجراحة بلا منازع في العصور الوسطى. عاش الزهراوي في مدينة الزهراء بالقرب من قرطبة، وكرّس حياته لتدوين خلاصة تجاربه السريرية في موسوعته الخالدة "التصريف لمن عجز عن التأليف" المكونة من ثلاثين مقالة.\n\nكانت المقالة الثلاثون هي الأهم والأكثر تأثيرًا في تاريخ الجراحة، حيث خصصها بالكامل للعمل الجراحي، وضمّنها أكثر من مائتي رسم توضيحي دقيق للأدوات الجراحية التي ابتكرها بنفسه أو طوّرها، مثل خيوط الجراحة المصنوعة من أمعاء الحيوانات (Catgut) والتي ما تزال تستخدم حتى يومنا هذا، إضافة إلى مقصات استئصال الأورام ومشارط شق الحنجرة.\n\nلم يكن الزهراوي يكتفي بالوصف النظري، بل شدد على ضرورة دراسة علم التشريح دراسة عملية دقيقة قبل الإقدام على أي تدخل جراحي، محذرًا من الجراحين الأدعياء الذين يجهلون مواضع الشرايين والأعصاب الحيوية.`,
      userEditedContent: `يعد أبو القاسم خلف بن عباس الزهراوي (المتوفى عام 404 هـ / 1013 م) علامة فارقة في تاريخ الطب الإنساني، ورائد فن الجراحة بلا منازع في العصور الوسطى. عاش الزهراوي في مدينة الزهراء بالقرب من قرطبة، وكرّس حياته لتدوين خلاصة تجاربه السريرية في موسوعته الخالدة "التصريف لمن عجز عن التأليف" المكونة من ثلاثين مقالة.\n\nكانت المقالة الثلاثون هي الأهم والأكثر تأثيرًا في تاريخ الجراحة، حيث خصصها بالكامل للعمل الجراحي، وضمّنها أكثر من مائتي رسم توضيحي دقيق للأدوات الجراحية التي ابتكرها بنفسه أو طوّرها، مثل خيوط الجراحة المصنوعة من أمعاء الحيوانات (Catgut) والتي ما تزال تستخدم حتى يومنا هذا، إضافة إلى مقصات استئصال الأورام ومشارط شق الحنجرة.\n\nلم يكن الزهراوي يكتفي بالوصف النظري، بل شدد على ضرورة دراسة علم التشريح دراسة عملية دقيقة قبل الإقدام على أي تدخل جراحي، محذرًا من الجراحين الأدعياء الذين يجهلون مواضع الشرايين والأعصاب الحيوية.`,
      wordCount: 172,
      status: 'approved',
      order: 1,
      updatedAt: new Date().toISOString(),
    },
  ],
};

export const STARTER_COVERS: Record<string, CoverConfig> = {
  'starter-1': {
    id: 'cov-1',
    bookId: 'starter-1',
    ownerId: 'demo-user',
    frontTitle: 'The Architecture of Autonomous Systems',
    frontSubtitle: 'From Cognitive Agents to Resilient Infrastructure',
    authorName: 'Dr. Evelyn Vance & Tariq Al-Mansoor',
    spineText: 'Autonomous Systems • Vance & Al-Mansoor',
    spineWidthMm: 12.5,
    backBlurb: 'How do we engineer autonomous agents that operate safely under real-world uncertainty? This comprehensive text provides systems engineers and software architects with battle-tested patterns for memory hierarchies, deterministic tool gates, and formal safety verification.',
    authorBio: 'Dr. Evelyn Vance is Principal Research Scientist in Distributed Systems. Tariq Al-Mansoor is Chief Architect specializing in verified autonomous infrastructure.',
    isbn: '978-1-954321-44-1',
    themeColor: '#0F172A',
    fontStyle: 'Modern Sans Geometric',
    updatedAt: new Date().toISOString(),
  },
  'starter-2': {
    id: 'cov-2',
    bookId: 'starter-2',
    ownerId: 'demo-user',
    frontTitle: 'تاريخ الطب العربي في الأندلس',
    frontSubtitle: 'من ابن زهر إلى الزهراوي: إسهامات غيرت مجرى الجراحة العالمية',
    authorName: 'أ.د. يوسف الحكيم',
    spineText: 'تاريخ الطب العربي في الأندلس • أ.د. يوسف الحكيم',
    spineWidthMm: 14.8,
    backBlurb: 'رحلة استقصائية في روائع التراث الطبي الأندلسي، تكشف بالوثائق والمخطوطات النادرة كيف ساهم أطباء قرطبة وإشبيلية في وضع اللبنات الأولى للجراحة الحديثة وتصنيف الأمراض السريرية.',
    authorBio: 'أستاذ كرسي التاريخ الطبي في المعهد العالي للبحوث التاريخية، ومحقق لعدد من أهم المخطوطات الطبية التراثية.',
    isbn: '978-9-771234-88-0',
    themeColor: '#78350F',
    fontStyle: 'Arabic Traditional Calligraphic',
    updatedAt: new Date().toISOString(),
  },
};

export const STARTER_ILLUSTRATIONS: Record<string, IllustrationItem[]> = {
  'starter-1': [
    {
      id: 'ill-1-1',
      bookId: 'starter-1',
      chapterNumber: 1,
      ownerId: 'demo-user',
      purpose: 'Autonomous Agent Three-Tier System Architecture Diagram',
      description: 'System architectural diagram illustrating the separation of sensory perception, working memory scratchpads, and execution actuators with feedback loops.',
      visualType: 'diagram',
      aspectRatio: '16:9',
      placement: 'chapter_header',
      caption: 'Figure 1.1: Multi-tiered agent architecture decoupling working context from semantic vector store.',
      status: 'generated',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230F172A"/><rect x="80" y="80" width="180" height="280" rx="12" fill="%231E293B" stroke="%230F766E" stroke-width="2"/><text x="170" y="120" fill="%2310B981" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Sensory Ingestion</text><text x="170" y="160" fill="%2394A3B8" font-family="sans-serif" font-size="12" text-anchor="middle">Multi-modal Feeds</text><rect x="310" y="80" width="180" height="280" rx="12" fill="%231E293B" stroke="%2338BDF8" stroke-width="2"/><text x="400" y="120" fill="%2338BDF8" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Cognitive Core</text><text x="400" y="160" fill="%2394A3B8" font-family="sans-serif" font-size="12" text-anchor="middle">Reasoning &amp; State</text><rect x="540" y="80" width="180" height="280" rx="12" fill="%231E293B" stroke="%23C8A96B" stroke-width="2"/><text x="630" y="120" fill="%23C8A96B" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Verified Actuators</text><text x="630" y="160" fill="%2394A3B8" font-family="sans-serif" font-size="12" text-anchor="middle">Guarded Tool Calls</text><line x1="260" y1="220" x2="310" y2="220" stroke="%2310B981" stroke-width="3"/><line x1="490" y1="220" x2="540" y2="220" stroke="%2338BDF8" stroke-width="3"/></svg>',
      createdAt: new Date().toISOString(),
    },
  ],
  'starter-2': [
    {
      id: 'ill-2-1',
      bookId: 'starter-2',
      chapterNumber: 1,
      ownerId: 'demo-user',
      purpose: 'Historical Surgical Instruments of Al-Zahrawi',
      description: 'Engraving representation of historical surgical tools from Kitab al-Tasrif (forceps, speculum, scalpel).',
      visualType: 'illustration',
      aspectRatio: '16:9',
      placement: 'chapter_header',
      caption: 'الشكل ١.١: رسم توضيحي لأدوات الجراحة المبتكرة من المقالة الثلاثين في كتاب التصريف لمن عجز عن التأليف.',
      status: 'generated',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%232D150B"/><rect x="40" y="40" width="720" height="370" rx="8" fill="%23FFFDF7" stroke="%23C8A96B" stroke-width="4"/><text x="400" y="100" fill="%2378350F" font-family="sans-serif" font-weight="bold" font-size="22" text-anchor="middle">أدوات الجراحة في كتاب التصريف (القرن الرابع الهجري)</text><circle cx="250" cy="240" r="70" fill="%23FEF3C7" stroke="%23B45309" stroke-width="2"/><text x="250" y="245" fill="%2392400E" font-family="sans-serif" font-size="14" text-anchor="middle">مشرط شق القصبة</text><circle cx="550" cy="240" r="70" fill="%23FEF3C7" stroke="%23B45309" stroke-width="2"/><text x="550" y="245" fill="%2392400E" font-family="sans-serif" font-size="14" text-anchor="middle">كلاليب استخراج العظام</text></svg>',
      createdAt: new Date().toISOString(),
    },
  ],
};

// Storage Service with Firestore + Local Fallback
export class StorageService {
  private static getLocalBooks(): BookProject[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    // Initialize with starter books
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(STARTER_BOOKS));
    return STARTER_BOOKS;
  }

  private static saveLocalBooks(books: BookProject[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // --- BOOKS ---
  static async getBooks(): Promise<BookProject[]> {
    const user = auth.currentUser;
    if (user) {
      try {
        const booksRef = collection(db, 'books');
        const q = query(booksRef, where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const fbBooks: BookProject[] = [];
        snap.forEach((doc) => fbBooks.push(doc.data() as BookProject));
        if (fbBooks.length > 0) return fbBooks;
      } catch (err) {
        console.warn('Firestore fetch failed, using local storage:', err);
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
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // Always update local cache
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
        handleFirestoreError(err, OperationType.DELETE, path);
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
        handleFirestoreError(err, OperationType.WRITE, path);
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
        handleFirestoreError(err, OperationType.WRITE, path);
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
        handleFirestoreError(err, OperationType.WRITE, path);
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

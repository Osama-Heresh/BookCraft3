export type BookLanguage = 'en' | 'ar' | 'bilingual';

export type BookStatus =
  | 'draft'
  | 'processing'
  | 'blueprint_ready'
  | 'editing'
  | 'design_ready'
  | 'export_ready'
  | 'published';

export type TrimSize = '6x9' | 'a4' | 'us_letter';

export type EditingLevel = 'light' | 'standard' | 'deep';

export interface BookProject {
  id: string;
  ownerId: string;
  title: string;
  subtitle: string;
  authorName: string;
  language: BookLanguage;
  category: string;
  targetAudience: string;
  description: string;
  status: BookStatus;
  designFamily: string;
  trimSize: TrimSize;
  editingLevel: EditingLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  ownerId: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  originalContent: string;
  processedContent: string;
  userEditedContent: string;
  wordCount: number;
  status: 'draft' | 'analyzing' | 'improved' | 'approved';
  order: number;
  updatedAt: string;
  history?: Array<{
    timestamp: string;
    label: string;
    content: string;
  }>;
}

export interface WritingQualityFinding {
  type: 'grammar' | 'transition' | 'clarity' | 'protected_preserved' | 'flagged_for_author';
  description: string;
  location?: string;
}

export interface WritingQualityReport {
  id: string;
  bookId: string;
  chapterId: string;
  ownerId: string;
  readabilityScore: number;
  grammarIssuesCount: number;
  repetitionIssuesCount: number;
  protectedElementsCount: number;
  voiceMatchRating: string;
  changesSummary: string;
  findings: WritingQualityFinding[];
  createdAt: string;
}

export type VisualType = 'diagram' | 'chart' | 'illustration' | 'photo' | 'timeline' | 'map';
export type AspectRatio = '16:9' | '4:3' | '1:1' | '3:2';
export type ImagePlacement = 'chapter_header' | 'inline_paragraph' | 'full_page' | 'callout';

export interface IllustrationItem {
  id: string;
  bookId: string;
  chapterId?: string;
  chapterNumber?: number;
  ownerId: string;
  purpose: string;
  description: string;
  visualType: VisualType;
  aspectRatio: AspectRatio;
  placement: ImagePlacement;
  caption: string;
  status: 'planned' | 'generating' | 'generated' | 'approved' | 'rejected';
  imageUrl?: string;
  createdAt: string;
}

export interface CoverConfig {
  id: string;
  bookId: string;
  ownerId: string;
  frontTitle: string;
  frontSubtitle: string;
  authorName: string;
  spineText: string;
  spineWidthMm: number;
  backBlurb: string;
  authorBio: string;
  isbn: string;
  themeColor: string;
  fontStyle: string;
  coverArtworkUrl?: string;
  authorPhotoUrl?: string;
  updatedAt: string;
}

export interface DesignSystem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  description: string;
  descriptionAr: string;
  bodyFont: string;
  headingFont: string;
  primaryAccent: string;
  secondaryAccent: string;
  pageBackground: string;
  trimSize: TrimSize;
  sampleQuote: string;
  sampleQuoteAr: string;
}

export interface PreflightCheckItem {
  name: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface PreflightReport {
  status: 'Passed' | 'Passed with warnings' | 'Failed';
  score: number;
  checks: PreflightCheckItem[];
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  languagePreference: 'en' | 'ar';
}

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
  preferredPageTemplate?: PageTemplateId;
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

export type VisualType =
  | 'editorial_illustration'
  | 'photorealistic'
  | 'educational_diagram'
  | 'technical_diagram'
  | 'infographic'
  | 'chart'
  | 'map_timeline'
  | 'instructional'
  | 'chapter_opener'
  | 'diagram'
  | 'illustration'
  | 'photo'
  | 'timeline'
  | 'map';

export type AspectRatio = '16:9' | '4:3' | '1:1' | '3:2' | '3:4';
export type ImagePlacement = 'chapter_header' | 'inline_paragraph' | 'full_page' | 'callout';

export interface VisualOpportunity {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  conceptName: string;
  educationalPurpose: string;
  relevantPassageSnippet: string;
  recommendedVisualType: VisualType;
  recommendedPlacement: ImagePlacement;
  aspectRatio: AspectRatio;
  importance: 'essential' | 'recommended' | 'optional';
  captionBrief: string;
  dataLabelsOrLegend?: string[];
  sourceReference?: string;
  suggestedArtworkUrl?: string;
}

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
  sourceCredit?: string;
  importance?: 'essential' | 'recommended' | 'optional';
  status: 'planned' | 'generating' | 'generated' | 'approved' | 'rejected';
  imageUrl?: string;
  deterministicData?: {
    nodes?: Array<{ id: string; label: string; role?: string; color?: string }>;
    links?: Array<{ from: string; to: string; label?: string }>;
    chartData?: Array<{ label: string; value: number; unit?: string }>;
    timelineEvents?: Array<{ year: string; title: string; description: string }>;
  };
  createdAt: string;
}

export type CoverLayoutFamily =
  | 'full-bleed-hero'
  | 'minimal-typographic'
  | 'editorial-split'
  | 'premium-heritage'
  | 'luxury-professional'
  | 'bold-contemporary'
  | 'academic-grid';

export interface CoverConcept {
  id: string;
  conceptName: string;
  conceptNameAr: string;
  category: string;
  visualTheme: string;
  visualThemeAr: string;
  description: string;
  descriptionAr: string;
  focalPoint: string;
  focalPointAr: string;
  palette: string[];
  recommendedArtworkUrl?: string;
  recommendedLayout: CoverLayoutFamily;
  contrastMode: 'dark' | 'light';
  lightingMood: string;
}

export type PaperStock = '50_white' | '60_cream' | '70_white' | '80_gloss';
export type BindingMethod = 'perfect_paperback' | 'case_hardcover';

export interface SpineCalculation {
  pageCount: number;
  paperStock: PaperStock;
  bindingMethod: BindingMethod;
  pageThicknessMm: number;
  spineWidthMm: number;
  hasSpineText: boolean;
  safeMarginMm: number;
  bleedMm: number;
  fullCoverWidthMm: number;
  fullCoverHeightMm: number;
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
  coverLayoutFamily?: CoverLayoutFamily;
  activeConceptId?: string;
  paperStock?: PaperStock;
  bindingMethod?: BindingMethod;
  pageCount?: number;
  coverArtworkUrl?: string;
  authorPhotoUrl?: string;
  barcodeUrl?: string;
  publisherName?: string;
  updatedAt: string;
}

export type ChapterStyle =
  | 'arch'
  | 'asymmetric-bar'
  | 'luxury-rule'
  | 'minimal'
  | 'workbook-card'
  | 'photo-hero'
  | 'academic-frame'
  | 'bold-numeral'
  | 'narrative-vignette';

export type HeaderStyle =
  | 'ornate-divider'
  | 'asymmetric-pill'
  | 'hairline-rule'
  | 'minimal-clean'
  | 'badge-tracker'
  | 'caption-strip'
  | 'dual-academic-rule'
  | 'solid-contrast-tab'
  | 'delicate-italic';

export type PageTemplateId =
  | 'chapter-opener'
  | 'text-callout'
  | 'two-column-framework'
  | 'figure-caption'
  | 'summary-takeaways';

export interface PageTemplateInfo {
  id: PageTemplateId;
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  description: string;
  descriptionAr: string;
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
  textColor?: string;
  trimSize: TrimSize;
  sampleQuote: string;
  sampleQuoteAr: string;
  chapterStyle?: ChapterStyle;
  headerStyle?: HeaderStyle;
  ornamentStyle?: 'islamic-geometric' | 'hairline' | 'bold-block' | 'none' | 'botanical-flourish' | 'modern-line';
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

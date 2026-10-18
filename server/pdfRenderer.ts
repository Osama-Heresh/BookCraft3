import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BookProject, Chapter, CoverConfig, IllustrationItem } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy-load and cache font base64 data to ensure 100% offline self-contained font embedding
let cachedAmiriBase64: string | null = null;
let cachedGaramondBase64: string | null = null;

function getAmiriBase64(): string {
  if (cachedAmiriBase64) return cachedAmiriBase64;
  const fontPath = path.resolve(__dirname, '../public/fonts/Amiri-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    cachedAmiriBase64 = fs.readFileSync(fontPath).toString('base64');
  } else {
    // Fallback to amiriFont.ts if file missing
    try {
      const amiriModulePath = path.resolve(__dirname, '../src/lib/fonts/amiriFont.ts');
      if (fs.existsSync(amiriModulePath)) {
        const content = fs.readFileSync(amiriModulePath, 'utf8');
        const match = content.match(/AMIRI_FONT_BASE64\s*=\s*["']([^"']+)["']/);
        if (match) cachedAmiriBase64 = match[1];
      }
    } catch (e) {
      console.warn('Could not read amiriFont.ts fallback:', e);
    }
  }
  return cachedAmiriBase64 || '';
}

function getGaramondBase64(): string {
  if (cachedGaramondBase64) return cachedGaramondBase64;
  const fontPath = path.resolve(__dirname, '../public/fonts/EBGaramond-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    cachedGaramondBase64 = fs.readFileSync(fontPath).toString('base64');
  }
  return cachedGaramondBase64 || '';
}

// Convert hex color to safe RGB tuple
function hexToRgb(hex: string): [number, number, number] {
  let clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return [15, 118, 110];
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Escape HTML entities to prevent XSS and broken tags
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Simple markdown formatter for chapter paragraphs: headings, lists, bold, italics, quotes
function formatMarkdownToHtml(text: string, isRtl: boolean): string {
  if (!text) return '';
  const lines = text.split('\n');
  const output: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        output.push(`</${listType}>`);
        inList = false;
      }
      continue;
    }

    // Heading 2 (## )
    if (/^##\s+/.test(trimmed)) {
      if (inList) {
        output.push(`</${listType}>`);
        inList = false;
      }
      const title = trimmed.replace(/^##\s+/, '');
      output.push(`<h2 class="section-h2">${escapeHtml(title)}</h2>`);
      continue;
    }

    // Heading 3 (### )
    if (/^###\s+/.test(trimmed)) {
      if (inList) {
        output.push(`</${listType}>`);
        inList = false;
      }
      const title = trimmed.replace(/^###\s+/, '');
      output.push(`<h3 class="section-h3">${escapeHtml(title)}</h3>`);
      continue;
    }

    // Blockquote (> )
    if (/^>\s+/.test(trimmed)) {
      if (inList) {
        output.push(`</${listType}>`);
        inList = false;
      }
      const quote = trimmed.replace(/^>\s+/, '');
      output.push(`<blockquote class="pull-quote">${escapeHtml(quote)}</blockquote>`);
      continue;
    }

    // Bullet List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        if (inList) output.push(`</${listType}>`);
        output.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const item = trimmed.replace(/^[-*]\s+/, '');
      output.push(`<li>${escapeHtml(item)}</li>`);
      continue;
    }

    // Numbered List (1. 2. etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) output.push(`</${listType}>`);
        output.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const item = trimmed.replace(/^\d+\.\s+/, '');
      output.push(`<li>${escapeHtml(item)}</li>`);
      continue;
    }

    if (inList) {
      output.push(`</${listType}>`);
      inList = false;
    }

    // Regular paragraph
    let formatted = escapeHtml(trimmed);
    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    output.push(`<p class="body-p">${formatted}</p>`);
  }

  if (inList) {
    output.push(`</${listType}>`);
  }

  return output.join('\n');
}

/**
 * Builds the complete publication HTML document for a book.
 * It enforces HarfBuzz native OpenType shaping, Unicode bidirectional layout (UAX #9),
 * dual-line InDesign borders, colored header boxes, and page breaks.
 */
export function buildBookHtml(
  book: BookProject,
  chapters: Chapter[],
  cover: CoverConfig | null,
  illustrations: IllustrationItem[] = [],
  mode: 'print' | 'digital' = 'print'
): { html: string; widthMm: number; heightMm: number } {
  const isRtl = book.language === 'ar' || /[\u0600-\u06FF]/.test(book.title || '') || /[\u0600-\u06FF]/.test(book.description || '');
  const isBilingual = book.language === 'bilingual';

  // Dimensions in mm
  let widthMm = 152.4; // 6x9 trade book
  let heightMm = 228.6;
  if (book.trimSize === 'a4') {
    widthMm = 210;
    heightMm = 297;
  } else if (book.trimSize === 'us_letter') {
    widthMm = 215.9;
    heightMm = 279.4;
  }

  const marginMm = mode === 'print' ? 18 : 14;
  const themeHex = (cover?.themeColor || '#0f766e').trim();
  const [r, g, b] = hexToRgb(themeHex);
  const themeRgbStr = `${r}, ${g}, ${b}`;

  const amiriBase64 = getAmiriBase64();
  const garamondBase64 = getGaramondBase64();

  // Pre-calculate estimated page numbers for Table of Contents
  let currentEstPage = 1;
  const tocEntries: Array<{ title: string; page: number; isConclusion?: boolean }> = [];

  // Cover is Page 1, Copyright is Page 2, TOC is Page 3, Intro is Page 4 (if present)
  let baseChapterPage = 3;
  if (book.description && book.description.trim().length > 15) {
    baseChapterPage = 4;
  }

  chapters.forEach((ch, idx) => {
    const pageNum = baseChapterPage + idx;
    tocEntries.push({
      title: isRtl ? `الفصل ${idx + 1}: ${ch.title}` : `Chapter ${idx + 1}: ${ch.title}`,
      page: pageNum,
    });
  });

  const html = `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(book.title)}</title>
<style>
  @font-face {
    font-family: 'Amiri';
    src: url('data:font/truetype;charset=utf-8;base64,${amiriBase64}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'EB Garamond';
    src: url('data:font/truetype;charset=utf-8;base64,${garamondBase64}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  @page {
    size: ${widthMm}mm ${heightMm}mm;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: ${isRtl ? "'Amiri', 'Traditional Arabic', serif" : "'EB Garamond', Georgia, serif"};
    direction: ${isRtl ? 'rtl' : 'ltr'};
    text-align: ${isRtl ? 'right' : 'left'};
    color: #1e293b;
    background-color: #ffffff;
    font-size: 11pt;
    line-height: 1.85;
    -webkit-font-smoothing: antialiased;
  }

  /* Page Wrapper */
  .book-page {
    width: ${widthMm}mm;
    min-height: ${heightMm}mm;
    padding: ${marginMm}mm;
    position: relative;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #ffffff;
  }

  /* Dual-Line InDesign Page Border Frame */
  .page-border-frame {
    position: absolute;
    top: 6mm;
    left: 6mm;
    right: 6mm;
    bottom: 6mm;
    border: 1.5px solid ${themeHex};
    pointer-events: none;
    box-sizing: border-box;
  }
  .page-border-frame::after {
    content: '';
    position: absolute;
    top: 1.5mm;
    left: 1.5mm;
    right: 1.5mm;
    bottom: 1.5mm;
    border: 0.5px solid rgba(${themeRgbStr}, 0.45);
    box-sizing: border-box;
  }

  /* Running Header in Colored Rectangle */
  .running-header {
    background-color: ${themeHex};
    color: #ffffff;
    border-radius: 2mm;
    padding: 1.8mm 3.5mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 8.5pt;
    font-weight: 500;
    margin-bottom: 5mm;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .running-header span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45%;
  }

  /* Running Footer with Centered Folio */
  .running-footer {
    border-top: 0.8px solid rgba(${themeRgbStr}, 0.35);
    padding-top: 2.5mm;
    margin-top: 5mm;
    text-align: center;
    font-size: 9pt;
    color: ${themeHex};
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* Page Content Container */
  .page-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* Colored Chapter Banner Box */
  .heading-banner {
    background-color: ${themeHex};
    color: #ffffff;
    border-radius: 2.5mm;
    padding: 3.5mm 5mm;
    text-align: center;
    margin-bottom: 6mm;
    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
  }
  .heading-banner .banner-super {
    font-size: 9.5pt;
    font-weight: 700;
    letter-spacing: 1px;
    opacity: 0.9;
    margin-bottom: 1mm;
  }
  .heading-banner .banner-title {
    font-size: 15pt;
    font-weight: 700;
    line-height: 1.35;
  }
  .heading-banner .banner-sub {
    font-size: 9.5pt;
    opacity: 0.85;
    margin-top: 1.5mm;
  }

  /* Headings */
  h1.book-title {
    font-size: 23pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    margin: 3mm 0 2mm 0;
    text-align: center;
  }
  .book-subtitle {
    font-size: 12pt;
    color: #64748b;
    text-align: center;
    margin-bottom: 5mm;
    font-style: italic;
  }
  .gold-divider {
    width: 36mm;
    height: 1px;
    background-color: #c8a96b;
    margin: 4mm auto;
  }
  .author-attribution {
    font-size: 13pt;
    font-weight: 700;
    color: ${themeHex};
    text-align: center;
    margin-top: 4mm;
  }

  /* Body Paragraphs */
  p.body-p {
    text-align: justify;
    text-justify: inter-word;
    margin-top: 0;
    margin-bottom: 3.5mm;
    line-height: 1.85;
  }
  ${isRtl ? `
  p.body-p {
    text-indent: 4mm;
  }
  ` : ''}

  /* Lists */
  ul, ol {
    margin-top: 2mm;
    margin-bottom: 4mm;
    padding-inline-start: 6mm;
  }
  li {
    margin-bottom: 1.5mm;
    text-align: justify;
  }

  /* Pull Quote */
  blockquote.pull-quote {
    border-inline-start: 3px solid ${themeHex};
    background-color: rgba(${themeRgbStr}, 0.05);
    padding: 3mm 4mm;
    margin: 4mm 0;
    font-style: italic;
    border-radius: 1mm;
  }

  /* Section Headings */
  h2.section-h2 {
    font-size: 13pt;
    color: #0f172a;
    margin-top: 5mm;
    margin-bottom: 2.5mm;
    font-weight: 700;
  }
  h3.section-h3 {
    font-size: 11pt;
    color: #334155;
    margin-top: 4mm;
    margin-bottom: 2mm;
    font-weight: 600;
  }

  /* Artwork */
  .cover-artwork-container {
    text-align: center;
    margin: 2mm 0 4mm 0;
  }
  .cover-artwork-img {
    max-width: 55mm;
    max-height: 70mm;
    object-fit: contain;
    border-radius: 2mm;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }
  .chapter-ill-container {
    text-align: center;
    margin: 3mm 0 4mm 0;
  }
  .chapter-ill-img {
    max-width: 100%;
    max-height: 55mm;
    object-fit: contain;
    border-radius: 1.5mm;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  .chapter-ill-caption {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 1.5mm;
    text-align: center;
  }

  /* Author Photo */
  .author-photo-container {
    text-align: center;
    margin-bottom: 4mm;
  }
  .author-photo-img {
    width: 32mm;
    height: 32mm;
    border-radius: 50%;
    object-fit: cover;
    object-position: center 15%;
    border: 2px solid ${themeHex};
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  /* Table of Contents */
  .toc-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 3.5mm;
    font-size: 10.5pt;
  }
  .toc-title {
    font-weight: 600;
    color: #1e293b;
  }
  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #94a3b8;
    margin: 0 3mm;
  }
  .toc-page-num {
    font-weight: 700;
    color: ${themeHex};
    font-feature-settings: "tnum";
  }

  /* Copyright Page */
  .copyright-content {
    font-size: 9pt;
    color: #64748b;
    line-height: 1.7;
    margin-top: auto;
    margin-bottom: 10mm;
  }
  .copyright-content p {
    margin: 2mm 0;
  }
</style>
</head>
<body>

  <!-- ========================================== -->
  <!-- 1. COVER / TITLE PAGE                      -->
  <!-- ========================================== -->
  <div class="book-page">
    <div class="page-border-frame"></div>
    <div class="page-body" style="justify-content: center; text-align: center;">
      ${cover?.coverArtworkUrl ? `
        <div class="cover-artwork-container">
          <img src="${cover.coverArtworkUrl}" alt="Cover Artwork" class="cover-artwork-img" />
        </div>
      ` : ''}

      <h1 class="book-title">${escapeHtml(book.title)}</h1>
      ${book.subtitle ? `<div class="book-subtitle">${escapeHtml(book.subtitle)}</div>` : ''}

      <div class="gold-divider"></div>

      <div class="author-attribution">
        ${isRtl ? `تأليف: ${escapeHtml(book.authorName || 'المؤلف')}` : `By ${escapeHtml(book.authorName || 'Author')}`}
      </div>
    </div>

    <div style="text-align: center; font-size: 8.5pt; color: #94a3b8; padding-bottom: 2mm;">
      ${isRtl ? 'منشورات بوك كرافت BookCraft AI — استوديو النشر الذكي' : 'Published by BookCraft AI — Editorial Intelligence'}
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 2. COPYRIGHT PAGE                          -->
  <!-- ========================================== -->
  <div class="book-page">
    <div class="page-border-frame"></div>
    <div class="page-body">
      <div style="flex: 1;"></div>
      <div class="copyright-content">
        <p><strong>${isRtl ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} للمؤلف ${escapeHtml(book.authorName || '')}` : `Copyright © ${new Date().getFullYear()} by ${escapeHtml(book.authorName || 'Author')}. All rights reserved.`}</strong></p>
        <p>${isRtl ? 'لا يجوز نسخ أو توزيع أو إعادة نشر أي جزء من هذا الكتاب دون إذن مسبق.' : 'No part of this publication may be reproduced without prior written permission.'}</p>
        <div style="height: 3mm;"></div>
        <p>${isRtl ? `التصنيف: ${escapeHtml(book.category || 'عام')}` : `Category: ${escapeHtml(book.category || 'General')}`}</p>
        <p>${isRtl ? `النظام الطباعي: ${escapeHtml(book.designFamily || 'Modern Editorial')}` : `Design Family: ${escapeHtml(book.designFamily || 'Modern Editorial')}`}</p>
        <p>${isRtl ? `المقاس: ${book.trimSize.toUpperCase()} (طبعة تجارية)` : `Trim Size: ${book.trimSize.toUpperCase()}`}</p>
        <p><strong>${cover?.isbn ? `ISBN: ${cover.isbn}` : 'ISBN: 978-1-954321-00-8'}</strong></p>
        <div style="height: 3mm;"></div>
        <p>${isRtl ? 'تم التحرير والتنسيق والإنتاج عبر منصة بوك كرافت BookCraft AI للنشر.' : 'Produced with BookCraft AI — Editorial Intelligence & Publishing Studio.'}</p>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 3. TABLE OF CONTENTS                       -->
  <!-- ========================================== -->
  <div class="book-page">
    <div class="page-border-frame"></div>
    
    <div class="running-header">
      <span>${escapeHtml(book.title.slice(0, 30))}</span>
      <span>${isRtl ? 'فهرس المحتويات' : 'Table of Contents'}</span>
    </div>

    <div class="page-body">
      <div class="heading-banner">
        <div class="banner-title">${isRtl ? 'فهرس المحتويات' : 'Table of Contents'}</div>
      </div>

      <div style="margin-top: 4mm;">
        ${tocEntries.map((entry) => `
          <div class="toc-row">
            <span class="toc-title">${escapeHtml(entry.title)}</span>
            <span class="toc-dots"></span>
            <span class="toc-page-num">${entry.page}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="running-footer">
      — ${isRtl ? '٣' : '3'} —
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 3.5 INTRODUCTION / PREFACE (If present)    -->
  <!-- ========================================== -->
  ${book.description && book.description.trim().length > 15 ? `
    <div class="book-page">
      <div class="page-border-frame"></div>

      <div class="running-header">
        <span>${escapeHtml(book.title.slice(0, 30))}</span>
        <span>${isRtl ? 'مقدمة الكتاب' : 'Introduction'}</span>
      </div>

      <div class="page-body">
        <div class="heading-banner">
          <div class="banner-title">${isRtl ? 'مقدمة الكتاب' : 'Introduction'}</div>
        </div>

        <div>
          ${formatMarkdownToHtml(book.description, isRtl)}
        </div>
      </div>

      <div class="running-footer">
        — ${isRtl ? '٤' : '4'} —
      </div>
    </div>
  ` : ''}

  <!-- ========================================== -->
  <!-- 4. CHAPTER PAGES                           -->
  <!-- ========================================== -->
  ${chapters.map((ch, idx) => {
    const chapterPageNum = baseChapterPage + idx;
    const matchingIll = illustrations.find(
      (i) => (i.chapterNumber === ch.chapterNumber || i.chapterId === ch.id || idx === 0) && i.imageUrl
    );
    const content = ch.userEditedContent || ch.processedContent || ch.originalContent || '';

    // Check if chapter contains a separate conclusion section
    const hasConclusion = /(خاتمة الكتاب|الخاتمة|خاتمة|Conclusion|Epilogue|خـاتـمـة)/i.test(content);
    let mainChapterText = content;
    let conclusionText = '';

    if (hasConclusion) {
      const match = content.match(/^(.*?)(?:\n\s*|\n)(خاتمة الكتاب|الخاتمة|خاتمة|Conclusion|Epilogue|خـاتـمـة)[\s:：]*(.*)$/is);
      if (match) {
        mainChapterText = match[1];
        conclusionText = match[3];
      }
    }

    return `
      <!-- Chapter ${idx + 1} Main Page -->
      <div class="book-page">
        <div class="page-border-frame"></div>

        <div class="running-header">
          <span>${escapeHtml(book.title.slice(0, 25))}</span>
          <span>${isRtl ? `الفصل ${idx + 1}` : `Chapter ${idx + 1}`}</span>
        </div>

        <div class="page-body">
          <div class="heading-banner">
            <div class="banner-super">${isRtl ? `الفصل ${idx + 1}` : `CHAPTER ${idx + 1}`}</div>
            <div class="banner-title">${escapeHtml(ch.title)}</div>
            ${ch.subtitle ? `<div class="banner-sub">${escapeHtml(ch.subtitle)}</div>` : ''}
          </div>

          ${matchingIll?.imageUrl ? `
            <div class="chapter-ill-container">
              <img src="${matchingIll.imageUrl}" alt="${escapeHtml(matchingIll.caption || 'Illustration')}" class="chapter-ill-img" />
              ${matchingIll.caption ? `
                <div class="chapter-ill-caption">${isRtl ? `الشكل (${idx + 1}): ${escapeHtml(matchingIll.caption)}` : `Figure ${idx + 1}: ${escapeHtml(matchingIll.caption)}`}</div>
              ` : ''}
            </div>
          ` : ''}

          <div>
            ${formatMarkdownToHtml(mainChapterText, isRtl)}
          </div>
        </div>

        <div class="running-footer">
          — ${chapterPageNum} —
        </div>
      </div>

      <!-- Separate Conclusion Page (if present in chapter) -->
      ${conclusionText && conclusionText.trim().length > 10 ? `
        <div class="book-page">
          <div class="page-border-frame"></div>

          <div class="running-header">
            <span>${escapeHtml(book.title.slice(0, 25))}</span>
            <span>${isRtl ? 'خاتمة الكتاب' : 'Conclusion'}</span>
          </div>

          <div class="page-body">
            <div class="heading-banner">
              <div class="banner-title">${isRtl ? 'خاتمة الكتاب' : 'Conclusion'}</div>
            </div>

            <div>
              ${formatMarkdownToHtml(conclusionText, isRtl)}
            </div>
          </div>

          <div class="running-footer">
            — ${chapterPageNum + 1} —
          </div>
        </div>
      ` : ''}
    `;
  }).join('\n')}

  <!-- ========================================== -->
  <!-- 5. ABOUT THE AUTHOR (نبذة عن المؤلف)       -->
  <!-- ========================================== -->
  <div class="book-page">
    <div class="page-border-frame"></div>

    <div class="running-header">
      <span>${escapeHtml(book.title.slice(0, 25))}</span>
      <span>${isRtl ? 'نبذة عن المؤلف' : 'About the Author'}</span>
    </div>

    <div class="page-body">
      <div class="heading-banner">
        <div class="banner-title">${isRtl ? 'نبذة عن المؤلف' : 'About the Author'}</div>
      </div>

      ${cover?.authorPhotoUrl ? `
        <div class="author-photo-container">
          <img src="${cover.authorPhotoUrl}" alt="${escapeHtml(book.authorName || 'Author')}" class="author-photo-img" />
        </div>
      ` : ''}

      <div style="margin-top: 2mm;">
        ${formatMarkdownToHtml(
          cover?.authorBio || (isRtl ? `يعد ${book.authorName || 'المؤلف'} من المتخصصين والباحثين المرموقين في مجاله.` : `${book.authorName || 'The author'} is a dedicated subject-matter specialist.`),
          isRtl
        )}
      </div>
    </div>

    <div class="running-footer">
      — ${baseChapterPage + chapters.length + 1} —
    </div>
  </div>

</body>
</html>`;

  return { html, widthMm, heightMm };
}

// Shared browser instance for low latency and high concurrency
let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }
  sharedBrowser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-crash-reporter',
      '--disable-breakpad',
      '--no-first-run',
    ],
  });
  return sharedBrowser;
}

/**
 * Renders a full BookProject to a publication-grade PDF buffer via Chromium.
 */
export async function renderBookToPdf(
  book: BookProject,
  chapters: Chapter[],
  cover: CoverConfig | null,
  illustrations: IllustrationItem[] = [],
  mode: 'print' | 'digital' = 'print'
): Promise<Buffer> {
  const { html, widthMm, heightMm } = buildBookHtml(book, chapters, cover, illustrations, mode);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport matching the page aspect ratio
    await page.setViewport({
      width: Math.round(widthMm * 3.7795),
      height: Math.round(heightMm * 3.7795),
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      width: `${widthMm}mm`,
      height: `${heightMm}mm`,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

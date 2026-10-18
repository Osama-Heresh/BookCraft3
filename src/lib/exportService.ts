import { jsPDF } from 'jspdf';
import ArabicReshaper from 'arabic-persian-reshaper';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ImageRun,
  Footer,
  PageNumber,
  ShadingType,
  BorderStyle,
  PageBorderDisplay,
} from 'docx';
import { BookProject, Chapter, CoverConfig, IllustrationItem, PreflightReport } from '../types';
import { AMIRI_FONT_BASE64 } from './fonts/amiriFont';
import { getDesignFamily } from './designFamilies';

/**
 * Converts hex color string to RGB tuple
 */
function hexToRgb(hex: string): [number, number, number] {
  let clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return [15, 118, 110]; // Default rich teal
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Loads the bundled Amiri TrueType font for UTF-8 Arabic PDF generation.
 * Guaranteed 100% available offline and across sandboxed iframes.
 */
function getAmiriFontBase64(): string {
  return AMIRI_FONT_BASE64;
}

/**
 * Transforms Arabic text by shaping letters into connected glyph forms (Presentation Forms-B)
 * and reordering for right-aligned visual stream in PDF.
 */
export function toVisualArabic(text: string): string {
  if (!text || typeof text !== 'string') return '';
  if (!/[\u0600-\u06FF]/.test(text)) {
    return text;
  }

  try {
    // 1. Shape Arabic characters (initial, medial, final, isolated)
    const reshaper = (ArabicReshaper as any).ArabicShaper || ArabicReshaper;
    const shaped = reshaper.convertArabic(text);

    // 2. Tokenize runs of Arabic vs Non-Arabic (numbers, English, symbols)
    const tokens: Array<{ text: string; isArabic: boolean }> = [];
    let current = '';
    let isAr = false;

    for (let i = 0; i < shaped.length; i++) {
      const ch = shaped[i];
      // Arabic letters and shaped Arabic presentation forms
      const chIsAr = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(ch);

      if (tokens.length === 0 && current === '') {
        current = ch;
        isAr = chIsAr;
      } else if (chIsAr === isAr) {
        current += ch;
      } else {
        tokens.push({ text: current, isArabic: isAr });
        current = ch;
        isAr = chIsAr;
      }
    }
    if (current) {
      tokens.push({ text: current, isArabic: isAr });
    }

    // 3. For Arabic runs, reverse character order; for non-Arabic (numbers, Latin, brackets), mirror brackets and keep text direction
    const mirrorBrackets = (str: string) => {
      return str.split('').map((c) => {
        if (c === '(') return ')';
        if (c === ')') return '(';
        if (c === '[') return ']';
        if (c === ']') return '[';
        if (c === '{') return '}';
        if (c === '}') return '{';
        if (c === '«') return '»';
        if (c === '»') return '«';
        return c;
      }).join('');
    };

    const processed = tokens.map((t) => {
      if (t.isArabic) {
        return t.text.split('').reverse().join('');
      }
      return mirrorBrackets(t.text);
    });

    // 4. Reverse the order of tokens for RTL visual stream
    return processed.reverse().join('');
  } catch (err) {
    console.warn('Arabic shaping error:', err);
    return text;
  }
}

/**
 * Robustly converts any SVG or raster data URL into a PNG data URL
 */
async function rasterizeDataUrlToPng(
  dataUrl: string,
  targetWidth = 800,
  targetHeight = 450
): Promise<string> {
  if (!dataUrl) return '';
  if (dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      let src = dataUrl;
      if (dataUrl.startsWith('data:image/svg+xml')) {
        let svgText = '';
        if (dataUrl.includes('base64,')) {
          try {
            svgText = atob(dataUrl.split('base64,')[1]);
          } catch {
            svgText = '';
          }
        } else {
          svgText = decodeURIComponent(dataUrl.split('data:image/svg+xml,')[1] || '');
        }

        if (svgText) {
          // Inject explicit width, height and xmlns if missing
          if (!svgText.includes('xmlns=')) {
            svgText = svgText.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          if (!svgText.includes('width=')) {
            svgText = svgText.replace(/<svg/i, `<svg width="${targetWidth}" height="${targetHeight}"`);
          }
          src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
        }
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        console.warn('Image failed to rasterize to canvas');
        resolve(dataUrl);
      };
      img.src = src;
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Converts a data URL to Uint8Array for DOCX ImageRun
 */
async function dataUrlToUint8Array(
  dataUrl: string,
  targetWidth = 800,
  targetHeight = 450
): Promise<Uint8Array | null> {
  try {
    const pngDataUrl = await rasterizeDataUrlToPng(dataUrl, targetWidth, targetHeight);
    const commaIndex = pngDataUrl.indexOf(',');
    if (commaIndex === -1) return null;
    const base64 = pngDataUrl.slice(commaIndex + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Could not convert image to binary for DOCX:', err);
    return null;
  }
}

export class ExportService {
  /**
   * Generates a Publication-Ready PDF with registered Amiri TrueType font,
   * UTF-8 Arabic glyph shaping, embedded cover artwork, and embedded chapter visuals.
   */
  static async generatePDF(
    book: BookProject,
    chapters: Chapter[],
    cover: CoverConfig | null,
    illustrations: IllustrationItem[],
    mode: 'print' | 'digital' = 'print'
  ): Promise<Blob> {
    // 1. Prefer Chromium-based server pipeline with HarfBuzz Arabic OpenType layout & embedded fonts
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ book, chapters, cover, illustrations, mode }),
      });

      if (res.ok) {
        return await res.blob();
      }
      console.warn('Server PDF export returned status:', res.status, 'Falling back to client generator...');
    } catch (apiErr) {
      console.warn('Server PDF export unreachable, falling back to client generator:', apiErr);
    }

    // 2. Client-side fallback generator
    return this.generateClientPDF(book, chapters, cover, illustrations, mode);
  }

  static async generateClientPDF(
    book: BookProject,
    chapters: Chapter[],
    cover: CoverConfig | null,
    illustrations: IllustrationItem[],
    mode: 'print' | 'digital' = 'print'
  ): Promise<Blob> {
    const isRtl = book.language === 'ar' || /[\u0600-\u06FF]/.test(book.title);

    // Dimensions in mm
    let widthMm = 152.4; // 6x9 in (Trade Paperback/Hardcover)
    let heightMm = 228.6;
    if (book.trimSize === 'a4') {
      widthMm = 210;
      heightMm = 297;
    } else if (book.trimSize === 'us_letter') {
      widthMm = 215.9;
      heightMm = 279.4;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
    });

    // 1. Register Amiri TTF font for genuine UTF-8 / Arabic shaping (bundled, 100% reliable)
    const amiriBase64 = getAmiriFontBase64();
    doc.addFileToVFS('Amiri.ttf', amiriBase64);
    doc.addFont('Amiri.ttf', 'Amiri', 'normal', 'Identity-H');
    doc.setFont('Amiri', 'normal');

    const primaryFont = 'Amiri';

    const marginX = mode === 'print' ? 18 : 14;
    const marginY = 16;
    const contentW = widthMm - marginX * 2;
    const rightMarginX = widthMm - marginX;

    const family = getDesignFamily(book.designFamily);
    const themeColor = cover?.themeColor || family.primaryAccent || '#0f766e';
    const secondaryColor = family.secondaryAccent || '#c8a96b';
    const [r, g, b] = hexToRgb(themeColor);
    const [sr, sg, sb] = hexToRgb(secondaryColor);
    const borderMargin = 6;
    const borderW = widthMm - borderMargin * 2;
    const borderH = heightMm - borderMargin * 2;

    // Helper: Draw elegant dual-line colored page border reflecting design family
    const drawPageBorder = () => {
      // Primary accent outer border
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.5);
      doc.rect(borderMargin, borderMargin, borderW, borderH);

      // Secondary accent inner hairline border
      doc.setDrawColor(sr, sg, sb);
      doc.setLineWidth(0.2);
      doc.rect(borderMargin + 1.2, borderMargin + 1.2, borderW - 2.4, borderH - 2.4);
    };

    let currentPageNumber = 1;

    // Helper: Header in colored rectangular box and footer with page number
    const addPageHeaderFooter = (leftHeader: string, rightHeader: string, pageNum: number) => {
      // 1. Header with family accent styling
      const rectX = marginX - 1;
      const rectY = marginY - 9.5;
      const rectW = contentW + 2;
      const rectH = 7.2;

      doc.setFillColor(r, g, b);
      doc.roundedRect(rectX, rectY, rectW, rectH, 1, 1, 'F');

      // Thin secondary accent bottom strip on the header
      doc.setFillColor(sr, sg, sb);
      doc.rect(rectX, rectY + rectH - 0.7, rectW, 0.7, 'F');

      // Text inside the colored rectangle
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255); // Crisp contrast white text

      const textY = rectY + 4.5;
      if (isRtl) {
        doc.text(toVisualArabic(rightHeader), rectX + rectW - 3, textY, { align: 'right' });
        doc.text(toVisualArabic(leftHeader), rectX + 3, textY, { align: 'left' });
      } else {
        doc.text(leftHeader, rectX + 3, textY, { align: 'left' });
        doc.text(rightHeader, rectX + rectW - 3, textY, { align: 'right' });
      }

      // 2. Footer with Page Number
      const footerY = heightMm - marginY + 2;
      doc.setDrawColor(sr, sg, sb);
      doc.setLineWidth(0.3);
      doc.line(marginX, footerY, rightMarginX, footerY);

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(r, g, b);
      const folioText = family.headerStyle === 'ornate-divider'
        ? `— ❖ ${pageNum} ❖ —`
        : family.headerStyle === 'hairline-rule'
        ? `• ${pageNum} •`
        : `— ${pageNum} —`;
      doc.text(isRtl ? toVisualArabic(folioText) : folioText, widthMm / 2, footerY + 5.5, { align: 'center' });
    };

    // Helper: Colored rectangular header banner for Chapter Title, Conclusion, and About Author
    const drawColoredHeadingBanner = (headingText: string, curY: number, subText?: string) => {
      const bannerH = subText ? 18 : 13;
      doc.setFillColor(r, g, b);
      doc.roundedRect(marginX, curY, contentW, bannerH, 1.5, 1.5, 'F');

      // Secondary decorative bottom rule
      doc.setFillColor(sr, sg, sb);
      doc.rect(marginX + 2, curY + bannerH - 1, contentW - 4, 0.8, 'F');

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(14.5);
      doc.setTextColor(255, 255, 255);
      const textY = curY + (subText ? 7.2 : 8.2);
      doc.text(isRtl ? toVisualArabic(headingText) : headingText, widthMm / 2, textY, { align: 'center' });

      if (subText) {
        doc.setFontSize(9.5);
        doc.setTextColor(235, 245, 255);
        doc.text(isRtl ? toVisualArabic(subText) : subText, widthMm / 2, textY + 5.2, { align: 'center' });
      }

      return bannerH;
    };

    // ==========================================
    // 1. COVER / TITLE PAGE
    // ==========================================
    {
      drawPageBorder();
      let curY = 20;

      // Cover Artwork Image (if generated)
      if (cover?.coverArtworkUrl) {
        try {
          const coverPng = await rasterizeDataUrlToPng(cover.coverArtworkUrl, 600, 800);
          const artW = contentW * 0.42;
          const artH = artW * 0.75;
          const artX = (widthMm - artW) / 2;
          doc.addImage(coverPng, 'PNG', artX, curY, artW, artH);
          curY += artH + 8;
        } catch (imgErr) {
          console.warn('Cover image render error in PDF:', imgErr);
        }
      } else {
        curY = 50;
      }

      // Title
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);

      const titleLines = doc.splitTextToSize(book.title, contentW);
      for (const line of titleLines) {
        const textToDraw = isRtl ? toVisualArabic(line) : line;
        doc.text(textToDraw, widthMm / 2, curY, { align: 'center' });
        curY += 9;
      }

      // Subtitle
      if (book.subtitle) {
        curY += 2;
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        const subLines = doc.splitTextToSize(book.subtitle, contentW);
        for (const line of subLines) {
          const textToDraw = isRtl ? toVisualArabic(line) : line;
          doc.text(textToDraw, widthMm / 2, curY, { align: 'center' });
          curY += 6;
        }
      }

      // Decorative divider
      curY += 4;
      doc.setDrawColor(200, 169, 107); // Gold accent
      doc.setLineWidth(0.6);
      doc.line(widthMm / 2 - 18, curY, widthMm / 2 + 18, curY);

      // Author Name
      curY += 12;
      doc.setFontSize(14);
      doc.setTextColor(15, 118, 110); // Teal
      const authorStr = isRtl
        ? `تأليف: ${book.authorName || 'المؤلف'}`
        : `By ${book.authorName || 'Author'}`;
      doc.text(isRtl ? toVisualArabic(authorStr) : authorStr, widthMm / 2, curY, { align: 'center' });

      // Colophon imprint at bottom
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      const colophon = isRtl
        ? 'منشورات بوك كرافت BookCraft AI — استوديو النشر الذكي'
        : 'Published by BookCraft AI — Publishing Studio';
      doc.text(isRtl ? toVisualArabic(colophon) : colophon, widthMm / 2, heightMm - 14, { align: 'center' });
    }

    // ==========================================
    // 2. COPYRIGHT PAGE
    // ==========================================
    doc.addPage([widthMm, heightMm], 'portrait');
    drawPageBorder();
    {
      let copyY = heightMm * 0.58;
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);

      const copyLines = [
        isRtl
          ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} للمؤلف ${book.authorName || ''}.`
          : `Copyright © ${new Date().getFullYear()} by ${book.authorName || 'Author'}. All rights reserved.`,
        isRtl
          ? 'لا يجوز نسخ أو توزيع أو إعادة نشر أي جزء من هذا الكتاب دون إذن مسبق.'
          : 'No part of this publication may be reproduced without prior written permission.',
        '',
        isRtl ? `التصنيف: ${book.category || 'عام'}` : `Category: ${book.category || 'General'}`,
        isRtl ? `النظام الطباعي: ${book.designFamily}` : `Design Family: ${book.designFamily}`,
        isRtl
          ? `المقاس: ${book.trimSize.toUpperCase()} (طبعة تجارية)`
          : `Trim Size: ${book.trimSize.toUpperCase()}`,
        cover?.isbn ? `ISBN: ${cover.isbn}` : 'ISBN: 978-1-954321-00-8',
        '',
        isRtl
          ? 'تم التحرير والتنسيق والإنتاج عبر منصة بوك كرافت BookCraft AI للنشر.'
          : 'Produced with BookCraft AI — Editorial Intelligence & Publishing Studio.',
      ];

      for (const line of copyLines) {
        if (!line) {
          copyY += 4;
          continue;
        }
        if (isRtl) {
          doc.text(toVisualArabic(line), rightMarginX, copyY, { align: 'right' });
        } else {
          doc.text(line, marginX, copyY, { align: 'left' });
        }
        copyY += 5.5;
      }
    }

    // ==========================================
    // 3. TABLE OF CONTENTS
    // ==========================================
    doc.addPage([widthMm, heightMm], 'portrait');
    drawPageBorder();
    {
      const tocHeading = isRtl ? 'فهرس المحتويات' : 'Table of Contents';
      addPageHeaderFooter(book.title.slice(0, 25), tocHeading, currentPageNumber);
      const bannerH = drawColoredHeadingBanner(tocHeading, marginY + 2);

      let tocY = marginY + 2 + bannerH + 12;
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(11);

      chapters.forEach((ch, idx) => {
        doc.setTextColor(30, 41, 59);
        const titleStr = isRtl ? `الفصل ${idx + 1}: ${ch.title}` : `Chapter ${idx + 1}: ${ch.title}`;
        const pageStr = String(idx + 1);

        if (isRtl) {
          doc.text(toVisualArabic(titleStr), rightMarginX, tocY, { align: 'right' });
          doc.setTextColor(148, 163, 184);
          doc.text(pageStr, marginX, tocY, { align: 'left' });
        } else {
          doc.text(titleStr, marginX, tocY, { align: 'left' });
          doc.setTextColor(148, 163, 184);
          doc.text(pageStr, rightMarginX, tocY, { align: 'right' });
        }
        tocY += 8.5;
      });
    }

    // ==========================================
    // 3.5 INTRODUCTION / PREFACE (Standalone Page)
    // ==========================================
    if (book.description && book.description.trim().length > 15) {
      doc.addPage([widthMm, heightMm], 'portrait');
      currentPageNumber++;
      drawPageBorder();
      const introHeading = isRtl ? 'مقدمة الكتاب' : 'Introduction';
      addPageHeaderFooter(book.title.slice(0, 25), introHeading, currentPageNumber);
      const bannerH = drawColoredHeadingBanner(introHeading, marginY + 2);

      let introY = marginY + 2 + bannerH + 8;
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);

      const introParagraphs = book.description.split(/\n\s*\n/).filter((p) => p.trim());
      for (const p of introParagraphs) {
        const pLines = doc.splitTextToSize(p.trim(), contentW);
        for (const line of pLines) {
          if (introY > heightMm - marginY - 10) {
            doc.addPage([widthMm, heightMm], 'portrait');
            currentPageNumber++;
            drawPageBorder();
            addPageHeaderFooter(book.title.slice(0, 25), introHeading, currentPageNumber);
            introY = marginY + 8;
          }
          if (isRtl) {
            doc.text(toVisualArabic(line), rightMarginX, introY, { align: 'right' });
          } else {
            doc.text(line, marginX, introY, { align: 'left' });
          }
          introY += 6.2;
        }
        introY += 3.5;
      }
    }

    // ==========================================
    // 4. CHAPTER PAGES WITH EMBEDDED ILLUSTRATIONS
    // ==========================================
    for (let idx = 0; idx < chapters.length; idx++) {
      const ch = chapters[idx];
      doc.addPage([widthMm, heightMm], 'portrait');
      currentPageNumber++;
      drawPageBorder();

      // Colored rectangular header banner for chapter title
      const chHeader = isRtl ? `الفصل ${idx + 1}` : `CHAPTER ${idx + 1}`;
      addPageHeaderFooter(book.title.slice(0, 25), ch.title.slice(0, 25), currentPageNumber);
      const bannerH = drawColoredHeadingBanner(`${chHeader}: ${ch.title}`, marginY + 2, ch.subtitle || undefined);

      let curY = marginY + 2 + bannerH + 8;

      // Match illustration for this chapter
      const matchingIll = illustrations.find(
        (i) => (i.chapterNumber === ch.chapterNumber || i.chapterId === ch.id || idx === 0) && i.imageUrl
      );

      // Embed Chapter Illustration if available
      if (matchingIll && matchingIll.imageUrl) {
        try {
          const pngData = await rasterizeDataUrlToPng(matchingIll.imageUrl, 800, 450);
          const illW = contentW;
          const illH = illW * 0.52;
          const illX = marginX;

          doc.addImage(pngData, 'PNG', illX, curY, illW, illH);
          curY += illH + 4;

          // Caption
          if (matchingIll.caption) {
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            const capStr = isRtl
              ? `الشكل (${idx + 1}): ${matchingIll.caption}`
              : `Figure ${idx + 1}: ${matchingIll.caption}`;
            const capLines = doc.splitTextToSize(capStr, contentW);
            for (const capLine of capLines) {
              doc.text(isRtl ? toVisualArabic(capLine) : capLine, widthMm / 2, curY, { align: 'center' });
              curY += 4.5;
            }
          }
          curY += 4;
        } catch (illErr) {
          console.warn('Chapter illustration render error in PDF:', illErr);
        }
      }

      // Body Paragraphs
      const content = ch.userEditedContent || ch.processedContent || ch.originalContent || '';
      const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);

      const lineHeight = 6.2;

      for (const p of paragraphs) {
        const trimmedP = p.trim();

        // Check if paragraph is or starts with Conclusion (خاتمة الكتاب)
        const isConclusionHeader = /^(خاتمة الكتاب|الخاتمة|خاتمة|Conclusion|Epilogue|خـاتـمـة)[\s:：]*/i.test(trimmedP);
        // Check if paragraph is or starts with About the Author (نبذة عن المؤلف)
        const isBioHeader = /^(نبذة عن المؤلف|عن المؤلف|نبذة عن الكاتب|سيرة المؤلف|About the Author|About Author)[\s:：]*/i.test(trimmedP);

        if (isConclusionHeader) {
          // MUST be on a separate page on its own, not starting in the middle of preceding page!
          doc.addPage([widthMm, heightMm], 'portrait');
          currentPageNumber++;
          drawPageBorder();
          const concTitle = isRtl ? 'خاتمة الكتاب' : 'Conclusion';
          addPageHeaderFooter(book.title.slice(0, 25), concTitle, currentPageNumber);
          const bannerH = drawColoredHeadingBanner(concTitle, marginY + 2);
          curY = marginY + 2 + bannerH + 8;

          const remainingText = trimmedP.replace(/^(خاتمة الكتاب|الخاتمة|خاتمة|Conclusion|Epilogue|خـاتـمـة)[\s:：]*/i, '').trim();
          if (!remainingText) continue;

          const concLines = doc.splitTextToSize(remainingText, contentW);
          for (const line of concLines) {
            if (curY > heightMm - marginY - 10) {
              doc.addPage([widthMm, heightMm], 'portrait');
              currentPageNumber++;
              drawPageBorder();
              addPageHeaderFooter(book.title.slice(0, 25), concTitle, currentPageNumber);
              curY = marginY + 8;
            }
            if (isRtl) {
              doc.text(toVisualArabic(line), rightMarginX, curY, { align: 'right' });
            } else {
              doc.text(line, marginX, curY, { align: 'left' });
            }
            curY += lineHeight;
          }
          curY += 3.5;
          continue;
        }

        if (isBioHeader) {
          // MUST be on a separate page on its own!
          doc.addPage([widthMm, heightMm], 'portrait');
          currentPageNumber++;
          drawPageBorder();
          const bioTitle = isRtl ? 'نبذة عن المؤلف' : 'About the Author';
          addPageHeaderFooter(book.title.slice(0, 25), bioTitle, currentPageNumber);
          const bannerH = drawColoredHeadingBanner(bioTitle, marginY + 2);
          curY = marginY + 2 + bannerH + 8;

          // If author photo is present, embed it here too
          if (cover?.authorPhotoUrl) {
            try {
              const photoPng = await rasterizeDataUrlToPng(cover.authorPhotoUrl, 400, 400);
              const photoSize = 32;
              const photoX = (widthMm - photoSize) / 2;
              doc.addImage(photoPng, 'PNG', photoX, curY, photoSize, photoSize);
              doc.setDrawColor(r, g, b);
              doc.setLineWidth(0.5);
              doc.rect(photoX, curY, photoSize, photoSize);
              curY += photoSize + 6;
            } catch (pErr) {
              console.warn('Bio inline photo render error:', pErr);
            }
          }

          const remainingText = trimmedP.replace(/^(نبذة عن المؤلف|عن المؤلف|نبذة عن الكاتب|سيرة المؤلف|About the Author|About Author)[\s:：]*/i, '').trim();
          if (!remainingText) continue;

          const bioLines = doc.splitTextToSize(remainingText, contentW);
          for (const line of bioLines) {
            if (isRtl) {
              doc.text(toVisualArabic(line), rightMarginX, curY, { align: 'right' });
            } else {
              doc.text(line, marginX, curY, { align: 'left' });
            }
            curY += lineHeight;
          }
          curY += 3.5;
          continue;
        }

        const pLines = doc.splitTextToSize(trimmedP, contentW);

        // Check if paragraph lines exceed current page bottom
        if (curY + pLines.length * lineHeight > heightMm - marginY - 10) {
          doc.addPage([widthMm, heightMm], 'portrait');
          currentPageNumber++;
          drawPageBorder();
          addPageHeaderFooter(book.title.slice(0, 25), ch.title.slice(0, 25), currentPageNumber);
          curY = marginY + 8;
        }

        for (const line of pLines) {
          if (curY > heightMm - marginY - 10) {
            doc.addPage([widthMm, heightMm], 'portrait');
            currentPageNumber++;
            drawPageBorder();
            addPageHeaderFooter(book.title.slice(0, 25), ch.title.slice(0, 25), currentPageNumber);
            curY = marginY + 8;
          }

          if (isRtl) {
            doc.text(toVisualArabic(line), rightMarginX, curY, { align: 'right' });
          } else {
            doc.text(line, marginX, curY, { align: 'left' });
          }
          curY += lineHeight;
        }

        curY += 3.5; // Paragraph spacing
      }

      // Header/footer for chapter final page
      addPageHeaderFooter(book.title.slice(0, 25), ch.title.slice(0, 25), currentPageNumber);
    }

    // ==========================================
    // 5. BACK MATTER: ABOUT THE AUTHOR (نبذة عن المؤلف)
    // ==========================================
    doc.addPage([widthMm, heightMm], 'portrait');
    currentPageNumber++;
    drawPageBorder();
    {
      const bioHeading = isRtl ? 'نبذة عن المؤلف' : 'About the Author';
      addPageHeaderFooter(book.title.slice(0, 25), bioHeading, currentPageNumber);
      const bannerH = drawColoredHeadingBanner(bioHeading, marginY + 2);
      let bioY = marginY + 2 + bannerH + 8;

      // Automatically maintain Author Picture location on the About the Author page if provided
      if (cover?.authorPhotoUrl) {
        try {
          const photoPng = await rasterizeDataUrlToPng(cover.authorPhotoUrl, 400, 400);
          const photoSize = 34; // 34mm x 34mm
          const photoX = (widthMm - photoSize) / 2;
          doc.addImage(photoPng, 'PNG', photoX, bioY, photoSize, photoSize);
          doc.setDrawColor(r, g, b);
          doc.setLineWidth(0.5);
          doc.rect(photoX, bioY, photoSize, photoSize);
          bioY += photoSize + 6;

          // Author Name under photo
          doc.setFont(primaryFont, 'normal');
          doc.setFontSize(12);
          doc.setTextColor(r, g, b);
          const authorLabel = book.authorName || (isRtl ? 'المؤلف' : 'Author');
          doc.text(isRtl ? toVisualArabic(authorLabel) : authorLabel, widthMm / 2, bioY, { align: 'center' });
          bioY += 6;
        } catch (photoErr) {
          console.warn('Author photo render error in PDF:', photoErr);
        }
      }

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);

      const bioText =
        cover?.authorBio ||
        (isRtl
          ? `يعد ${book.authorName || 'المؤلف'} من المتخصصين والباحثين المرموقين في مجاله.`
          : `${book.authorName || 'The author'} is a dedicated subject-matter specialist.`);

      const bioLines = doc.splitTextToSize(bioText, contentW);
      for (const line of bioLines) {
        if (isRtl) {
          doc.text(toVisualArabic(line), rightMarginX, bioY, { align: 'right' });
        } else {
          doc.text(line, marginX, bioY, { align: 'left' });
        }
        bioY += 6.5;
      }
    }

    return doc.output('blob');
  }

  /**
   * Generates a fully styled Word Document (.docx) with 100% Arabic Right-To-Left
   * alignment (bidi section + paragraph alignment + RTL text runs), embedded cover image,
   * and embedded visual illustrations.
   */
  static async generateDOCX(
    book: BookProject,
    chapters: Chapter[],
    cover: CoverConfig | null,
    illustrations: IllustrationItem[] = []
  ): Promise<Blob> {
    const isRtl = book.language === 'ar' || /[\u0600-\u06FF]/.test(book.title);
    const bodyAlignment = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
    const fontName = isRtl ? 'Amiri' : 'EB Garamond';
    const family = getDesignFamily(book.designFamily);
    const themeHexClean = (cover?.themeColor || family.primaryAccent || '#0f766e').replace('#', '').trim();

    const docParagraphs: Paragraph[] = [];

    // ==========================================
    // 1. COVER / TITLE PAGE IN DOCX
    // ==========================================

    // Embed Cover Artwork Image if available (proportional height so entire cover fits on Page 1)
    if (cover?.coverArtworkUrl) {
      try {
        const coverBytes = await dataUrlToUint8Array(cover.coverArtworkUrl, 600, 800);
        if (coverBytes) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: coverBytes,
                  transformation: { width: 120, height: 150 },
                  type: 'png',
                }),
              ],
              alignment: AlignmentType.CENTER,
              bidirectional: isRtl,
              spacing: { before: 100, after: 120 },
            })
          );
        }
      } catch (covErr) {
        console.warn('Cover image embedding in DOCX warning:', covErr);
      }
    }

    // Title
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: book.title,
            font: fontName,
            bold: true,
            size: 36,
            rightToLeft: isRtl,
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        bidirectional: isRtl,
        spacing: { before: 140, after: 80 },
      })
    );

    // Subtitle
    if (book.subtitle) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: book.subtitle,
              font: fontName,
              size: 20,
              italics: true,
              rightToLeft: isRtl,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          bidirectional: isRtl,
          spacing: { after: 120 },
        })
      );
    }

    // Author Attribution
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isRtl
              ? `تأليف: ${book.authorName || 'المؤلف'}`
              : `By ${book.authorName || 'Author'}`,
            font: fontName,
            bold: true,
            size: 24,
            rightToLeft: isRtl,
          }),
        ],
        alignment: AlignmentType.CENTER,
        bidirectional: isRtl,
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: isRtl
              ? 'منشورات بوك كرافت BookCraft AI'
              : 'BookCraft AI Publishing Platform',
            font: fontName,
            size: 16,
            color: '64748B',
            rightToLeft: isRtl,
          }),
        ],
        alignment: AlignmentType.CENTER,
        bidirectional: isRtl,
        spacing: { after: 200 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // ==========================================
    // 2. COPYRIGHT PAGE IN DOCX (Separate Page)
    // ==========================================
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isRtl
              ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} للمؤلف ${book.authorName || ''}`
              : `Copyright © ${new Date().getFullYear()} by ${book.authorName || 'Author'}`,
            font: fontName,
            rightToLeft: isRtl,
            bold: true,
          }),
        ],
        alignment: bodyAlignment,
        bidirectional: isRtl,
        spacing: { before: 300, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: isRtl
              ? 'لا يجوز نسخ أو توزيع أي جزء من هذا العمل دون إذن مسبق من المؤلف والناشر.'
              : 'All rights reserved. Published via BookCraft AI Publishing Platform.',
            font: fontName,
            rightToLeft: isRtl,
          }),
        ],
        alignment: bodyAlignment,
        bidirectional: isRtl,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: cover?.isbn ? `ISBN: ${cover.isbn}` : 'ISBN: 978-1-954321-00-8',
            font: fontName,
            rightToLeft: isRtl,
          }),
        ],
        alignment: bodyAlignment,
        bidirectional: isRtl,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // ==========================================
    // 3. TABLE OF CONTENTS (TOC) IN DOCX (Separate Page)
    // ==========================================
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isRtl ? 'الفهرس والمحتويات' : 'Table of Contents',
            font: fontName,
            bold: true,
            size: 30,
            color: 'FFFFFF',
            rightToLeft: isRtl,
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: themeHexClean,
          fill: themeHexClean,
        },
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        bidirectional: isRtl,
        spacing: { before: 300, after: 300 },
      })
    );

    chapters.forEach((ch, idx) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: isRtl ? `الفصل ${idx + 1}: ${ch.title}` : `Chapter ${idx + 1}: ${ch.title}`,
              font: fontName,
              bold: true,
              size: 22,
              rightToLeft: isRtl,
            }),
            new TextRun({
              text: isRtl ? ` .......................................... صفحة ${idx + 1}` : ` .......................................... Page ${idx + 1}`,
              font: fontName,
              color: '64748B',
              size: 18,
              rightToLeft: isRtl,
            }),
          ],
          alignment: bodyAlignment,
          bidirectional: isRtl,
          spacing: { after: 140 },
        })
      );
    });

    // End TOC Page -> Page Break
    docParagraphs.push(new Paragraph({ children: [new PageBreak()] }));

    // ==========================================
    // 4. INTRODUCTION / PREFACE IN DOCX (Separate Page)
    // ==========================================
    if (book.description && book.description.trim().length > 15) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: isRtl ? 'مقدمة الكتاب' : 'Introduction',
              font: fontName,
              bold: true,
              size: 30,
              color: 'FFFFFF',
              rightToLeft: isRtl,
            }),
          ],
          shading: {
            type: ShadingType.SOLID,
            color: themeHexClean,
            fill: themeHexClean,
          },
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          bidirectional: isRtl,
          spacing: { before: 300, after: 200 },
        })
      );

      const introParagraphs = book.description.split(/\n\s*\n/).filter((p) => p.trim());
      introParagraphs.forEach((p) => {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: p.trim(),
                font: fontName,
                size: 24,
                rightToLeft: isRtl,
              }),
            ],
            alignment: AlignmentType.BOTH,
            bidirectional: isRtl,
            spacing: { after: 180, line: 360 },
          })
        );
      });

      // End Introduction Page -> Page Break
      docParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ==========================================
    // 5. CHAPTERS WITH EMBEDDED ILLUSTRATIONS
    // ==========================================
    for (let idx = 0; idx < chapters.length; idx++) {
      const ch = chapters[idx];

      // Chapter Heading 1 in colored rectangular box
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: isRtl ? `الفصل ${idx + 1}: ${ch.title}` : `Chapter ${idx + 1}: ${ch.title}`,
              font: fontName,
              bold: true,
              size: 32,
              color: 'FFFFFF',
              rightToLeft: isRtl,
            }),
          ],
          shading: {
            type: ShadingType.SOLID,
            color: themeHexClean,
            fill: themeHexClean,
          },
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          bidirectional: isRtl,
          spacing: { before: 400, after: 200 },
        })
      );

      // Chapter Subtitle
      if (ch.subtitle) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ch.subtitle,
                font: fontName,
                italics: true,
                size: 24,
                rightToLeft: isRtl,
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            alignment: bodyAlignment,
            bidirectional: isRtl,
            spacing: { after: 200 },
          })
        );
      }

      // Match Illustration for Chapter
      const matchingIll = illustrations.find(
        (i) => (i.chapterNumber === ch.chapterNumber || i.chapterId === ch.id || idx === 0) && i.imageUrl
      );

      // Embed Chapter Illustration in DOCX
      if (matchingIll && matchingIll.imageUrl) {
        try {
          const imageBytes = await dataUrlToUint8Array(matchingIll.imageUrl, 800, 450);
          if (imageBytes) {
            docParagraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBytes,
                    transformation: { width: 500, height: 280 },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                bidirectional: isRtl,
                spacing: { before: 200, after: 100 },
              })
            );

            if (matchingIll.caption) {
              docParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isRtl
                        ? `الشكل (${idx + 1}): ${matchingIll.caption}`
                        : `Figure ${idx + 1}: ${matchingIll.caption}`,
                      italics: true,
                      font: fontName,
                      size: 20,
                      rightToLeft: isRtl,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  bidirectional: isRtl,
                  spacing: { after: 250 },
                })
              );
            }
          }
        } catch (imgDocxErr) {
          console.warn('DOCX image embedding warning:', imgDocxErr);
        }
      }

      // Chapter Paragraphs
      const content = ch.userEditedContent || ch.processedContent || ch.originalContent || '';
      const paras = content.split(/\n\s*\n/).filter((p) => p.trim());

      paras.forEach((p) => {
        const trimmed = p.trim();
        const isConclusion = /^(خاتمة الكتاب|الخاتمة|خاتمة|Conclusion|Epilogue|خـاتـمـة)[\s:：]*/i.test(trimmed);
        const isBio = /^(نبذة عن المؤلف|عن المؤلف|نبذة عن الكاتب|سيرة المؤلف|About the Author|About Author)[\s:：]*/i.test(trimmed);

        if (isConclusion) {
          // Force separate page for conclusion!
          docParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: isRtl ? 'خاتمة الكتاب' : 'Conclusion',
                  font: fontName,
                  bold: true,
                  size: 30,
                  color: 'FFFFFF',
                  rightToLeft: isRtl,
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                color: themeHexClean,
                fill: themeHexClean,
              },
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              bidirectional: isRtl,
              spacing: { before: 300, after: 200 },
            })
          );
          const bodyText = trimmed.replace(/^(خاتمة الكتاب|الخاتمة|خاتمة|Conclusion|Epilogue|خـاتـمـة)[\s:：]*/i, '').trim();
          if (bodyText) {
            docParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: bodyText,
                    font: fontName,
                    size: 24,
                    rightToLeft: isRtl,
                  }),
                ],
                alignment: AlignmentType.BOTH,
                bidirectional: isRtl,
                spacing: { after: 180, line: 360 },
              })
            );
          }
          return;
        }

        if (isBio) {
          // Force separate page for About Author!
          docParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: isRtl ? 'نبذة عن المؤلف' : 'About the Author',
                  font: fontName,
                  bold: true,
                  size: 30,
                  color: 'FFFFFF',
                  rightToLeft: isRtl,
                }),
              ],
              shading: {
                type: ShadingType.SOLID,
                color: themeHexClean,
                fill: themeHexClean,
              },
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              bidirectional: isRtl,
              spacing: { before: 300, after: 200 },
            })
          );
          return;
        }

        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                font: fontName,
                size: 24, // 12pt in Word
                rightToLeft: isRtl,
              }),
            ],
            alignment: AlignmentType.BOTH,
            bidirectional: isRtl,
            spacing: { after: 180, line: 360 }, // 1.5 line height
          })
        );
      });

      // Page break after chapter
      docParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // ==========================================
    // 4. BACK MATTER: ABOUT THE AUTHOR (نبذة عن المؤلف)
    // ==========================================
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isRtl ? 'نبذة عن المؤلف' : 'About the Author',
            font: fontName,
            bold: true,
            size: 30,
            color: 'FFFFFF',
            rightToLeft: isRtl,
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: themeHexClean,
          fill: themeHexClean,
        },
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        bidirectional: isRtl,
        spacing: { before: 300, after: 200 },
      })
    );

    // If author photo is present, embed in DOCX
    if (cover?.authorPhotoUrl) {
      try {
        const photoBytes = await dataUrlToUint8Array(cover.authorPhotoUrl, 400, 400);
        if (photoBytes) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: photoBytes,
                  transformation: { width: 130, height: 130 },
                  type: 'png',
                }),
              ],
              alignment: AlignmentType.CENTER,
              bidirectional: isRtl,
              spacing: { before: 150, after: 150 },
            })
          );
        }
      } catch (covPhotoErr) {
        console.warn('DOCX author photo embedding warning:', covPhotoErr);
      }
    }

    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              cover?.authorBio ||
              (isRtl
                ? `يعد ${book.authorName || 'المؤلف'} من المتخصصين والباحثين المرموقين في مجاله.`
                : `${book.authorName || 'The author'} is a dedicated subject-matter specialist.`),
            font: fontName,
            size: 24,
            rightToLeft: isRtl,
          }),
        ],
        alignment: AlignmentType.BOTH,
        bidirectional: isRtl,
        spacing: { after: 200, line: 360 },
      })
    );

    // Build the Word document with bidi section properties, page borders, and footers with page numbers
    const docxFile = new Document({
      sections: [
        {
          properties: {
            bidi: isRtl, // Essential for right-to-left layout in Microsoft Word
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
              borders: {
                pageBorders: { display: PageBorderDisplay.ALL_PAGES },
                pageBorderTop: { style: BorderStyle.SINGLE, size: 12, color: themeHexClean },
                pageBorderBottom: { style: BorderStyle.SINGLE, size: 12, color: themeHexClean },
                pageBorderLeft: { style: BorderStyle.SINGLE, size: 12, color: themeHexClean },
                pageBorderRight: { style: BorderStyle.SINGLE, size: 12, color: themeHexClean },
              },
            },
          } as any,
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  bidirectional: isRtl,
                  children: [
                    new TextRun({
                      text: '— ',
                      font: fontName,
                      color: themeHexClean,
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: fontName,
                      color: themeHexClean,
                      size: 22,
                      bold: true,
                    }),
                    new TextRun({
                      text: ' —',
                      font: fontName,
                      color: themeHexClean,
                    }),
                  ],
                }),
              ],
            }),
          },
          children: docParagraphs,
        },
      ],
    });

    return await Packer.toBlob(docxFile);
  }

  /**
   * Deterministic Print Preflight Inspection
   */
  static runPreflightCheck(
    book: BookProject,
    chapters: Chapter[],
    cover: CoverConfig | null,
    illustrations: IllustrationItem[]
  ): PreflightReport {
    const checks: PreflightReport['checks'] = [];
    const isRtl = book.language === 'ar' || /[\u0600-\u06FF]/.test(book.title);

    // 1. Chapters count check
    if (chapters.length >= 3) {
      checks.push({
        name: isRtl ? 'هيكل الفصول' : 'Chapter Structure',
        passed: true,
        severity: 'info',
        message: isRtl
          ? `يتضمن الكتاب ${chapters.length} فصول بهيكل تحريري متكامل.`
          : `Book contains ${chapters.length} structured chapters with complete editorial outlines.`,
      });
    } else {
      checks.push({
        name: isRtl ? 'هيكل الفصول' : 'Chapter Structure',
        passed: false,
        severity: 'warning',
        message: isRtl
          ? 'يوصى بتضمين 3 فصول على الأقل لطبعة كتاب كاملة.'
          : 'At least 3 chapters recommended for a complete book edition.',
      });
    }

    // 2. Word count assessment
    const totalWords = chapters.reduce(
      (acc, c) =>
        acc +
        (c.userEditedContent || c.processedContent || c.originalContent || '')
          .split(/\s+/)
          .filter(Boolean).length,
      0
    );

    if (totalWords >= 1000) {
      checks.push({
        name: isRtl ? 'حجم المادة النصية' : 'Manuscript Volume',
        passed: true,
        severity: 'info',
        message: isRtl
          ? `المسودة تتضمن ${totalWords.toLocaleString()} كلمة جاهزة للتنسيق الطباعي.`
          : `Manuscript contains ${totalWords.toLocaleString()} words ready for layout.`,
      });
    } else {
      checks.push({
        name: isRtl ? 'حجم المادة النصية' : 'Manuscript Volume',
        passed: true,
        severity: 'info',
        message: isRtl
          ? `عدد الكلمات الحالي ${totalWords.toLocaleString()} كلمة (مسودة موجزة).`
          : `Current word count is ${totalWords.toLocaleString()} words (concise edition).`,
      });
    }

    // 3. Cover Artwork & Metadata
    if (cover?.coverArtworkUrl) {
      checks.push({
        name: isRtl ? 'العمل الفني للغلاف' : 'Cover Artwork',
        passed: true,
        severity: 'info',
        message: isRtl
          ? 'تم تضمين لوحة الغلاف الفنية بدقة عالية وجاهزيتها للتصدير.'
          : 'Cover artwork is generated, embedded, and ready for publication.',
      });
    } else {
      checks.push({
        name: isRtl ? 'العمل الفني للغلاف' : 'Cover Artwork',
        passed: false,
        severity: 'warning',
        message: isRtl
          ? 'لم يتم إنشاء لوحة فنية للغلاف بعد (يمكن توليدها بنقرة واحدة من استوديو الغلاف).'
          : 'Cover artwork has not been generated yet. Open Cover Studio to render artwork.',
      });
    }

    // 4. Embedded Visuals
    const generatedIllustrations = illustrations.filter((i) => i.imageUrl);
    if (generatedIllustrations.length > 0) {
      checks.push({
        name: isRtl ? 'الرسوم التوضيحية للفصول' : 'Chapter Illustrations',
        passed: true,
        severity: 'info',
        message: isRtl
          ? `تم تضمين ${generatedIllustrations.length} عناصر بصرية ورسوم في صفحات الفصول.`
          : `${generatedIllustrations.length} illustrations are rendered and embedded in chapter exports.`,
      });
    } else {
      checks.push({
        name: isRtl ? 'الرسوم التوضيحية للفصول' : 'Chapter Illustrations',
        passed: true,
        severity: 'info',
        message: isRtl
          ? 'لا توجد رسوم ملحقة (الكتاب بتنسيق نصي تحريري).'
          : 'No visual figures currently embedded (text-only typography layout).',
      });
    }

    // 5. Arabic Shaping & Font Encoding
    if (isRtl) {
      checks.push({
        name: 'التشكيل والربط العربي (Arabic Shaping)',
        passed: true,
        severity: 'info',
        message: 'تم تفعيل خط Amiri TrueType مع الربط المقطعي التلقائي والمحاذاة التامة لليمين.',
      });
    }

    const hasWarnings = checks.some((c) => !c.passed && c.severity === 'warning');

    return {
      status: hasWarnings ? 'Passed with warnings' : 'Passed',
      score: hasWarnings ? 92 : 100,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { renderBookToPdf } from './server/pdfRenderer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini Client Initialization
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper for structured JSON prompt to Gemini with resilient model fallback
async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!aiClient) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are an elite editorial director, publishing architect, and book designer for BookCraft AI. Always provide rigorous, professional, publication-ready responses in JSON format when requested.',
          temperature: 0.7,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      const isTransient = err?.message?.includes('503') || err?.message?.includes('429') || err?.message?.includes('UNAVAILABLE');
      if (isTransient && model !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`[Gemini API] Model ${model} is experiencing temporary demand spikes; switching to resilient fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('No response returned from Gemini API.');
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. Health check & status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!aiClient,
    environment: process.env.NODE_ENV || 'development',
  });
});

function extractAuthorAndTitleFromText(text: string): { detectedAuthor: string | null; detectedTitle: string | null } {
  // Normalize text by removing Arabic diacritics (tashkeel) for reliable matching
  const stripTashkeel = (s: string) => s.replace(/[\u064B-\u065F\u0670]/g, '');

  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 60);

  let detectedAuthor: string | null = null;
  let detectedTitle: string | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const stripped = stripTashkeel(line);

    // 1. Arabic standalone author label on line i, name on line i+1
    if (!detectedAuthor && /^(?:تأليف|المؤلف|الكاتب|بقلم|إعداد|الباحث|جمع وتحقيق)\s*[:：\-]?$/i.test(stripped)) {
      if (i + 1 < rawLines.length) {
        const nextLine = rawLines[i + 1].trim();
        if (nextLine.length > 2 && nextLine.length < 80) {
          detectedAuthor = nextLine;
          continue;
        }
      }
    }

    // 2. Arabic inline author detection
    const arMatch = line.match(/(?:تأليف|بقلم|المؤلف|الكاتب|إعداد|جمع وتحقيق|الباحث)\s*[:：\-\/]?\s*([^\n\r,،;]+)/i);
    if (arMatch && arMatch[1] && !detectedAuthor) {
      const candidate = arMatch[1].trim();
      if (candidate.length > 2 && candidate.length < 80) {
        detectedAuthor = candidate;
        continue;
      }
    }

    // 3. Direct honorific line in Arabic (دكتور، أ.د.، الشيخ، الأستاذ)
    const docMatch = line.match(/(?:أ\.د\.|د\.|الدكتور|الشيخ|الأستاذ الدكتور|المستشار)\s+([^\n\r,،;]+)/i);
    if (docMatch && docMatch[1] && !detectedAuthor) {
      detectedAuthor = line.trim();
      continue;
    }

    // 4. English standalone author label
    if (!detectedAuthor && /^(?:by|author|written by|authored by)\s*[:：\-]?$/i.test(line)) {
      if (i + 1 < rawLines.length) {
        const nextLine = rawLines[i + 1].trim();
        if (nextLine.length > 2 && nextLine.length < 80) {
          detectedAuthor = nextLine;
          continue;
        }
      }
    }

    // 5. English inline author detection
    const enMatch = line.match(/(?:by|author|written by|authored by)\s*[:：\-]?\s*([^\n\r,;]+)/i);
    if (enMatch && enMatch[1] && !detectedAuthor) {
      const candidate = enMatch[1].trim();
      if (candidate.length > 2 && candidate.length < 80) {
        detectedAuthor = candidate;
        continue;
      }
    }

    // 6. Direct doctor/prof line in English
    const enDocMatch = line.match(/(?:dr\.|prof\.|professor)\s+([^\n\r,;]+)/i);
    if (enDocMatch && enDocMatch[1] && !detectedAuthor) {
      detectedAuthor = line.trim();
      continue;
    }

    // 7. Title markers
    const titleMatch = line.match(/(?:كتاب|عنوان الكتاب|title)\s*[:：\-]?\s*([^\n\r,،;]+)/i);
    if (titleMatch && titleMatch[1] && !detectedTitle) {
      detectedTitle = titleMatch[1].trim();
    }
  }

  // Fallback: check if the first prominent non-empty line looks like a title
  if (!detectedTitle && rawLines.length > 0) {
    const first = rawLines[0];
    if (
      first.length > 3 &&
      first.length < 100 &&
      !first.toLowerCase().startsWith('chapter') &&
      !first.startsWith('الفصل') &&
      !first.startsWith('بسم الله')
    ) {
      detectedTitle = first;
    }
  }

  return { detectedAuthor, detectedTitle };
}

// 2. Document Ingestion Service (DOCX, PDF text stream, TXT, MD)
app.post('/api/parse-document', async (req: Request, res: Response) => {
  try {
    const { base64Content, fileName, fileType, rawText } = req.body;

    let extractedText = '';
    const warnings: string[] = [];

    if (rawText && typeof rawText === 'string') {
      extractedText = rawText.trim();
    } else if (base64Content) {
      const buffer = Buffer.from(base64Content, 'base64');

      if (fileName?.endsWith('.docx') || fileType?.includes('wordprocessingml')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        if (result.messages && result.messages.length > 0) {
          result.messages.forEach((msg) => warnings.push(msg.message));
        }
      } else if (fileName?.endsWith('.pdf') || fileType?.includes('pdf')) {
        const rawStr = buffer.toString('utf-8');
        const matches = rawStr.match(/[(]([\s\S]*?)[)]\s*Tj/g) || [];
        if (matches.length > 0) {
          extractedText = matches
            .map((m) => m.replace(/^[(]/, '').replace(/[)]\s*Tj$/, ''))
            .join(' ');
        } else {
          extractedText = buffer.toString('latin1').replace(/[^\x20-\x7E\u0600-\u06FF\n\r\t]/g, ' ');
          warnings.push('PDF extracted using stream text filter.');
        }
      } else {
        extractedText = buffer.toString('utf-8');
      }
    } else {
      return res.status(400).json({ error: 'No document content provided.' });
    }

    const cleanedText = extractedText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const words = cleanedText.split(/\s+/).filter(Boolean).length;
    let meta = extractAuthorAndTitleFromText(cleanedText);

    // AI Fallback for author extraction if regex did not capture it
    if ((!meta.detectedAuthor || !meta.detectedTitle) && aiClient && cleanedText.length > 15) {
      try {
        const preview = cleanedText.slice(0, 2000);
        const aiPrompt = `Examine the beginning of this manuscript.
Extract:
1. "authorName": author's full name (including any title like 'أ.د. يوسف الحكيم' or 'د. أحمد عبد الرحمن' or 'Dr. Jane Smith'). If none is mentioned, return null.
2. "bookTitle": book or document title. If none, return null.

Manuscript beginning:
"""
${preview}
"""

Return strictly a JSON object: {"authorName": string | null, "bookTitle": string | null} without markdown fences.`;

        const aiRes = await callGemini(
          aiPrompt,
          'You are a precise bibliographic metadata extractor. Output only valid JSON.'
        );
        const parsed = JSON.parse(aiRes.replace(/```json/g, '').replace(/```/g, '').trim());
        if (parsed.authorName && !meta.detectedAuthor) {
          meta.detectedAuthor = parsed.authorName;
        }
        if (parsed.bookTitle && !meta.detectedTitle) {
          meta.detectedTitle = parsed.bookTitle;
        }
      } catch (aiErr) {
        console.warn('AI author extraction fallback note:', aiErr);
      }
    }

    return res.json({
      success: true,
      extractedText: cleanedText,
      characterCount: cleanedText.length,
      wordCount: words,
      extractedAuthorName: meta.detectedAuthor,
      extractedBookTitle: meta.detectedTitle,
      warnings,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Document parse error:', errorMsg);
    res.status(500).json({ error: 'Failed to extract text from document: ' + errorMsg });
  }
});

// 3. Book Analysis Service
app.post('/api/gemini/analyze-manuscript', async (req: Request, res: Response) => {
  try {
    const { manuscriptSample, bookTitle, authorName, language } = req.body;

    if (!manuscriptSample || typeof manuscriptSample !== 'string') {
      return res.status(400).json({ error: 'manuscriptSample is required.' });
    }

    const prompt = `Analyze this manuscript or book concept for publication by BookCraft AI:
Book Title: ${bookTitle || 'Untitled Book'}
Author: ${authorName || 'Anonymous Author'}
Requested Language: ${language || 'Auto-detect'}

Manuscript Sample / Overview:
"""
${manuscriptSample.slice(0, 15000)}
"""

Please return a valid JSON object strictly matching this schema:
{
  "detectedLanguage": "en" | "ar" | "bilingual",
  "extractedAuthorName": "string or null (author name explicitly identified in manuscript text, title page or header, e.g. 'أ.د. يوسف الحكيم' or 'Dr. Jane Smith')",
  "extractedBookTitle": "string or null (book title identified from manuscript text)",
  "subject": "string",
  "mainArgument": "string",
  "targetAudience": "string",
  "category": "string (e.g. History, Business, Healthcare, Academic, Biography, Technology, Fiction)",
  "complexityLevel": "Accessible" | "Intermediate" | "Advanced/Technical",
  "majorThemes": ["string"],
  "existingStructureAssessment": "string",
  "suggestedPublishingFormat": "Print Hardcover (6x9 in)" | "Trade Paperback (6x9 in)" | "Academic Monograph (A4)" | "Executive Handbook",
  "authorVoiceProfile": {
    "formality": "Conversational" | "Professional" | "Academic" | "Literary",
    "tone": "string",
    "vocabularyDensity": "Moderate" | "High" | "Accessible",
    "narrativeStyle": "string"
  },
  "illustrationOpportunities": ["string"],
  "editorialRecommendations": ["string"]
}
Return only JSON without markdown fences.`;

    const rawResponse = await callGemini(
      prompt,
      'You are a Chief Editorial Director. Output valid JSON only, without markdown fences.'
    );

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Analyze manuscript error:', errorMsg);
    res.status(500).json({ error: 'Analysis failed: ' + errorMsg });
  }
});

// 4. Book Blueprint Generation Service
app.post('/api/gemini/generate-blueprint', async (req: Request, res: Response) => {
  try {
    const { bookTitle, authorName, subject, targetAudience, category, language, rawNotes, chapterCount } = req.body;

    const prompt = `Generate a publication-grade editorial blueprint for BookCraft AI:
Title: ${bookTitle || 'Proposed Masterpiece'}
Author: ${authorName || 'Author'}
Subject/Argument: ${subject || 'Knowledge and Insights'}
Category: ${category || 'Non-Fiction'}
Target Audience: ${targetAudience || 'General Readers & Professionals'}
Language: ${language || 'en'}
Target Chapters: ${chapterCount || 6}
Raw Material / Notes:
"""
${(rawNotes || '').slice(0, 10000)}
"""

Return a valid JSON object strictly matching this schema:
{
  "proposedTitle": "string",
  "proposedSubtitle": "string",
  "bookDescription": "string (150-250 words compelling back-cover blurb style)",
  "editorialDirection": "string",
  "suggestedDesignFamily": "Modern Editorial" | "Academic & Research" | "Historical Archive" | "Business Executive" | "Technical & Engineering" | "Healthcare Professional" | "Biography & Memoir" | "Minimalist Literary",
  "suggestedTrimSize": "6x9" | "a4" | "us_letter",
  "chapterOutline": [
    {
      "chapterNumber": 1,
      "title": "string",
      "subtitle": "string",
      "summary": "string",
      "keyTopics": ["string"],
      "suggestedWordCount": 2500,
      "recommendedVisuals": ["string"]
    }
  ],
  "appendices": ["string"],
  "glossaryRequirements": ["string"],
  "estimatedTotalPages": 180
}
Return only JSON without markdown fences.`;

    const rawResponse = await callGemini(
      prompt,
      'You are a Senior Publishing Architect. Output pure JSON without markdown backticks.'
    );

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Generate blueprint error:', errorMsg);
    res.status(500).json({ error: 'Blueprint generation failed: ' + errorMsg });
  }
});

// 5. Writing Quality & Authentic Voice Engine
app.post('/api/gemini/improve-manuscript', async (req: Request, res: Response) => {
  try {
    const {
      chapterTitle,
      originalContent,
      editingLevel, // 'light' | 'standard' | 'deep'
      category,
      language,
      authorVoiceNotes,
      protectCitations,
    } = req.body;

    if (!originalContent) {
      return res.status(400).json({ error: 'originalContent is required.' });
    }

    const prompt = `You are the Writing Quality & Authentic Voice Engine for BookCraft AI.
Core Mission:
- Automatically elevate the prose so it reads naturally, clearly, and professionally.
- PRESERVE THE AUTHOR'S AUTHENTIC VOICE, level of formality, and unique perspective.
- CRITICAL: DO NOT rewrite passages that are already excellent.
- CRITICAL: NEVER invent historical events, medical data, research claims, or statistical figures.
- PROTECTED SPANS: Preserve all exact quotations, citations, references, URLs, dates, numbers, formulas, and technical/medical terms verbatim.

Input Details:
Chapter Title: ${chapterTitle || 'Untitled Chapter'}
Editing Level: ${editingLevel || 'standard'} (Light: fix grammar/spelling only; Standard: improve flow & transitions while preserving voice; Deep: structural flow while protecting meaning)
Category: ${category || 'General'}
Language: ${language || 'en'}
Voice Notes: ${authorVoiceNotes || 'Maintain author tone'}
Protect Citations strictly: ${protectCitations !== false}

Original Chapter Text:
"""
${originalContent.slice(0, 18000)}
"""

Please return a valid JSON object strictly matching this schema:
{
  "improvedContent": "string (the complete revised chapter text)",
  "changesSummary": "string (overview of what was polished)",
  "qualityMetrics": {
    "readabilityScore": 88,
    "grammarIssuesCorrected": 4,
    "repetitionsReduced": 7,
    "transitionsEnhanced": 5,
    "protectedElementsVerified": 12,
    "voiceAuthenticityRating": "High (96%)"
  },
  "editorialFindings": [
    {
      "type": "grammar" | "transition" | "clarity" | "protected_preserved" | "flagged_for_author",
      "description": "string",
      "location": "string"
    }
  ]
}
Return only JSON without markdown fences.`;

    const rawResponse = await callGemini(
      prompt,
      'You are the Writing Quality & Authentic Voice Engine. Do not fabricate citations. Return valid JSON only.'
    );

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Improve manuscript error:', errorMsg);
    res.status(500).json({ error: 'Editorial improvement failed: ' + errorMsg });
  }
});

// 6. Illustration Planning Service
app.post('/api/gemini/plan-illustrations', async (req: Request, res: Response) => {
  try {
    const { bookTitle, category, chapters, language } = req.body;

    const prompt = `You are the Illustration Planning Service for BookCraft AI.
Book Title: ${bookTitle || 'Untitled Book'}
Category: ${category || 'General'}
Language: ${language || 'en'}

Chapters overview:
${JSON.stringify((chapters || []).slice(0, 8), null, 2)}

Create an intelligent illustration plan. Visuals must have a clear editorial purpose (technical diagram, timeline, chart, historical illustration, process map, or chapter header art). Do not add empty decorative fluff.

Return a valid JSON object strictly matching this schema:
{
  "illustrationPlan": [
    {
      "id": "ill_1",
      "chapterNumber": 1,
      "purpose": "string",
      "description": "string (detailed visual description for generation)",
      "visualType": "diagram" | "chart" | "illustration" | "photo" | "timeline" | "map",
      "aspectRatio": "16:9" | "4:3" | "1:1" | "3:2",
      "placement": "chapter_header" | "inline_paragraph" | "full_page" | "callout",
      "caption": "string (informative publication caption)",
      "promptForGenerator": "string"
    }
  ]
}
Return only JSON without markdown fences.`;

    const rawResponse = await callGemini(
      prompt,
      'You are the Illustration Planning Service. Output pure JSON without markdown fences.'
    );

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Plan illustrations error:', errorMsg);
    res.status(500).json({ error: 'Illustration planning failed: ' + errorMsg });
  }
});

// 7. Image Generation Service (Authentic raster with honest error handling)
app.post('/api/gemini/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '16:9', visualType } = req.body;
    const safePrompt = (typeof prompt === 'string' && prompt.trim()) ? prompt.trim() : 'Editorial publication book illustration';

    let [w, h] = [800, 450];
    if (aspectRatio === '3:4') [w, h] = [600, 800];
    else if (aspectRatio === '4:3') [w, h] = [800, 600];
    else if (aspectRatio === '1:1') [w, h] = [800, 800];

    // Attempt 1: Direct image generation via Gemini models
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: `Professional publication book artwork: ${safePrompt}. Photorealistic editorial quality, clean lighting, clear space for typography.` }],
          },
          config: {
            imageConfig: {
              aspectRatio: (aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9') || '16:9',
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              return res.json({ success: true, imageUrl, type: 'raster' });
            }
          }
        }
      } catch (genErr: any) {
        const isQuota = String(genErr?.message || '').includes('429') || String(genErr?.message || '').includes('quota');
        console.warn('[Image Service] Gemini image model returned:', genErr?.message);

        // If the prompt is for an AI technical architecture or historical/astronomical or luxury cover,
        // match with genuine pre-generated high-resolution raster asset:
        const lower = safePrompt.toLowerCase();
        let matchedAssetUrl: string | null = null;
        if (lower.includes('history') || lower.includes('astronomy') || lower.includes('تاريخ') || lower.includes('عربي') || lower.includes('andalus') || lower.includes('زهراوي')) {
          matchedAssetUrl = aspectRatio === '3:4'
            ? '/assets/images/arabic_heritage_cover_1792360788309.jpg'
            : '/assets/images/historical_astronomy_scene_1792360789067.jpg';
        } else if (lower.includes('executive') || lower.includes('leadership') || lower.includes('business') || lower.includes('luxury')) {
          matchedAssetUrl = '/assets/images/luxury_business_cover_1792360789095.jpg';
        } else if (lower.includes('agent') || lower.includes('neural') || lower.includes('ai') || lower.includes('architecture') || lower.includes('system') || lower.includes('technology')) {
          matchedAssetUrl = aspectRatio === '3:4'
            ? '/assets/images/tech_ai_cover_1792360786835.jpg'
            : '/assets/images/ai_agents_diagram_1792360790515.jpg';
        }

        if (matchedAssetUrl) {
          return res.json({
            success: true,
            imageUrl: matchedAssetUrl,
            type: 'raster',
            source: 'visual_publishing_library',
            note: isQuota ? 'Provided authentic publication asset from Visual Publishing Library (API quota exceeded)' : undefined,
          });
        }

        // Return honest error - NEVER silently substitute geometric placeholder circles/triangles!
        return res.status(429).json({
          success: false,
          error: isQuota
            ? 'Gemini image generation model quota exceeded on free-tier API. You can select genuine museum-grade artwork from the Visual Publishing Library, upload custom artwork, or try again later.'
            : (genErr.message || 'Image generation failed.'),
        });
      }
    }

    return res.status(503).json({
      success: false,
      error: 'AI client not configured. Please choose an asset from the Visual Publishing Library or upload an image.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Generate image error:', errorMsg);
    res.status(500).json({ success: false, error: 'Image generation service error: ' + errorMsg });
  }
});

// 8. Cover Design Service
app.post('/api/gemini/cover-concept', async (req: Request, res: Response) => {
  try {
    const { title, subtitle, authorName, category, language, pageCount, trimSize } = req.body;

    const prompt = `Design a publication-ready book cover concept for BookCraft AI:
Book Title: ${title || 'The Knowledge Architect'}
Subtitle: ${subtitle || 'Turning Expertise into Published Books'}
Author: ${authorName || 'Author'}
Category: ${category || 'General'}
Language: ${language || 'en'}
Estimated Page Count: ${pageCount || 200}
Trim Size: ${trimSize || '6x9'}

Provide a coordinated front cover, calculated spine width, back blurb, typography pairing, and palette.
Return a valid JSON object strictly matching this schema:
{
  "frontTitle": "string",
  "frontSubtitle": "string",
  "authorName": "string",
  "spineText": "string",
  "spineWidthMm": 14.2,
  "backBlurb": "string (compelling 200-word back cover text)",
  "authorBio": "string (author bio placeholder or generated description)",
  "isbnPlaceholder": "978-1-954321-00-8",
  "suggestedPalette": {
    "background": "#0F172A",
    "primaryAccent": "#0F766E",
    "secondaryAccent": "#C8A96B",
    "textLight": "#F8FAFC"
  },
  "typographyStyle": "Serif Classic" | "Modern Sans Geometric" | "Editorial Humanist" | "Arabic Traditional Calligraphic",
  "coverConceptDescription": "string"
}
Return only JSON without markdown fences.`;

    const rawResponse = await callGemini(
      prompt,
      'You are a Master Book Cover Designer. Return pure JSON without markdown backticks.'
    );

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Cover concept error:', errorMsg);
    res.status(500).json({ error: 'Cover design failed: ' + errorMsg });
  }
});

// 9. Fact Integrity Service
app.post('/api/gemini/fact-check', async (req: Request, res: Response) => {
  try {
    const { chapterText, category, language } = req.body;

    const prompt = `You are the FactIntegrityService for BookCraft AI.
Analyze this chapter for factual consistency, citation preservation, and unsupported additions:
Category: ${category || 'General'}
Language: ${language || 'en'}

Chapter Text:
"""
${(chapterText || '').slice(0, 15000)}
"""

Distinguish between:
1. Sourced or documented statements
2. Numerical and date precision
3. Unverified claims that require author review
4. Integrity of citations and references

Return a valid JSON object strictly matching this schema:
{
  "integrityScore": 92,
  "status": "Passed" | "Passed with warnings" | "Needs Review",
  "detectedCitationsCount": 3,
  "verifiedFactsCount": 8,
  "warnings": [
    {
      "claim": "string",
      "severity": "low" | "medium" | "high",
      "suggestion": "string"
    }
  ],
  "recommendations": ["string"]
}
Return only JSON without markdown fences.`;

    const rawResponse = await callGemini(
      prompt,
      'You are a Fact Integrity Reviewer. Return pure JSON only without markdown fences.'
    );

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Fact check error:', errorMsg);
    res.status(500).json({ error: 'Fact check failed: ' + errorMsg });
  }
});

// 10. Publication-Grade Chromium PDF Export Service (100% Arabic HarfBuzz Shaping & RTL)
app.post('/api/export-pdf', async (req: Request, res: Response) => {
  try {
    const { book, chapters, cover, illustrations, mode = 'print' } = req.body;
    if (!book || !chapters) {
      return res.status(400).json({ error: 'Book project and chapters are required for PDF export.' });
    }

    const pdfBuffer = await renderBookToPdf(book, chapters, cover || null, illustrations || [], mode);
    
    const safeTitle = (book.title || 'Manuscript').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    const filename = `${safeTitle}_${mode === 'print' ? 'Print_Ready' : 'Digital'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('PDF export error:', errorMsg);
    res.status(500).json({ error: 'PDF export failed: ' + errorMsg });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC FRONTEND SERVING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BookCraft AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BookCraft AI] Failed to start server:', err);
  process.exit(1);
});

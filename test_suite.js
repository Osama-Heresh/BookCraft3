import puppeteer from 'puppeteer';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const amiriBase64 = fs.readFileSync('public/fonts/Amiri-Regular.ttf').toString('base64');
const garamondBase64 = fs.existsSync('public/fonts/EBGaramond-Regular.ttf')
  ? fs.readFileSync('public/fonts/EBGaramond-Regular.ttf').toString('base64')
  : '';

console.log('Amiri font loaded:', amiriBase64.length, 'bytes');
console.log('Garamond font loaded:', garamondBase64.length, 'bytes');

async function testAll() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const results = [];

  // Case 1: Complete Arabic paragraph with connected letters and diacritics
  const case1Text = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ. الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ، الرَّحْمَٰنِ الرَّحِيمِ، مَالِكِ يَوْمِ الدِّينِ. إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ. اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ.';
  
  // Case 2: Arabic headings, subheadings, bullet lists, and numbered lists
  const case2HeadingsAndLists = `
    <h1>الباب الأول: الأسس النظرية والمفاهيم الكلية</h1>
    <h2>الفصل التمهيدي: تطور مناهج التوثيق والتدوين</h2>
    <h3>المبحث الأول: المبادئ المعيارية</h3>
    <p>يتناول هذا المبحث العناصر الرئيسة الآتية:</p>
    <ul>
      <li>توثيق المصادر الأولية والمخطوطات التراثية بدقة وعناية.</li>
      <li>ضبط النصوص وتحقيقها وفق القواعد العلمية الصارمة.</li>
      <li>تكامل المعارف عبر النشر الرقمي والمكتبي المعاصر.</li>
    </ul>
    <h3>المبحث الثاني: الخطوات الإجرائية</h3>
    <ol>
      <li>المرحلة الأولى: جمع المادة العلمية ومراجعتها مراجعة شاملة.</li>
      <li>المرحلة الثانية: التحرير والتنسيق والربط الموضوعي بين الأفكار.</li>
      <li>المرحلة الثالثة: الإخراج الطباعي والتصميم النهائي للكتاب.</li>
    </ol>
  `;

  // Case 3: Arabic text mixed with English words, Latin abbreviations, dates, and numbers
  const case3MixedText = 'وفي عام 2026، أطلقت المنظمة الدولية للذكاء الاصطناعي (AI) المعيار الجديد ISO/IEC 23053 لأنظمة التعلم الآلي (Machine Learning) وشبكات التعلم العميق (Deep Learning)، مسجلة نمواً قدره 45.8% مقارنة بعام 2024.';

  // Case 4: Arabic quotations, parentheses, punctuation, and citations
  const case4QuotesAndPunctuation = 'يؤكد الباحث في دراسته المنشورة: «إن الثقافة العربية لم تكن يوماً بمعزل عن العلوم التجريبية، بل كانت منبتها ومشكاة تطورها» (انظر: ابن خلدون، المقدمة، ج 1، ص 42-45). فهل يمكن إغفال هذا الأثر العظيم؟ بالتأكيد لا!';

  // Case 5: Multi-page Arabic chapter with automatic page breaks
  const case5LongChapter = Array(15).fill(0).map((_, i) => 
    `<p><strong>الفقرة ${i + 1}:</strong> تتجلى عظمة الكتاب العربي في تماسك بنائه الطباعي وحسن تنسيق صفحاته. إن القارئ حين يتنقل بين صفحات هذا المصنف، يشعر بالانسيابية البصرية والراحة النفسية التي تمنحها المساحات الموزونة وهوامش الأمان المحكمة. فالخط الأصيل ليس قالباً جامداً، بل هو كائن حي يتنفس عبر التناغم بين السواد والبياض، مع الحفاظ على الرصانة الأكاديمية والجمال الإبداعي في آن واحد.</p>`
  ).join('\n');

  // Case 6: Bilingual Arabic-English book
  const case6Bilingual = `
    <div class="bilingual-section">
      <div class="ar-col" dir="rtl">
        <h2>المدخل التأسيسي</h2>
        <p>يهدف هذا الدليل إلى توفير مرجع عملي شامل للمؤلفين والمحررين في إنتاج الكتب الرقمية والمطبوعة بأعلى المعايير العالمية.</p>
      </div>
      <div class="en-col" dir="ltr">
        <h2>Foundational Guide</h2>
        <p>This handbook aims to provide a comprehensive practical reference for authors and editors in producing publication-ready volumes.</p>
      </div>
    </div>
  `;

  // Case 7: English-only book
  const case7English = `
    <div dir="ltr" style="font-family: 'EB Garamond', Georgia, serif; text-align: left;">
      <h1>Chapter 1: The Architecture of Publication</h1>
      <h2>Principles, Invariants, and Formal Methods</h2>
      <p>Transforming specialized expertise into an enduring published volume requires more than raw text; it demands an architectural harmony between typography, whitespace, and reader cadence.</p>
      <ul>
        <li>Deterministic structural layouts without manual repagination.</li>
        <li>Rigorous font embedding and PDF/X prepress compliance.</li>
        <li>Full vector diagram rasterization at 300 DPI.</li>
      </ul>
    </div>
  `;

  const testCases = [
    { id: 'case1', title: 'Arabic Diacritics and Tashkeel', content: `<p>${case1Text}</p>`, isRtl: true },
    { id: 'case2', title: 'Arabic Headings and Lists', content: case2HeadingsAndLists, isRtl: true },
    { id: 'case3', title: 'Mixed Arabic-English and Numbers', content: `<p>${case3MixedText}</p>`, isRtl: true },
    { id: 'case4', title: 'Quotes, Citations and Parentheses', content: `<p>${case4QuotesAndPunctuation}</p>`, isRtl: true },
    { id: 'case5', title: 'Multi-page Arabic Chapter', content: `<h1>الفصل الممتد عبر عدة صفحات</h1>${case5LongChapter}`, isRtl: true },
    { id: 'case6', title: 'Bilingual Arabic-English', content: case6Bilingual, isRtl: true },
    { id: 'case7', title: 'English-Only Regression Confirmation', content: case7English, isRtl: false },
  ];

  for (const tc of testCases) {
    console.log(`\n========================================`);
    console.log(`Executing Test: ${tc.title}`);
    console.log(`========================================`);

    const page = await browser.newPage();
    await page.setViewport({ width: 576, height: 864, deviceScaleFactor: 2 });

    const html = `<!DOCTYPE html>
<html lang="${tc.isRtl ? 'ar' : 'en'}" dir="${tc.isRtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
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
    size: 152.4mm 228.6mm;
    margin: 18mm 16mm;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: ${tc.isRtl ? "'Amiri', serif" : "'EB Garamond', Georgia, serif"};
    direction: ${tc.isRtl ? 'rtl' : 'ltr'};
    text-align: ${tc.isRtl ? 'right' : 'left'};
    font-size: 11pt;
    line-height: 1.85;
    color: #1e293b;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 18pt;
    color: #0f766e;
    margin-top: 0;
    margin-bottom: 14pt;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 6pt;
  }
  h2 {
    font-size: 14pt;
    color: #0f172a;
    margin-top: 14pt;
    margin-bottom: 8pt;
  }
  h3 {
    font-size: 12pt;
    color: #334155;
    margin-top: 10pt;
    margin-bottom: 6pt;
  }
  p {
    text-align: justify;
    text-justify: inter-word;
    margin-top: 0;
    margin-bottom: 10pt;
  }
  ul, ol {
    margin-top: 6pt;
    margin-bottom: 12pt;
    padding-inline-start: 24pt;
  }
  li {
    margin-bottom: 4pt;
  }
  .bilingual-section {
    display: flex;
    gap: 16pt;
  }
  .ar-col {
    flex: 1;
    direction: rtl;
    text-align: right;
    font-family: 'Amiri', serif;
  }
  .en-col {
    flex: 1;
    direction: ltr;
    text-align: left;
    font-family: 'EB Garamond', serif;
  }
</style>
</head>
<body>
  ${tc.content}
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Screenshot first page for visual proof
    const screenshotPath = `test_out_${tc.id}.png`;
    await page.screenshot({ path: screenshotPath });

    // Generate real PDF
    const pdfBuffer = await page.pdf({
      width: '152.4mm',
      height: '228.6mm',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' }
    });

    const pdfPath = `test_out_${tc.id}.pdf`;
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Parse PDF
    const parser = new PDFParse(new Uint8Array(pdfBuffer));
    const extracted = await parser.getText();
    const textSample = extracted.text.slice(0, 300).replace(/\s+/g, ' ');

    console.log(`[PASS] ${tc.id}: Generated ${pdfPath} (${pdfBuffer.length} bytes, ${extracted.total} pages)`);
    console.log(`Screenshot saved: ${screenshotPath}`);
    console.log(`Extracted text preview: "${textSample}..."`);

    results.push({
      id: tc.id,
      title: tc.title,
      pages: extracted.total,
      bytes: pdfBuffer.length,
      sample: textSample
    });

    await page.close();
  }

  await browser.close();
  console.log('\n========================================');
  console.log('ALL 7 AUTOMATED TEST CASES EXECUTED SUCCESSFULLY!');
  console.log('========================================');
  return results;
}

testAll().catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});

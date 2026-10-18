import { VisualType } from '../types';

export interface VisualAsset {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  visualType: VisualType;
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:4';
  url: string;
  description: string;
  descriptionAr: string;
  tags: string[];
  theme: 'tech' | 'heritage' | 'business' | 'science' | 'general';
}

export const VISUAL_ASSETS: VisualAsset[] = [
  {
    id: 'tech-ai-cover-masterpiece',
    title: 'Autonomous Neural Network Core',
    titleAr: 'جوهر الشبكات العصبية والذكاء الاصطناعي',
    category: 'Technology & STEM',
    visualType: 'editorial_illustration',
    aspectRatio: '3:4',
    url: '/assets/images/tech_ai_cover_1792360786835.jpg',
    description: 'Luminous neural network core converging with geometric crystalline architectural lattice in deep indigo and cobalt.',
    descriptionAr: 'جوهر شبكة عصبية مضيئة تلتقي مع بنية بلورية هندسية بألوان الأزرق الكوبالت والنيلي.',
    tags: ['ai', 'neural network', 'technology', 'agents', 'cover', 'stem'],
    theme: 'tech',
  },
  {
    id: 'arabic-heritage-cover-masterpiece',
    title: 'Classical Arabesque Manuscript Illumination',
    titleAr: 'تذهيب وزخارف المخطوطات الأندلسية التراثية',
    category: 'History & Genealogy',
    visualType: 'editorial_illustration',
    aspectRatio: '3:4',
    url: '/assets/images/arabic_heritage_cover_1792360788309.jpg',
    description: 'Intricate arabesque Islamic geometric patterns with gold leaf filigree and antique parchment texture.',
    descriptionAr: 'زخارف هندسية إسلامية مذهبة مع تفاصيل التوريق العربي ونسيج الورق العاجي التاريخي.',
    tags: ['arabic', 'heritage', 'history', 'islamic art', 'cover', 'manuscript'],
    theme: 'heritage',
  },
  {
    id: 'luxury-business-cover-masterpiece',
    title: 'Architectural Executive Invariant',
    titleAr: 'الصرح المعماري للقيادة الاستراتيجية',
    category: 'Business & Leadership',
    visualType: 'photorealistic',
    aspectRatio: '3:4',
    url: '/assets/images/luxury_business_cover_1792360789095.jpg',
    description: 'Minimalist modern architectural sculpture in brushed titanium and warm stone with champagne gold lighting.',
    descriptionAr: 'منحوتة معمارية تجريدية من التيتانيوم المصقول والحجر الدافئ مع إضاءة ذهبية هادئة.',
    tags: ['business', 'leadership', 'strategy', 'executive', 'luxury', 'cover'],
    theme: 'business',
  },
  {
    id: 'ai-agents-system-diagram',
    title: 'Autonomous AI Agent System Architecture',
    titleAr: 'المخطط الهندسي لأنظمة الوكلاء الذاتية',
    category: 'Technology & STEM',
    visualType: 'technical_diagram',
    aspectRatio: '16:9',
    url: '/assets/images/ai_agents_diagram_1792360790515.jpg',
    description: 'High-precision technical publication schematic showing cognitive reasoning loop, perception engine, dynamic vector memory, and execution nodes.',
    descriptionAr: 'مخطط هندسي عالي الدقة يوضح حلقة الاستدلال المعرفي، محرك الإدراك، وقواعد البيانات الشعاعية.',
    tags: ['diagram', 'architecture', 'agents', 'ai', 'technical', 'chapter'],
    theme: 'tech',
  },
  {
    id: 'historical-astronomy-scholars',
    title: 'Islamic Golden Age Astronomical Observatory',
    titleAr: 'علماء الفلك والمخطوطات في مرصد الحضارة الإسلامية',
    category: 'History & Genealogy',
    visualType: 'editorial_illustration',
    aspectRatio: '16:9',
    url: '/assets/images/historical_astronomy_scene_1792360789067.jpg',
    description: 'Historical scholars examining brass astrolabes, celestial globes, and star maps in a lantern-lit courtyard.',
    descriptionAr: 'مشهد تاريخي وثائقي لعلماء الفلك وهم يفحصون الأسطرلاب النحاسي وخرائط النجوم في باحة المرصد.',
    tags: ['history', 'astronomy', 'al-zahrawi', 'scholars', 'manuscripts', 'chapter'],
    theme: 'heritage',
  },
];

/**
 * Generates an authoritative deterministic technical diagram as an SVG Data URL.
 * Separates diagrammatic layout from text labels and supports Arabic RTL.
 */
export function generateDeterministicDiagram(params: {
  title: string;
  subtitle?: string;
  type: 'architecture' | 'flowchart' | 'comparison' | 'timeline';
  nodes: Array<{ id: string; label: string; role?: string; color?: string }>;
  isRtl?: boolean;
}): string {
  const { title, subtitle, nodes, isRtl } = params;
  const width = 800;
  const height = 450;

  const nodeWidth = 180;
  const nodeHeight = 85;
  const count = Math.min(nodes.length, 3);
  const gap = (width - count * nodeWidth) / (count + 1);

  const nodeElements = nodes.slice(0, 3).map((node, idx) => {
    const x = isRtl
      ? width - (gap * (idx + 1) + nodeWidth * (idx + 1))
      : gap * (idx + 1) + nodeWidth * idx;
    const y = 180;
    const accentColor = node.color || '#0F766E';

    return `
      <g transform="translate(${x}, ${y})">
        <rect width="${nodeWidth}" height="${nodeHeight}" rx="12" fill="#1E293B" stroke="${accentColor}" stroke-width="2.5" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.4))"/>
        <rect x="0" y="0" width="${nodeWidth}" height="28" rx="12" fill="${accentColor}" opacity="0.2"/>
        <text x="${nodeWidth / 2}" y="20" fill="${accentColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" text-anchor="middle" letter-spacing="0.5">TIER ${idx + 1}</text>
        <text x="${nodeWidth / 2}" y="52" fill="#F8FAFC" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">${node.label.replace(/[<>&"]/g, '')}</text>
        ${node.role ? `<text x="${nodeWidth / 2}" y="72" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">${node.role.replace(/[<>&"]/g, '')}</text>` : ''}
      </g>
    `;
  }).join('');

  // Connector arrows
  let connectors = '';
  if (count > 1) {
    for (let i = 0; i < count - 1; i++) {
      const startX = gap * (i + 1) + nodeWidth * (i + 1);
      const endX = gap * (i + 2) + nodeWidth * (i + 1);
      const midY = 180 + nodeHeight / 2;
      connectors += `
        <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}" stroke="#10B981" stroke-width="3" stroke-dasharray="4 4"/>
        <polygon points="${endX},${midY} ${endX - 8},${midY - 5} ${endX - 8},${midY + 5}" fill="#10B981"/>
      `;
    }
  }

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grid-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B132B"/>
        <stop offset="50%" stop-color="#1C2541"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grid-bg)"/>
    <rect width="${width}" height="${height}" fill="url(#grid)"/>

    <!-- Outer frame -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="#334155" stroke-width="1.5"/>

    <!-- Header bar -->
    <rect x="30" y="30" width="${width - 60}" height="70" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
    <text x="${width / 2}" y="62" fill="#F8FAFC" font-family="system-ui, sans-serif" font-weight="extrabold" font-size="18" text-anchor="middle" letter-spacing="0.5">${title.replace(/[<>&"]/g, '')}</text>
    ${subtitle ? `<text x="${width / 2}" y="85" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">${subtitle.replace(/[<>&"]/g, '')}</text>` : ''}

    <!-- Connectors and Nodes -->
    ${connectors}
    ${nodeElements}

    <!-- Footer metadata tag -->
    <rect x="30" y="${height - 55}" width="${width - 60}" height="32" rx="6" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
    <text x="${isRtl ? width - 50 : 50}" y="${height - 35}" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" text-anchor="${isRtl ? 'end' : 'start'}">
      ${isRtl ? 'نظام النشر المعرفي BookCraft AI • مخطط هيكلي معياري' : 'BookCraft Publishing Engine • Deterministic Architectural Model'}
    </text>
    <text x="${isRtl ? 50 : width - 50}" y="${height - 35}" fill="#10B981" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="${isRtl ? 'start' : 'end'}">
      VERIFIED SCHEMA ✓
    </text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

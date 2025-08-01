// Local prompt generation utilities as fallback when Edge Functions are not available

export interface PromptData {
  subjectAndSetting: string;
  lighting: string;
  style: string;
  mood: string;
  'post-processing': string;
  enhancement: string;
}

export interface GeneratedPromptResult {
  prompt: string;
  negativePrompt: string;
}

// Advanced prompt templates
const PROMPT_TEMPLATES = {
  photography: {
    base: "{main_description}, {lighting}, {style} style, {mood} mood",
    professional: "Professional {style} of {main_description}. {lighting} creating {mood} atmosphere. Shot with high-end camera equipment, {post-processing}, detailed composition",
    cinematic: "Cinematic {style} featuring {main_description}. {lighting} with {mood} ambiance. Professional color grading, {post-processing}, film-like quality",
    artistic: "Artistic {style} portrait of {main_description}. {lighting} with {mood} expression. Creative composition, {post-processing}, fine art photography"
  },
  enhancement: {
    natural: "natural skin texture with visible pores, realistic soft lighting, authentic expression, candid moment, unretouched quality, balanced facial features, organic textures",
    professional: "professional studio lighting with natural shadows, polished composition, commercial photography quality, balanced exposure, symmetrical features, realistic skin texture",
    dramatic: "cinematic lighting with natural contrast, moody atmosphere, dramatic but realistic shadows, authentic emotional expression, natural facial proportions",
    soft: "soft diffused natural lighting, gentle realistic shadows, warm organic tones, intimate atmosphere, natural skin variations, authentic textures",
    vibrant: "vibrant natural colors, dynamic realistic lighting, energetic composition, natural contrasts, authentic visual impact, realistic material properties"
  }
};

const NEGATIVE_PROMPT_ELEMENTS = [
  "rendered appearance", "digital art aesthetics", "CGI-like features", "smooth perfect skin",
  "artificial lighting effects", "overly stylized features", "plastic-like skin texture",
  "airbrushed appearance", "synthetic materials", "glossy shiny skin", "cartoon-like qualities",
  "illustration style", "painting-like effects", "fantasy elements", "surreal characteristics",
  "overly saturated colors", "artificial enhancement", "digital manipulation appearance",
  "computer-generated look", "polished retouched aesthetic", "fake appearance", "synthetic look",
  "overly processed", "artificial perfection", "digital artifacts", "unrealistic proportions",
  "stylized rendering", "blur", "distorted features", "text", "watermark"
];

export function generatePromptLocally(promptData: PromptData): GeneratedPromptResult {
  try {
    // Validate input data
    if (!promptData) {
      throw new Error('Prompt data is required');
    }
    
    const { subjectAndSetting, lighting, style, mood } = promptData;
    
    // Validate required fields
    if (!subjectAndSetting?.trim()) {
      throw new Error('Subject and setting description is required');
    }
    if (!lighting?.trim()) {
      throw new Error('Lighting selection is required');
    }
    if (!style?.trim()) {
      throw new Error('Style selection is required');
    }
    if (!mood?.trim()) {
      throw new Error('Mood selection is required');
    }
    
    // Choose template based on style
    let template = PROMPT_TEMPLATES.photography.base;
    
    if (style.toLowerCase().includes('professional') || style.toLowerCase().includes('headshot')) {
      template = PROMPT_TEMPLATES.photography.professional;
    } else if (style.toLowerCase().includes('cinematic') || style.toLowerCase().includes('dramatic')) {
      template = PROMPT_TEMPLATES.photography.cinematic;
    } else if (style.toLowerCase().includes('fine art') || style.toLowerCase().includes('portrait')) {
      template = PROMPT_TEMPLATES.photography.artistic;
    }
    
    // Build the main prompt
    let prompt = template
      .replace('{main_description}', subjectAndSetting.trim())
      .replace('{lighting}', lighting.toLowerCase().trim())
      .replace('{style}', style.toLowerCase().trim())
      .replace('{mood}', mood.toLowerCase().trim())
      .replace('{post-processing}', promptData['post-processing']?.trim() || 'natural color grading');
    
    // Add enhancements
    const enhancementType = determineEnhancementType(style, mood, lighting);
    const enhancement = PROMPT_TEMPLATES.enhancement[enhancementType];
    if (enhancement) {
      prompt += `, ${enhancement}`;
    }
    
    // Add technical details
    prompt += ", shot on professional camera, 85mm lens, shallow depth of field";
    
    // Add enhancement codes if provided
    if (promptData.enhancement?.trim()) {
      prompt += `, ${promptData.enhancement.trim()}`;
    }
    
    // Generate negative prompt
    const negativePrompt = NEGATIVE_PROMPT_ELEMENTS.join(', ');
    
    // Validate output
    if (!prompt.trim()) {
      throw new Error('Generated prompt is empty');
    }
    
    return {
      prompt: prompt.trim(),
      negativePrompt: negativePrompt
    };
    
  } catch (error) {
    console.error('Error in generatePromptLocally:', error);
    throw error instanceof Error ? error : new Error('Unknown error in local prompt generation');
  }
}

function determineEnhancementType(style: string, mood: string, lighting: string): keyof typeof PROMPT_TEMPLATES.enhancement {
  const styleStr = style.toLowerCase();
  const moodStr = mood.toLowerCase();
  const lightingStr = lighting.toLowerCase();
  
  if (styleStr.includes('professional') || styleStr.includes('commercial')) {
    return 'professional';
  } else if (moodStr.includes('dramatic') || moodStr.includes('intense') || lightingStr.includes('dramatic')) {
    return 'dramatic';
  } else if (moodStr.includes('soft') || moodStr.includes('gentle') || lightingStr.includes('soft')) {
    return 'soft';
  } else if (moodStr.includes('vibrant') || moodStr.includes('energetic') || moodStr.includes('bright')) {
    return 'vibrant';
  } else {
    return 'natural';
  }
}

// Enhanced prompt generation with multiple variations
export function generatePromptVariations(promptData: PromptData, count: number = 3): GeneratedPromptResult[] {
  const variations: GeneratedPromptResult[] = [];
  const templates = Object.values(PROMPT_TEMPLATES.photography);
  
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const template = templates[i];
    let prompt = template
      .replace('{main_description}', promptData.subjectAndSetting)
      .replace('{lighting}', promptData.lighting.toLowerCase())
      .replace('{style}', promptData.style.toLowerCase())
      .replace('{mood}', promptData.mood.toLowerCase())
      .replace('{post-processing}', promptData['post-processing'] || 'natural color grading');
    
    // Add variation-specific enhancements
    const enhancementTypes = Object.keys(PROMPT_TEMPLATES.enhancement) as Array<keyof typeof PROMPT_TEMPLATES.enhancement>;
    const enhancement = PROMPT_TEMPLATES.enhancement[enhancementTypes[i % enhancementTypes.length]];
    prompt += `, ${enhancement}`;
    
    if (promptData.enhancement) {
      prompt += `, ${promptData.enhancement}`;
    }
    
    variations.push({
      prompt: prompt,
      negativePrompt: NEGATIVE_PROMPT_ELEMENTS.join(', ')
    });
  }
  
  return variations;
}

export function enhancePromptWithCategory(prompt: string, category: string, level: number): string {
  const categoryEnhancements: Record<string, string[]> = {
    'Natural Photography': [
      'natural lighting',
      'authentic expression, natural skin texture',
      'candid moment, realistic details, unretouched quality',
      'documentary style, genuine emotion, natural environment',
      'photojournalistic approach, real-world setting, authentic atmosphere'
    ],
    'Professional Portrait': [
      'studio lighting',
      'professional headshot, polished look',
      'commercial photography, perfect exposure, professional grade',
      'high-end portrait session, expert lighting setup, premium quality',
      'luxury portrait photography, master photographer style, exhibition quality'
    ],
    'Fashion & Beauty': [
      'fashion lighting',
      'beauty photography, glamorous styling',
      'high fashion shoot, designer aesthetic, editorial quality',
      'luxury fashion photography, professional makeup, designer wardrobe',
      'haute couture photography, runway quality, international fashion standards'
    ],
    'Lifestyle & Candid': [
      'lifestyle photography',
      'candid moments, natural interaction',
      'authentic lifestyle, real-world scenarios, genuine connections',
      'documentary lifestyle, spontaneous captures, authentic storytelling',
      'premium lifestyle photography, luxury living, aspirational moments'
    ],
    'Commercial & Brand': [
      'commercial photography',
      'brand photography, marketing quality',
      'corporate headshots, professional branding, commercial grade',
      'premium brand photography, executive portraits, luxury commercial',
      'flagship commercial photography, international brand standards, premium quality'
    ]
  };
  
  const enhancements = categoryEnhancements[category] || categoryEnhancements['Natural Photography'];
  const enhancementLevel = Math.max(0, Math.min(level, enhancements.length - 1));
  
  return `${prompt}, ${enhancements[enhancementLevel]}`;
}
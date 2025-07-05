import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Camera, Palette, Sparkles, Settings, Copy, Image as ImageIcon, Plus, Sliders, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { PromptTag } from '../types';

interface PromptSection {
  title: string;
  fields: PromptField[];
}

interface PromptField {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
}

const AVAILABLE_TAGS: PromptTag[] = [
  '3D',
  'Animals',
  'Anime',
  'Architecture',
  'Character',
  'Fashion',
  'Food',
  'Graphics',
  'Illustration',
  'Photography',
  'Product',
  'Sci-Fi',
  'Adobe Firefly',
  'ChatGPT',
  'ChatGPT / OpenAI',
  'Claude / Anthropic',
  'DALL-E (OpenAI)',
  'Digen Ai',
  'FreePik',
  'Gemini / Google AI',
  'Grok / xAI',
  'HeyGen',
  'Leonardo Ai',
  'Llama / Meta AI',
  'Luma AI',
  'Midjourney',
  'Mistral AI',
  'Pika Labs',
  'Playground AI',
  'Prompt Builder',
  'Runway',
  'Sora (OpenAI)',
  'Stable Diffusion',
  'Synthesia'  
];

// Master IMG Cheat Codes organized by category
const IMG_CHEAT_CODES = {
  'Product Photography': [
    "hyperreal product render, ultra sharp, 85mm lens, studio lighting, perfect reflections, HDRI, glossy surface",
    "product shot, floating, softbox lighting, subtle shadows, sharp focus, f/2.8, commercial advertising style",
    "packaging mockup, photorealistic texture, sharp embossing, natural shadows, studio white background",
    "macro shot, extreme detail, 100mm macro lens, crisp textures, depth of field, focus stacking effect",
    "hero product shot, cinematic lighting, studio environment, reflection plane, ultra high-res textures"
  ],
  'Portrait Photography': [
    "portrait, cinematic lighting, Sony A7R IV, 85mm lens, Rembrandt lighting, flawless skin texture",
    "beauty shot, glossy lips, catchlight in eyes, skin pores visible, soft beauty dish lighting",
    "medium close-up, f/1.4 aperture, warm skin tones, realistic hair strands, realistic freckles",
    "close-up portrait, shallow depth of field, cinematic bokeh, high-end fashion makeup",
    "realistic skin rendering, HDR lighting, subsurface scattering, natural skin imperfections visible"
  ],
  'Fashion Editorial': [
    "Vogue fashion shoot, full-body, studio cyclorama, soft spotlight, luxury outfit details",
    "street style fashion shoot, candid walking pose, urban backdrop, overcast natural lighting",
    "editorial glamour, high gloss fashion, high-end heels, glossy fabric textures, depth of field",
    "high-fashion lookbook, pastel backgrounds, 50mm lens, crisp color separation, wardrobe focus",
    "luxury catalog photo, jewelry reflections, macro fabric texture, expensive vibe"
  ],
  'Cinematic Style': [
    "cinematic poster style, dramatic lighting, wide-angle lens, depth haze, intense color grading",
    "hero shot, backlit subject, glowing rim light, dark moody atmosphere, sharp facial contrast",
    "movie teaser poster, dynamic diagonal composition, atmosphere particles, realistic shadows",
    "RED Komodo 6K cinematic sensor, perfect skin tones, movie-grade lighting",
    "cinematic color grading, teal & orange, subtle LUT applied, film grain overlay"
  ],
  'Camera & Lighting': [
    "Sony A7R IV, G-Master lens, f/1.2 aperture, ISO 100, ultra sharp focus",
    "Canon EOS R5, 85mm f/1.2 RF lens, creamy bokeh, edge-to-edge sharpness",
    "Zeiss Otus 100mm f/1.4, extreme lens clarity, flawless micro-contrast",
    "global illumination, indirect bounce lighting, realistic light interaction",
    "studio lighting rig: key light + fill light + hair light, soft rim lighting"
  ],
  'Realism Overdrive': [
    "4K hyperrealism, photoreal skin pores, highly detailed, volumetric lighting, HDR rendering",
    "skin subsurface scattering enabled, realistic skin translucency, highly natural tones",
    "CGI-to-photoreal hybrid render, global shading accuracy, no waxy skin, no cartoon filter",
    "ray traced reflections enabled, light bounce accuracy, perfect metallic surfaces",
    "master realism pack: physically accurate materials, light interaction, natural shadows, optical realism"
  ]
};

const PromptBuilder: React.FC = () => {
  // ... rest of the component code ...
};

export default PromptBuilder;
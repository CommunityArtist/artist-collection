import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wand2, Camera, Palette, Sparkles, Settings, Copy, Image as ImageIcon, Plus, Sliders, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { PromptTag } from '../types';

interface PromptSection {
  title: string;
  fields: PromptField[];
  icon: React.ReactNode;
  description: string;
}

interface PromptField {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
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
    "professional product photography, studio lighting setup with key and fill lights, clean white background",
    "commercial product shot, 85mm lens, f/8 aperture, perfect focus, minimal shadows, high-end catalog style",
    "product showcase, softbox lighting, natural reflections, sharp details, professional color accuracy",
    "macro product detail, 100mm macro lens, extreme sharpness, texture emphasis, controlled lighting",
    "hero product image, cinematic quality, studio environment, professional grade photography"
  ],
  'Portrait Photography': [
    "professional portrait, Canon EOS R5, 85mm f/1.4 lens, natural skin texture, authentic lighting",
    "environmental portrait, golden hour lighting, shallow depth of field, natural expression, real skin detail",
    "studio portrait, controlled lighting setup, soft shadows, natural skin tones, professional quality",
    "candid portrait style, natural makeup, authentic expression, visible skin texture, warm lighting",
    "headshot photography, 85mm lens, f/2.8 aperture, professional lighting, natural skin rendering"
  ],
  'Fashion Editorial': [
    "high fashion editorial, professional studio lighting, designer clothing focus, editorial composition",
    "fashion photography, 85mm lens, dramatic lighting, fabric texture detail, professional styling",
    "editorial fashion shoot, controlled environment, luxury brand aesthetic, professional model pose",
    "fashion catalog photography, clean lighting, color accuracy, fabric detail, commercial quality",
    "designer fashion showcase, studio setup, professional lighting, high-end fashion photography"
  ],
  'Cinematic Style': [
    "cinematic photography, dramatic lighting, film-like quality, professional color grading",
    "movie-style portrait, cinematic composition, dramatic shadows, professional film aesthetic",
    "cinematic lighting setup, dramatic mood, film photography style, professional cinematography",
    "film-inspired photography, cinematic color palette, dramatic lighting, movie-quality image",
    "professional cinematic style, dramatic composition, film-like lighting, cinema photography"
  ],
  'Camera & Lighting': [
    "professional camera setup, Canon EOS R5, 85mm f/1.4 lens, optimal settings, sharp focus",
    "Sony A7R IV, professional lens, perfect exposure, natural lighting, high image quality",
    "studio lighting setup, key light and fill light, professional photography equipment",
    "natural lighting, golden hour, soft shadows, professional camera settings, optimal exposure",
    "professional photography setup, controlled lighting, high-end camera equipment, perfect focus"
  ],
  'Natural Realism': [
    "natural photography, authentic skin texture, real lighting conditions, unprocessed natural look",
    "photographic realism, natural skin detail, authentic lighting, real camera characteristics",
    "natural portrait photography, authentic human features, real skin texture, natural lighting",
    "realistic photography, natural materials, authentic shadows, real-world lighting physics",
    "natural photographic style, authentic skin tones, real lighting interaction, genuine photography"
  ]
};

const PromptBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const [sections, setSections] = useState<PromptSection[]>([
    {
      title: 'Subject & Style',
      icon: <Wand2 className="w-5 h-5" />,
      description: 'Define the main subject and artistic style',
      fields: [
        { label: 'Main Subject', value: '', placeholder: 'e.g., a majestic lion, futuristic cityscape, portrait of a woman', required: true },
        { label: 'Art Style', value: '', placeholder: 'e.g., photorealistic, oil painting, digital art, watercolor' },
        { label: 'Mood/Atmosphere', value: '', placeholder: 'e.g., dramatic, serene, mysterious, vibrant' }
      ]
    },
    {
      title: 'Visual Details',
      icon: <Camera className="w-5 h-5" />,
      description: 'Specify colors, lighting, and composition',
      fields: [
        { label: 'Color Palette', value: '', placeholder: 'e.g., warm earth tones, vibrant neon colors, monochromatic blue' },
        { label: 'Lighting', value: '', placeholder: 'e.g., golden hour, studio lighting, dramatic shadows' },
        { label: 'Composition', value: '', placeholder: 'e.g., close-up, wide angle, rule of thirds, symmetrical' }
      ]
    },
    {
      title: 'Technical Settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'Camera and rendering specifications',
      fields: [
        { label: 'Camera/Lens', value: '', placeholder: 'e.g., 85mm lens, macro photography, wide-angle shot' },
        { label: 'Quality/Resolution', value: '', placeholder: 'e.g., 8K, ultra-detailed, high resolution, sharp focus' },
        { label: 'Rendering Style', value: '', placeholder: 'e.g., octane render, unreal engine, ray tracing' }
      ]
    }
  ]);

  const updateField = (sectionIndex: number, fieldIndex: number, value: string) => {
    setSections(prev => prev.map((section, sIdx) => 
      sIdx === sectionIndex 
        ? {
            ...section,
            fields: section.fields.map((field, fIdx) => 
              fIdx === fieldIndex ? { ...field, value } : field
            )
          }
        : section
    ));
  };

  const generatePrompt = () => {
    const allFields = sections.flatMap(section => section.fields);
    const filledFields = allFields.filter(field => field.value.trim());
    
    if (filledFields.length === 0) {
      setError('Please fill in at least one field to generate a prompt.');
      return '';
    }

    const promptParts = filledFields.map(field => field.value.trim());
    return promptParts.join(', ');
  };

  const handleTagToggle = (tag: PromptTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSavePrompt = async () => {
    const prompt = generatePrompt();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { error: saveError } = await supabase
        .from('prompts')
        .insert({
          title: `Generated Prompt - ${new Date().toLocaleDateString()}`,
          prompt,
          tags: selectedTags,
          user_id: user.id,
          is_private: false
        });

      if (saveError) throw saveError;

      navigate('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const insertCheatCode = (code: string, sectionIndex: number, fieldIndex: number) => {
    const currentValue = sections[sectionIndex].fields[fieldIndex].value;
    const newValue = currentValue ? `${currentValue}, ${code}` : code;
    updateField(sectionIndex, fieldIndex, newValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-2xl shadow-lg">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI Prompt Builder
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Create detailed, professional prompts for AI image generation with our guided builder
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Prompt Sections */}
            <div className="lg:col-span-2 space-y-6">
              {sections.map((section, sectionIndex) => (
                <div key={section.title} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-purple-600">
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.label}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="relative">
                          <textarea
                            value={field.value}
                            onChange={(e) => updateField(sectionIndex, fieldIndex, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                            rows={2}
                          />
                          {/* Cheat Code Suggestions */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(IMG_CHEAT_CODES).map(([category, codes]) => (
                              <div key={category} className="relative group">
                                <button
                                  type="button"
                                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                                >
                                  {category}
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                  <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                                    {codes.map((code, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => insertCheatCode(code, sectionIndex, fieldIndex)}
                                        className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded border border-gray-100 transition-colors"
                                      >
                                        {code}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Tags Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tags & Categories</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Generated Prompt Preview */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Generated Prompt</h3>
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[120px]">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {generatePrompt() || 'Start filling in the fields to see your prompt preview...'}
                  </p>
                </div>

                {selectedTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => copyToClipboard(generatePrompt())}
                    disabled={!generatePrompt()}
                    className="w-full flex items-center justify-center space-x-2"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Prompt</span>
                  </Button>

                  <Button
                    onClick={handleSavePrompt}
                    disabled={!generatePrompt() || isLoading}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isLoading ? 'Saving...' : 'Save to Library'}</span>
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                  Pro Tips
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Be specific with your subject description
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Use the cheat codes for professional results
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Combine multiple styles for unique effects
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Add technical details for higher quality
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && generatedImageUrl && (
        <ImageViewerModal
          imageUrl={generatedImageUrl}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </div>
  );
};

export default PromptBuilder;
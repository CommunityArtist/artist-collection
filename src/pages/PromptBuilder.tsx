import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wand2, Camera, Palette, Sparkles, Settings, Copy, Image as ImageIcon, Plus, Sliders, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Download, Grid3X3 } from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { PromptTag, ExtractedPrompt } from '../types';

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
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);

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

  // Effect to handle extracted prompt data from location state
  useEffect(() => {
    const extractedData = location.state?.extractedPromptData as ExtractedPrompt;
    
    if (extractedData) {
      // Map extracted data to form fields
      setSections(prevSections => prevSections.map(section => {
        if (section.title === 'Subject & Style') {
          return {
            ...section,
            fields: section.fields.map(field => {
              if (field.label === 'Main Subject') {
                return { ...field, value: extractedData.mainPrompt || '' };
              } else if (field.label === 'Art Style') {
                return { ...field, value: extractedData.styleElements?.join(', ') || '' };
              } else if (field.label === 'Mood/Atmosphere') {
                return { ...field, value: extractedData.mood || '' };
              }
              return field;
            })
          };
        } else if (section.title === 'Visual Details') {
          return {
            ...section,
            fields: section.fields.map(field => {
              if (field.label === 'Color Palette') {
                return { ...field, value: extractedData.colorPalette?.join(', ') || '' };
              } else if (field.label === 'Lighting') {
                return { ...field, value: extractedData.lighting || '' };
              } else if (field.label === 'Composition') {
                return { ...field, value: extractedData.composition || '' };
              }
              return field;
            })
          };
        } else if (section.title === 'Technical Settings') {
          return {
            ...section,
            fields: section.fields.map(field => {
              if (field.label === 'Camera/Lens') {
                const cameraLens = [extractedData.camera, extractedData.lens].filter(Boolean).join(', ');
                return { ...field, value: cameraLens };
              } else if (field.label === 'Quality/Resolution') {
                return { ...field, value: extractedData.technicalDetails?.join(', ') || '' };
              }
              return field;
            })
          };
        }
        return section;
      }));

      // Clear the location state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const getGeneratedPromptText = () => {
    const allFields = sections.flatMap(section => section.fields);
    const filledFields = allFields.filter(field => field.value.trim());
    
    if (filledFields.length === 0) {
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
    const prompt = getGeneratedPromptText();
    if (!prompt) {
      setError('Please fill in at least one field to generate a prompt.');
      return;
    }

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

  const handleGenerate4Images = async () => {
    const prompt = getGeneratedPromptText();
    if (!prompt) {
      setError('Please fill in at least one field to generate images.');
      return;
    }

    setIsGeneratingImages(true);
    setError(null);
    setGeneratedImages([]);
    setGenerationProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate images');
      }

      const imageUrls: string[] = [];

      // Generate 4 images sequentially
      for (let i = 0; i < 4; i++) {
        try {
          setGenerationProgress(((i) / 4) * 100);
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ 
              prompt: prompt,
              imageDimensions: '1:1',
              numberOfImages: 1
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to generate image ${i + 1}`);
          }

          if (data.imageUrl) {
            imageUrls.push(data.imageUrl);
            setGeneratedImages([...imageUrls]); // Update state with current images
          }
        } catch (imageError) {
          console.error(`Error generating image ${i + 1}:`, imageError);
          // Continue with other images if one fails
        }
      }

      setGenerationProgress(100);

      if (imageUrls.length === 0) {
        throw new Error('Failed to generate any images');
      }

      setGeneratedImages(imageUrls);

    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing.';
        } else if (error.message.includes('authentication')) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGeneratingImages(false);
      setGenerationProgress(0);
    }
  };

  const insertCheatCode = (code: string, sectionIndex: number, fieldIndex: number) => {
    const currentValue = sections[sectionIndex].fields[fieldIndex].value;
    const newValue = currentValue ? `${currentValue}, ${code}` : code;
    updateField(sectionIndex, fieldIndex, newValue);
  };

  const handleImageDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => Math.min(generatedImages.length - 1, prev + 1));
  };

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-soft-lavender mb-6">
            <span className="text-electric-cyan">AI</span> Prompt Builder
          </h1>
          <p className="text-soft-lavender/70 text-lg max-w-2xl mx-auto">
            Create detailed, professional prompts for AI image generation with our guided builder
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Prompt Sections */}
            <div className="lg:col-span-2 space-y-6">
              {sections.map((section, sectionIndex) => (
                <div key={section.title} className="bg-card-bg rounded-2xl shadow-lg border border-border-color overflow-hidden">
                  <div className="bg-deep-bg px-6 py-4 border-b border-border-color">
                    <div className="flex items-center space-x-3">
                      <div className="text-electric-cyan">
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-soft-lavender">{section.title}</h3>
                        <p className="text-sm text-soft-lavender/70">{section.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.label}>
                        <label className="block text-sm font-medium text-soft-lavender mb-2">
                          {field.label}
                          {field.required && <span className="text-cosmic-purple ml-1">*</span>}
                        </label>
                        <div className="relative">
                          <textarea
                            value={field.value}
                            onChange={(e) => updateField(sectionIndex, fieldIndex, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-3 bg-deep-bg border border-border-color rounded-lg text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none transition-all duration-200"
                            rows={2}
                          />
                          {/* Cheat Code Suggestions */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(IMG_CHEAT_CODES).map(([category, codes]) => (
                              <div key={category} className="relative group">
                                <button
                                  type="button"
                                  className="text-xs px-2 py-1 bg-electric-cyan/20 text-electric-cyan rounded-full hover:bg-electric-cyan/30 transition-colors"
                                >
                                  {category}
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-80 bg-card-bg border border-border-color rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                  <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                                    {codes.map((code, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => insertCheatCode(code, sectionIndex, fieldIndex)}
                                        className="w-full text-left text-xs p-2 text-soft-lavender/80 hover:bg-cosmic-purple/10 rounded border border-border-color transition-colors"
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
              <div className="bg-card-bg rounded-2xl shadow-lg border border-border-color p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Palette className="w-5 h-5 text-electric-cyan" />
                  <h3 className="text-lg font-semibold text-soft-lavender">Tags & Categories</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-electric-cyan text-deep-bg shadow-md font-semibold'
                          : 'bg-card-bg border border-border-color text-soft-lavender hover:bg-electric-cyan/10 hover:border-electric-cyan/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Images Gallery */}
              {generatedImages.length > 0 && (
                <div className="bg-card-bg rounded-2xl shadow-lg border border-border-color p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Grid3X3 className="w-5 h-5 text-electric-cyan" />
                    <h3 className="text-lg font-semibold text-soft-lavender">Generated Images</h3>
                    <span className="text-sm text-soft-lavender/70">({generatedImages.length}/4)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105"
                          onClick={() => openImageViewer(index)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageDownload(imageUrl, index);
                            }}
                            className="bg-black/50 border-white/20 text-white hover:bg-white/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Placeholder slots for remaining images */}
                    {Array.from({ length: 4 - generatedImages.length }).map((_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className="aspect-square bg-deep-bg border-2 border-dashed border-border-color rounded-lg flex items-center justify-center"
                      >
                        <div className="text-center text-soft-lavender/50">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Image {generatedImages.length + index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Generated Prompt Preview */}
              <div className="bg-card-bg rounded-2xl shadow-lg border border-border-color p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-soft-lavender">Generated Prompt</h3>
                  <Sparkles className="w-5 h-5 text-electric-cyan" />
                </div>
                
                <div className="bg-deep-bg rounded-lg p-4 mb-4 min-h-[120px]">
                  <p className="text-soft-lavender/80 text-sm leading-relaxed">
                    {getGeneratedPromptText() || 'Start filling in the fields to see your prompt preview...'}
                  </p>
                </div>

                {selectedTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-soft-lavender mb-2">Selected Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-electric-cyan/20 text-electric-cyan rounded text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Generate 4 Images Button */}
                  <Button
                    onClick={handleGenerate4Images}
                    disabled={!getGeneratedPromptText() || isGeneratingImages}
                    className="w-full flex items-center justify-center space-x-2"
                    variant="primary"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>
                      {isGeneratingImages 
                        ? `Generating... ${Math.round(generationProgress)}%` 
                        : 'Generate 4 Images'
                      }
                    </span>
                  </Button>

                  {/* Progress Bar */}
                  {isGeneratingImages && (
                    <div className="w-full bg-deep-bg rounded-full h-2">
                      <div 
                        className="bg-electric-cyan h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => copyToClipboard(getGeneratedPromptText())}
                    disabled={!getGeneratedPromptText()}
                    className="w-full flex items-center justify-center space-x-2"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Prompt</span>
                  </Button>

                  <Button
                    onClick={handleSavePrompt}
                    disabled={!getGeneratedPromptText() || isLoading}
                    className="w-full flex items-center justify-center space-x-2"
                    variant="outline"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isLoading ? 'Saving...' : 'Save to Library'}</span>
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-500">{error}</p>
                      {error.includes('OpenAI API key') && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/api-config')}
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                          >
                            Configure API Key
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-cosmic-purple/10 to-electric-cyan/10 rounded-2xl p-6 border border-cosmic-purple/20">
                <h4 className="font-semibold text-soft-lavender mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 text-electric-cyan mr-2" />
                  Pro Tips
                </h4>
                <ul className="text-sm text-soft-lavender/70 space-y-2">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Be specific with your subject description
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Use the cheat codes for professional results
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Generate 4 images to compare variations
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Add technical details for higher quality
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && generatedImages.length > 0 && (
        <ImageViewerModal
          images={generatedImages}
          currentIndex={currentImageIndex}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          onDownload={handleImageDownload}
        />
      )}
    </div>
  );
};

export default PromptBuilder;
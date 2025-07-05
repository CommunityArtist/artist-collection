import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Camera, Palette, Sparkles, Settings, Copy, Image as ImageIcon, Plus, Sliders, RefreshCw, AlertCircle } from 'lucide-react';
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
  const navigate = useNavigate();
  const [sections, setSections] = useState<PromptSection[]>([
    {
      title: 'Core Elements',
      fields: [
        { 
          label: 'Subject', 
          value: '', 
          placeholder: 'Describe the main subject in detail (e.g., "a confident woman with long red hair")',
          required: true
        },
        { 
          label: 'Setting', 
          value: '', 
          placeholder: 'Where is the subject located? (e.g., "lounging on a cream-colored couch in a cozy studio")',
          required: true
        },
        { 
          label: 'Lighting', 
          value: '', 
          placeholder: 'Describe the lighting conditions (e.g., "warm ambient lighting with soft shadows")',
          required: true
        }
      ]
    },
    {
      title: 'Artistic Direction',
      fields: [
        { 
          label: 'Style', 
          value: '', 
          placeholder: 'What artistic style should be used? (e.g., "glamour photography with cinematic qualities")',
          required: true
        },
        { 
          label: 'Mood', 
          value: '', 
          placeholder: 'What emotions or atmosphere should be conveyed? (e.g., "playful and intimate yet sophisticated")',
          required: true
        },
        { 
          label: 'Color Palette', 
          value: '', 
          placeholder: 'Specify the main colors (e.g., "warm tones with blush pink, cream, and gold accents")'
        }
      ]
    },
    {
      title: 'Technical Details',
      fields: [
        { 
          label: 'Camera Settings', 
          value: '', 
          placeholder: 'Specify camera and lens details (e.g., "shot on Canon EOS R5 with 85mm f/1.2 lens")'
        },
        { 
          label: 'Post-Processing', 
          value: '', 
          placeholder: 'Describe any specific post-processing effects (e.g., "subtle grain, enhanced skin tones")'
        },
        { 
          label: 'Additional Details', 
          value: '', 
          placeholder: 'Any other specific requirements or references'
        }
      ]
    }
  ]);
  
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptNotes, setPromptNotes] = useState('');
  const [promptSref, setPromptSref] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageDimensions, setImageDimensions] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  // Image viewer modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Enhancement slider state
  const [enhanceLevel, setEnhanceLevel] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Portrait Photography');

  const dimensionOptions = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '2:3 (Portrait)', value: '2:3' },
    { label: '3:2 (Landscape)', value: '3:2' },
    { label: '4:5 (Portrait)', value: '4:5' },
    { label: '16:9 (Widescreen)', value: '16:9' },
    { label: '9:16 (Vertical)', value: '9:16' }
  ];

  const imageCountOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleFieldChange = (sectionIndex: number, fieldIndex: number, value: string) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields[fieldIndex].value = value;
    setSections(newSections);
  };

  const validateFields = () => {
    const requiredFields: string[] = [];
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !field.value.trim()) {
          requiredFields.push(field.label);
        }
      });
    });
    
    if (requiredFields.length > 0) {
      throw new Error(`Please fill in the required fields: ${requiredFields.join(', ')}`);
    }
  };

  const buildPromptData = () => {
    const data: Record<string, string | number> = {};
    sections.forEach(section => {
      section.fields.forEach(field => {
        data[field.label.toLowerCase()] = field.value.trim();
      });
    });
    
    // Add enhancement data
    data.enhanceLevel = enhanceLevel;
    data.selectedCategory = selectedCategory;
    data.imageDimensions = imageDimensions;
    data.numberOfImages = numberOfImages;
    
    return data;
  };

  const getEnhancementCodes = () => {
    if (enhanceLevel === 0) return '';
    
    const categoryCheatCodes = IMG_CHEAT_CODES[selectedCategory as keyof typeof IMG_CHEAT_CODES] || [];
    const numCodes = Math.min(enhanceLevel, categoryCheatCodes.length);
    
    return categoryCheatCodes.slice(0, numCodes).join(', ');
  };

  const generateMetadata = async (prompt: string, promptData: any) => {
    try {
      setIsGeneratingMetadata(true);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ prompt, promptData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate metadata');
      }

      // Auto-fill the form fields
      setPromptTitle(data.title);
      setPromptNotes(data.notes);
      setPromptSref(data.sref);

    } catch (error) {
      console.error('Error generating metadata:', error);
      // Don't throw error here, just log it - metadata generation is optional
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCopySuccess(false);
      setGeneratedImages([]);
      setSaveSuccess(false);
      
      // Clear previous metadata
      setPromptTitle('');
      setPromptNotes('');
      setPromptSref('');

      validateFields();

      const promptData = buildPromptData();
      
      // Add enhancement codes if slider is active
      const enhancementCodes = getEnhancementCodes();
      if (enhancementCodes) {
        promptData.enhancement = enhancementCodes;
      }

      // Generate text prompt
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(promptData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      setGeneratedPrompt(data.prompt);

      // Generate image
      setIsGeneratingImage(true);
      
      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate images');
      }

      const imageResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          prompt: data.prompt,
          imageDimensions: imageDimensions,
          numberOfImages: numberOfImages
        }),
      });

      const imageData = await imageResponse.json();

      if (!imageResponse.ok) {
        throw new Error(imageData.error || 'Failed to generate image');
      }

      // Handle multiple images or single image
      if (imageData.imageUrls && imageData.imageUrls.length > 0) {
        setGeneratedImages(imageData.imageUrls); // Store all generated images
      } else {
        setGeneratedImages(imageData.imageUrl ? [imageData.imageUrl] : []);
      }
      
      setIsGeneratingImage(false);

      // Auto-generate metadata after successful image generation
      await generateMetadata(data.prompt, promptData);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (generatedPrompt) {
      try {
        await navigator.clipboard.writeText(generatedPrompt);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleRegenerateMetadata = async () => {
    if (generatedPrompt) {
      const promptData = buildPromptData();
      await generateMetadata(generatedPrompt, promptData);
    }
  };

  const handleAddPrompt = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!promptTitle) {
        throw new Error('Please enter a title for the prompt');
      }

      if (!generatedPrompt || generatedImages.length === 0) {
        throw new Error('Please generate a prompt and image first');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { error: saveError } = await supabase
        .from('prompts')
        .insert({
          title: promptTitle,
          prompt: generatedPrompt,
          notes: promptNotes,
          sref: promptSref,
          media_url: generatedImages[0], // Save the first image as the main media
          user_id: user.id,
          tags: selectedTags,
          is_private: false
        });

      if (saveError) throw saveError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      // Clear the form
      setPromptTitle('');
      setPromptNotes('');
      setPromptSref('');
      setSelectedTags([]);
      setImageDimensions('1:1');
      setNumberOfImages(1);
      setGeneratedImages([]);

    } catch (error) {
      console.error('Error saving prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const handleModalPrevious = () => {
    setCurrentImageIndex(prev => Math.max(0, prev - 1));
  };

  const handleModalNext = () => {
    setCurrentImageIndex(prev => Math.min(generatedImages.length - 1, prev + 1));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSectionIcon = (title: string) => {
    switch (title) {
      case 'Core Elements':
        return <Camera className="w-5 h-5" />;
      case 'Artistic Direction':
        return <Palette className="w-5 h-5" />;
      case 'Technical Details':
        return <Settings className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-deep-bg pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prompt Builder Form */}
          <div className="space-y-8">
            {sections.map((section, sectionIndex) => (
              <div 
                key={section.title}
                className="bg-card-bg rounded-lg p-6 border border-border-color"
              >
                <div className="flex items-center gap-2 mb-6">
                  {getSectionIcon(section.title)}
                  <h2 className="text-xl font-bold text-soft-lavender">{section.title}</h2>
                </div>
                
                <div className="space-y-6">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={field.label}>
                      <label className="block text-soft-lavender mb-2">
                        {field.label}
                        {field.required && <span className="text-cosmic-purple ml-1">*</span>}
                      </label>
                      <textarea
                        className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none"
                        rows={6}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Enhancement Slider Section */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center gap-2 mb-6">
                <Sliders className="w-5 h-5 text-electric-cyan" />
                <h2 className="text-xl font-bold text-soft-lavender">Image Enhancement</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-soft-lavender mb-2">Enhancement Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                  >
                    {Object.keys(IMG_CHEAT_CODES).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-soft-lavender mb-2">
                    Enhancement Level: {enhanceLevel}/5
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={enhanceLevel}
                      onChange={(e) => setEnhanceLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-deep-bg rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #7B3FEE 0%, #7B3FEE ${(enhanceLevel / 5) * 100}%, #1A1F35 ${(enhanceLevel / 5) * 100}%, #1A1F35 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-soft-lavender/50 mt-1">
                      <span>Off</span>
                      <span>Basic</span>
                      <span>Enhanced</span>
                      <span>Pro</span>
                      <span>Ultra</span>
                      <span>Master</span>
                    </div>
                  </div>
                </div>

                {enhanceLevel > 0 && (
                  <div className="bg-deep-bg rounded-lg p-4">
                    <h3 className="text-sm font-medium text-soft-lavender mb-2">Active Enhancement Codes:</h3>
                    <div className="text-xs text-soft-lavender/70 space-y-1">
                      {IMG_CHEAT_CODES[selectedCategory as keyof typeof IMG_CHEAT_CODES]
                        ?.slice(0, enhanceLevel)
                        .map((code, index) => (
                          <div key={index} className="p-2 bg-cosmic-purple/10 rounded text-cosmic-purple">
                            {code}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image Settings Section */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="w-5 h-5 text-electric-cyan" />
                <h2 className="text-xl font-bold text-soft-lavender">Image Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Dimensions */}
                <div>
                  <label className="block text-soft-lavender mb-3 font-medium">Image Dimensions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {dimensionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setImageDimensions(option.value)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                          imageDimensions === option.value
                            ? 'bg-cosmic-purple border-cosmic-purple text-soft-lavender'
                            : 'bg-deep-bg border-border-color text-soft-lavender/70 hover:border-cosmic-purple/40 hover:text-soft-lavender'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Images */}
                <div>
                  <label className="block text-soft-lavender mb-3 font-medium">Number of Images</label>
                  <div className="grid grid-cols-3 gap-2">
                    {imageCountOptions.map((count) => (
                      <button
                        key={count}
                        onClick={() => setNumberOfImages(count)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                          numberOfImages === count
                            ? 'bg-electric-cyan border-electric-cyan text-deep-bg'
                            : 'bg-deep-bg border-border-color text-soft-lavender/70 hover:border-electric-cyan/40 hover:text-soft-lavender'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Info */}
              <div className="mt-6 p-4 bg-deep-bg rounded-lg border border-border-color">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-soft-lavender/70">Selected Configuration:</span>
                  <div className="flex items-center gap-4">
                    <span className="text-electric-cyan font-medium">
                      {dimensionOptions.find(opt => opt.value === imageDimensions)?.label}
                    </span>
                    <span className="text-soft-lavender/50">•</span>
                    <span className="text-cosmic-purple font-medium">
                      {numberOfImages} image{numberOfImages > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {(imageDimensions === '2:3' || imageDimensions === '3:2' || imageDimensions === '4:5') && (
                  <div className="mt-2 text-xs text-soft-lavender/50">
                    Note: DALL-E 3 will generate this as 1:1 (square) format
                  </div>
                )}
                {numberOfImages > 1 && (
                  <div className="mt-2 text-xs text-soft-lavender/50">
                    Note: Images will be generated sequentially (may take longer)
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={isLoading || isGeneratingImage}
            >
              <Wand2 className="w-5 h-5 mr-2" />
              {isLoading ? 'Generating Prompt...' : isGeneratingImage ? 'Generating Image...' : 'Generate'}
            </Button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-red-500 text-sm">{error}</p>
                    {error.includes('OpenAI API key') && (
                      <div className="mt-3">
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
              </div>
            )}
          </div>
          
          {/* Generated Content Preview */}
          <div className="space-y-8">
            {/* Prompt Preview */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-soft-lavender">Generated Prompt</h2>
                {generatedPrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPrompt}
                    className={`transition-colors duration-300 ${
                      copySuccess ? 'bg-success-green/20 text-success-green' : ''
                    }`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copySuccess ? 'Copied!' : 'Copy Prompt'}
                  </Button>
                )}
              </div>
              <div className="bg-deep-bg border border-border-color rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                {generatedPrompt ? (
                  <p className="text-soft-lavender whitespace-pre-wrap">{generatedPrompt}</p>
                ) : (
                  <div className="text-soft-lavender/50 text-center">
                    {isLoading ? 'Generating prompt...' : 'Generated prompt will appear here'}
                  </div>
                )}
              </div>
            </div>

            {/* Image Preview */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-soft-lavender">
                  Generated Image{generatedImages.length > 1 ? 's' : ''}
                  {generatedImages.length > 0 && (
                    <span className="text-sm text-soft-lavender/70 ml-2">
                      ({generatedImages.length} of {numberOfImages})
                    </span>
                  )}
                </h2>
              </div>
              <div className="bg-deep-bg border border-border-color rounded-lg overflow-hidden">
                {generatedImages.length > 0 ? (
                  <div className={`grid gap-4 p-4 ${
                    generatedImages.length === 1 
                      ? 'grid-cols-1' 
                      : generatedImages.length === 2 
                        ? 'grid-cols-2' 
                        : generatedImages.length <= 4 
                          ? 'grid-cols-2' 
                          : 'grid-cols-3'
                  }`}>
                    {generatedImages.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className={`relative group cursor-pointer ${
                          generatedImages.length === 1 ? 'aspect-square' : 'aspect-square'
                        }`}
                        onClick={() => handleImageClick(index)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated artwork ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {index + 1}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg cursor-pointer"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            Click to view
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full aspect-square flex flex-col items-center justify-center text-soft-lavender/50 p-4">
                    {isGeneratingImage ? (
                      <>
                        <div className="animate-spin mb-4">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <p>Generating {numberOfImages} image{numberOfImages > 1 ? 's' : ''}...</p>
                        <p className="text-xs mt-2">This may take a few moments</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mb-4" />
                        <p>Generated image{numberOfImages > 1 ? 's' : ''} will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Prompt Form */}
            {generatedPrompt && generatedImages.length > 0 && (
              <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-soft-lavender">Save to Library</h2>
                  {isGeneratingMetadata && (
                    <div className="flex items-center text-electric-cyan text-sm">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating metadata...
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-soft-lavender">
                        Title <span className="text-cosmic-purple">*</span>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateMetadata}
                        disabled={isGeneratingMetadata}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                    <input
                      type="text"
                      value={promptTitle}
                      onChange={(e) => setPromptTitle(e.target.value)}
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                      placeholder="Enter a title for your prompt"
                    />
                  </div>

                  <div>
                    <label className="block text-soft-lavender mb-2">Notes</label>
                    <textarea
                      value={promptNotes}
                      onChange={(e) => setPromptNotes(e.target.value)}
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none"
                      rows={3}
                      placeholder="Add any notes about the prompt (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-soft-lavender mb-2">SREF Number</label>
                    <input
                      type="text"
                      value={promptSref}
                      onChange={(e) => setPromptSref(e.target.value)}
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                      placeholder="Enter SREF number (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-soft-lavender mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTags(prev => 
                            prev.includes(tag) 
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-cosmic-purple text-soft-lavender'
                              : 'bg-cosmic-purple/10 text-soft-lavender/70 hover:bg-cosmic-purple/20'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleAddPrompt}
                    disabled={isSaving}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {isSaving ? 'Saving...' : 'Add to Library'}
                  </Button>

                  {saveSuccess && (
                    <div className="bg-success-green/10 border border-success-green/20 rounded-lg p-4">
                      <p className="text-success-green text-sm">Prompt saved successfully!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={generatedImages}
        currentIndex={currentImageIndex}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onPrevious={handleModalPrevious}
        onNext={handleModalNext}
        onDownload={handleDownloadImage}
      />
    </div>
  );
};

export default PromptBuilder;
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wand2, Camera, Palette, Sparkles, Settings, Copy, Image as ImageIcon, Plus, Sliders, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { PromptTag } from '../types';
import ImageViewerModal from '../components/ImageViewerModal';

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
  const location = useLocation();
  const [sections, setSections] = useState<PromptSection[]>([
    {
      title: 'Core Elements',
      icon: <Camera className="w-5 h-5" />,
      description: 'Detailed description of the main subject including physical attributes, pose, and expression',
      fields: [
        { 
          label: 'Main Subject', 
          value: '', 
          placeholder: 'young woman with long auburn hair, wearing a flowing mauve sundress',
          required: true
        },
        { 
          label: 'Physical Attributes', 
          value: '', 
          placeholder: 'detailed facial features, natural skin texture, authentic expression',
          required: true
        },
        { 
          label: 'Pose & Expression', 
          value: '', 
          placeholder: 'serene reflective expression, left hand holding sunflower, right hand on collarbone',
          required: true
        },
        { 
          label: 'Clothing & Accessories', 
          value: '', 
          placeholder: 'straw hat with black floral embroidery, simple pendant necklace, silver bracelet'
        }
      ]
    },
    {
      title: 'Environment & Setting',
      description: 'Location, time of day, atmospheric elements, and surrounding environment',
      fields: [
        { 
          label: 'Location & Setting', 
          value: '', 
          placeholder: 'sunflower field in full summer bloom, tall flowers in symmetrical rows',
          required: true
        },
        { 
          label: 'Time & Atmosphere', 
          value: '', 
          placeholder: 'golden hour lighting, soft natural light, overcast sky',
          required: true
        },
        { 
          label: 'Background Elements', 
          value: '', 
          placeholder: 'narrow dirt path, blurred treeline in distance, natural depth'
        }
      ]
    },
    {
      title: 'Technical Photography',
      description: 'Camera specifications, lens details, and technical photography settings',
      fields: [
        { 
          label: 'Camera & Lens', 
          value: '', 
          placeholder: 'Canon EOS R5, 85mm f/1.4 lens, professional camera setup',
          type: 'select',
          options: [
            'Canon EOS R5, 85mm f/1.4 lens',
            'Sony A7R IV, 85mm f/1.2 lens', 
            'Nikon Z9, 85mm f/1.8 lens',
            'Canon EOS R6, 50mm f/1.2 lens',
            'Sony A7 III, 85mm f/1.8 lens'
          ]
        },
        { 
          label: 'Camera Settings', 
          value: '', 
          placeholder: 'f/1.8 aperture, 1/400s shutter speed, ISO 100, daylight white balance'
        },
        { 
          label: 'Lighting Setup', 
          value: '', 
          placeholder: 'natural golden hour lighting, soft shadows, warm natural light'
        }
      ]
    },
    {
      title: 'Artistic Style & Mood',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Artistic direction, mood, color palette, and overall aesthetic',
      fields: [
        { 
          label: 'Photography Style', 
          value: '', 
          placeholder: 'natural portrait photography, environmental portrait, authentic style',
          required: true,
          type: 'select',
          options: [
            'Natural Portrait Photography',
            'Environmental Portrait',
            'Studio Portrait',
            'Lifestyle Photography',
            'Fashion Portrait',
            'Artistic Portrait'
          ]
        },
        { 
          label: 'Mood & Atmosphere', 
          value: '', 
          placeholder: 'serene and contemplative, warm nostalgic feeling, peaceful summer mood',
          required: true
        },
        { 
          label: 'Color Palette', 
          value: '', 
          placeholder: 'warm natural tones, golden hour colors, soft earth tones'
        }
      ]
    },
    {
      title: 'Post-Processing & Quality',
      icon: <Camera className="w-5 h-5" />,
      description: 'Post-processing style, quality settings, and final image characteristics',
      fields: [
        { 
          label: 'Post-Processing Style', 
          value: '', 
          placeholder: 'natural color grading, minimal retouching, authentic skin texture'
        },
        { 
          label: 'Quality & Detail', 
          value: '', 
          placeholder: 'high resolution, sharp focus, natural skin detail, professional quality'
        },
        { 
          label: 'Special Effects', 
          value: '', 
          placeholder: 'subtle vignette, natural depth of field, soft background blur'
        }
      ]
    }
  ]);
  
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  const [showImageModal, setShowImageModal] = useState(false);
  // Image viewer state
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  
  // Enhancement slider state
  const [enhanceLevel, setEnhanceLevel] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Natural Realism');

  const dimensionOptions = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '2:3 (Portrait)', value: '2:3' },
    { label: '3:2 (Landscape)', value: '3:2' },
    { label: '4:5 (Portrait)', value: '4:5' },
    { label: '16:9 (Widescreen)', value: '16:9' },
    { label: '9:16 (Vertical)', value: '9:16' }
  ];

  const imageCountOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Handle extracted prompt data from prompt extractor
  useEffect(() => {
    const extractedPromptData = location.state?.extractedPromptData;
    if (extractedPromptData) {
      console.log('Received extracted prompt data:', extractedPromptData);
      
      // Pre-fill form fields with extracted data
      const newSections = [...sections];
      
      // Core Elements section (index 0)
      newSections[0].fields[0].value = extractedPromptData.mainPrompt || ''; // Subject
      newSections[0].fields[1].value = extractedPromptData.composition || ''; // Setting
      newSections[0].fields[2].value = extractedPromptData.lighting || ''; // Lighting
      
      // Artistic Direction section (index 1)
      newSections[1].fields[0].value = extractedPromptData.styleElements?.join(', ') || ''; // Style
      newSections[1].fields[1].value = extractedPromptData.mood || ''; // Mood
      newSections[1].fields[2].value = extractedPromptData.colorPalette?.join(', ') || ''; // Color Palette
      
      // Technical Details section (index 2)
      const cameraLensInfo = extractedPromptData.camera && extractedPromptData.lens 
        ? `Shot on ${extractedPromptData.camera} with ${extractedPromptData.lens}`
        : '';
      newSections[2].fields[0].value = cameraLensInfo; // Camera Settings
      
      const additionalDetails = [
        extractedPromptData.technicalDetails?.join(', '),
        extractedPromptData.audioVibe ? `Audio Vibe: ${extractedPromptData.audioVibe}` : ''
      ].filter(Boolean).join('. ');
      
      newSections[2].fields[2].value = additionalDetails; // Additional Details
      
      setSections(newSections);
      
      // Clear the location state to prevent re-filling on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Effect to handle transferred data from Prompt Extractor
  React.useEffect(() => {
    const extractedData = location.state?.extractedPromptData;
    if (extractedData) {
      // Map extracted data to form fields
      const newSections = [...sections];
      
      // Core Elements section (index 0)
      if (newSections[0]) {
        // Extract subject from main prompt (first sentence usually contains the main subject)
        const mainPromptSentences = extractedData.mainPrompt.split('.').filter(s => s.trim());
        const subjectDescription = mainPromptSentences[0] || extractedData.mainPrompt.substring(0, 200);
        
        newSections[0].fields[0].value = subjectDescription; // Main Subject
        
        // Try to extract physical attributes from style elements or main prompt
        const physicalAttributes = extractedData.styleElements
          .filter(element => element.toLowerCase().includes('detail') || element.toLowerCase().includes('texture') || element.toLowerCase().includes('skin'))
          .join(', ') || 'Natural skin texture, authentic expression, detailed features';
        newSections[0].fields[1].value = physicalAttributes; // Physical Attributes
        
        // Extract pose/expression info from composition or mood
        newSections[0].fields[2].value = extractedData.composition.substring(0, 150) || 'Natural pose and expression'; // Pose & Expression
      }
      
      // Environment & Setting section (index 1)
      if (newSections[1]) {
        // Extract setting from main prompt (usually contains location info)
        const settingInfo = extractedData.mainPrompt.match(/(?:in|on|at|placed on|positioned in|standing in|sitting on)([^.]*)/i);
        const locationSetting = settingInfo ? settingInfo[1].trim() : 'Professional studio environment';
        newSections[1].fields[0].value = locationSetting; // Location & Setting
        
        // Use lighting info for time & atmosphere
        newSections[1].fields[1].value = extractedData.lighting; // Time & Atmosphere
        
        // Extract background elements from composition
        const backgroundInfo = extractedData.composition.includes('background') 
          ? extractedData.composition.split('background')[1].substring(0, 100)
          : 'Carefully composed background elements';
        newSections[1].fields[2].value = backgroundInfo; // Background Elements
      }
      
      // Technical Photography section (index 2)
      if (newSections[2]) {
        // Combine camera and lens
        const cameraLensCombo = `${extractedData.camera}, ${extractedData.lens}`;
        newSections[2].fields[0].value = cameraLensCombo; // Camera & Lens
        
        // Extract technical settings from technical details
        const technicalSettings = extractedData.technicalDetails
          .filter(detail => detail.toLowerCase().includes('setting') || detail.toLowerCase().includes('aperture') || detail.toLowerCase().includes('iso'))
          .join(', ') || 'Professional camera settings, optimal exposure';
        newSections[2].fields[1].value = technicalSettings; // Camera Settings
        
        newSections[2].fields[2].value = extractedData.lighting; // Lighting Setup
      }
      
      // Artistic Style & Mood section (index 3)
      if (newSections[3]) {
        // Use first style element as photography style
        const photographyStyle = extractedData.styleElements[0] || 'Natural Portrait Photography';
        newSections[3].fields[0].value = photographyStyle; // Photography Style
        
        newSections[3].fields[1].value = extractedData.mood; // Mood & Atmosphere
        
        // Join color palette
        newSections[3].fields[2].value = extractedData.colorPalette.join(', '); // Color Palette
      }
      
      // Post-Processing & Quality section (index 4)
      if (newSections[4]) {
        // Extract post-processing info from style elements
        const postProcessing = extractedData.styleElements
          .filter(element => element.toLowerCase().includes('processing') || element.toLowerCase().includes('grading') || element.toLowerCase().includes('color'))
          .join(', ') || 'Natural color grading, minimal retouching';
        newSections[4].fields[0].value = postProcessing; // Post-Processing Style
        
        // Use technical details for quality
        const qualityDetails = extractedData.technicalDetails
          .filter(detail => detail.toLowerCase().includes('quality') || detail.toLowerCase().includes('resolution') || detail.toLowerCase().includes('detail'))
          .join(', ') || 'High resolution, professional quality';
        newSections[4].fields[1].value = qualityDetails; // Quality & Detail
        
        // Use audio vibe for special effects
        newSections[4].fields[2].value = extractedData.audioVibe || 'Natural depth of field, subtle atmospheric effects'; // Special Effects
      }
      
      setSections(newSections);
      
      // Set appropriate tags based on extracted data
      const relevantTags: PromptTag[] = [];
      
      // Check style elements for relevant tags
      extractedData.styleElements.forEach((element: string) => {
        const lowerElement = element.toLowerCase();
        if (lowerElement.includes('photography')) relevantTags.push('Photography');
        if (lowerElement.includes('food')) relevantTags.push('Food');
        if (lowerElement.includes('portrait')) relevantTags.push('Photography');
        if (lowerElement.includes('product')) relevantTags.push('Product');
        if (lowerElement.includes('fashion')) relevantTags.push('Fashion');
        if (lowerElement.includes('architecture')) relevantTags.push('Architecture');
      });
      
      // Check technical details for AI platform tags
      extractedData.technicalDetails.forEach((detail: string) => {
        const lowerDetail = detail.toLowerCase();
        if (lowerDetail.includes('leonardo')) relevantTags.push('Leonardo Ai');
        if (lowerDetail.includes('midjourney')) relevantTags.push('Midjourney');
        if (lowerDetail.includes('dall-e') || lowerDetail.includes('dalle')) relevantTags.push('DALL-E (OpenAI)');
      });
      
      // Remove duplicates and set tags
      const uniqueTags = [...new Set(relevantTags)];
      setSelectedTags(uniqueTags);
      
      // Set enhancement category based on style
      const firstStyle = extractedData.styleElements[0]?.toLowerCase() || '';
      if (firstStyle.includes('portrait')) {
        setSelectedCategory('Portrait Photography');
      } else if (firstStyle.includes('product')) {
        setSelectedCategory('Product Photography');
      } else if (firstStyle.includes('fashion')) {
        setSelectedCategory('Fashion Editorial');
      } else if (firstStyle.includes('cinematic')) {
        setSelectedCategory('Cinematic Style');
      } else {
        setSelectedCategory('Natural Realism');
      }
      
      // Set a moderate enhancement level
      setEnhanceLevel(2);
      
      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    
    // Create a mapping from field labels to expected backend keys
    const fieldMapping: Record<string, string> = {
      'Main Subject': 'subject',
      'Physical Attributes': 'physical_attributes',
      'Pose & Expression': 'pose_expression',
      'Clothing & Accessories': 'clothing_accessories',
      'Location & Setting': 'setting',
      'Time & Atmosphere': 'time_atmosphere',
      'Background Elements': 'background_elements',
      'Camera & Lens': 'camera_lens',
      'Camera Settings': 'camera_settings',
      'Lighting Setup': 'lighting',
      'Photography Style': 'style',
      'Mood & Atmosphere': 'mood',
      'Color Palette': 'color_palette',
      'Post-Processing Style': 'post_processing',
      'Quality & Detail': 'quality_detail',
      'Special Effects': 'special_effects'
    };
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        const mappedKey = fieldMapping[field.label] || field.label.toLowerCase().replace(/\s+/g, '_');
        data[mappedKey] = field.value.trim();
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
      
      // Get the authenticated user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate metadata');
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
      setCurrentImageIndex(0);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate prompts');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
        setGeneratedImages(imageData.imageUrls);
        setGeneratedImage(imageData.imageUrls[0]); // Show first image in preview
        setGeneratedImages([imageData.imageUrl]);
        setGeneratedImages([imageData.imageUrl]);
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
          media_url: generatedImages[0], // Save the first image
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

    } catch (error) {
      console.error('Error saving prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageClick = () => {
    if (generatedImages.length > 0) {
      setCurrentImageIndex(0);
      setImageViewerOpen(true);
    }
  };

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < generatedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleImageDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.jpg`;
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

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < generatedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    // Create a direct download link to avoid CORS issues
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  {section.icon}
                  <h2 className="text-xl font-bold text-soft-lavender">{section.title}</h2>
                </div>
                
                <p className="text-soft-lavender/70 text-sm mb-6">{section.description}</p>
                
                <div className="space-y-6">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={field.label}>
                      <label className="block text-soft-lavender mb-2">
                        {field.label}
                        {field.required && <span className="text-cosmic-purple ml-1">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                          value={field.value}
                          onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
                        >
                          <option value="">{field.placeholder}</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'text' ? (
                        <input
                          type="text"
                          className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
                        />
                      ) : (
                        <textarea
                          className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none"
                          rows={4}
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Enhancement Slider Section */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center gap-2 mb-6">
                <Sliders className="w-5 h-5 text-electric-cyan" />
                <h2 className="text-xl font-bold text-soft-lavender">Professional Enhancement</h2>
              </div>
              
              <p className="text-soft-lavender/70 text-sm mb-6">
                Apply professional photography enhancement codes to improve realism and technical quality
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-soft-lavender mb-2">Photography Style Category</label>
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
                    Professional Enhancement Level: {enhanceLevel}/5
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
                      <span>Natural</span>
                      <span>Professional</span>
                      <span>Studio</span>
                      <span>Commercial</span>
                      <span>Master</span>
                    </div>
                  </div>
                </div>

                {enhanceLevel > 0 && (
                  <div className="bg-deep-bg rounded-lg p-4">
                    <h3 className="text-sm font-medium text-soft-lavender mb-2">Active Professional Codes:</h3>
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

            {/* Image Preview with Carousel */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-soft-lavender">Generated Images</h2>
                {generatedImages.length > 1 && (
                  <span className="text-soft-lavender/70 text-sm">
                    {currentImageIndex + 1} of {generatedImages.length}
                  </span>
                )}
              </div>
              
              <div className="bg-deep-bg border border-border-color rounded-lg overflow-hidden">
                {generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image Display */}
                    <div className="relative aspect-square group">
                      <img
                        src={generatedImages[currentImageIndex]}
                        alt={`Generated artwork ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setShowImageModal(true)}
                      />
                      
                      {/* Navigation Arrows for Multiple Images */}
                      {generatedImages.length > 1 && (
                        <>
                          <button
                            onClick={() => handleImageNavigation('prev')}
                            disabled={currentImageIndex === 0}
                            className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                              currentImageIndex === 0
                                ? 'bg-black/20 text-white/30 cursor-not-allowed'
                                : 'bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleImageNavigation('next')}
                            disabled={currentImageIndex === generatedImages.length - 1}
                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                              currentImageIndex === generatedImages.length - 1
                                ? 'bg-black/20 text-white/30 cursor-not-allowed'
                                : 'bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      {/* Download Button */}
                      <button
                        onClick={() => handleDownloadImage(generatedImages[currentImageIndex], currentImageIndex)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Thumbnail Strip for Multiple Images */}
                    {generatedImages.length > 1 && (
                      <div className="flex gap-2 p-4 overflow-x-auto">
                        {generatedImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => handleThumbnailClick(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              index === currentImageIndex
                                ? 'border-electric-cyan'
                                : 'border-transparent hover:border-cosmic-purple/40'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Progress Dots */}
                    {generatedImages.length > 1 && (
                      <div className="flex justify-center gap-2 pb-4">
                        {generatedImages.map((_, index) => (
                          <button
                            key={index}
                <h2 className="text-xl font-bold text-soft-lavender">
                  Generated Image{generatedImages.length > 1 ? 's' : ''}
                </h2>
                {generatedImages.length > 1 && (
                  <span className="text-soft-lavender/70 text-sm">
                    {generatedImages.length} images generated
                  </span>
                )}
                            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              <div 
                className="bg-deep-bg border border-border-color rounded-lg overflow-hidden aspect-square cursor-pointer relative group"
                onClick={handleImageClick}
              >
                            }`}
                  <>
                    <img
                      src={generatedImage}
                      alt="Generated artwork"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {generatedImages.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        1 of {generatedImages.length}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span className="text-white text-sm">Click to view full size</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center text-soft-lavender/50 p-4">
                    {isGeneratingImage ? (
                      <>
                        <div className="animate-spin mb-4">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <p>Generating images...</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mb-4" />
                        <p>Generated images will appear here</p>
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
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        onPrevious={() => handleImageNavigation('prev')}
        onNext={() => handleImageNavigation('next')}
        onDownload={handleImageDownload}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={generatedImages}
        currentIndex={currentImageIndex}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onPrevious={() => handleImageNavigation('prev')}
        onNext={() => handleImageNavigation('next')}
        onDownload={handleDownloadImage}
      />
    </div>
  );
};

export default PromptBuilder;
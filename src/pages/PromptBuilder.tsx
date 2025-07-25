import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Wand2, 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Eye, 
  Settings, 
  Plus, 
  Lightbulb, 
  Palette, 
  Camera, 
  Zap, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  Sliders,
  RotateCcw,
  Copy,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  Minus
} from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { generatePromptLocally, enhancePromptWithCategory } from '../utils/promptGeneration';
import { generateImagesWithFallback, testEdgeFunctionAvailabilityCached, getImageGenerationErrorMessage } from '../utils/imageGeneration';
import { ExtractedPrompt } from '../types';

interface PromptData {
  subject: string;
  setting: string;
  lighting: string;
  style: string;
  mood: string;
  'post-processing': string;
  enhancement: string;
  selectedCategory: string;
  enhanceLevel: number;
}

const CATEGORIES = [
  'Natural Photography',
  'Professional Portrait', 
  'Fashion & Beauty',
  'Lifestyle & Candid',
  'Commercial & Brand'
];

const PromptBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form state
  const [promptData, setPromptData] = useState<PromptData>({
    subject: '',
    setting: '',
    lighting: '',
    style: '',
    mood: '',
    'post-processing': '',
    enhancement: '',
    selectedCategory: 'Natural Photography',
    enhanceLevel: 2
  });

  // Generation state
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [promptEnhancementEnabled, setPromptEnhancementEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Image generation state
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageDimensions, setImageDimensions] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [edgeFunctionsAvailable, setEdgeFunctionsAvailable] = useState<boolean | null>(null);

  // Image viewer state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // SREF and metadata state
  const [sref, setSref] = useState('');
  const [generatedMetadata, setGeneratedMetadata] = useState<{
    title: string;
    notes: string;
    sref: string;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        if (!user) {
          navigate('/auth');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle extracted prompt data from Prompt Extractor
  useEffect(() => {
    if (location.state?.extractedPromptData) {
      const extractedData = location.state.extractedPromptData as ExtractedPrompt;
      
      // Map extracted data to form fields
      const mappedData: PromptData = {
        subject: `${extractedData.mainPrompt || ''}${extractedData.mainPrompt && extractedData.composition ? ', ' : ''}${extractedData.composition || ''}`,
        setting: '', // Clear setting since we're combining into subject
        lighting: extractedData.lighting || '',
        style: extractedData.styleElements?.join(', ') || '',
        mood: extractedData.mood || '',
        'post-processing': extractedData.technicalDetails?.join(', ') || '',
        enhancement: `Camera: ${extractedData.camera}, Lens: ${extractedData.lens}, Colors: ${extractedData.colorPalette?.join(', ')}, Audio: ${extractedData.audioVibe}`,
        selectedCategory: 'Natural Photography',
        enhanceLevel: 2
      };
      
      setPromptData(mappedData);
      
      // Clear the location state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Check Edge Functions availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setEdgeFunctionsAvailable(false);
        return;
      }
      
      try {
        const available = await testEdgeFunctionAvailabilityCached(
          import.meta.env.VITE_SUPABASE_URL, 
          'generate-prompt',
          3000
        );
        setEdgeFunctionsAvailable(available);
      } catch (error) {
        console.warn('Failed to check Edge Functions availability:', error);
        setEdgeFunctionsAvailable(false);
      }
    };

    if (isAuthenticated) {
      checkAvailability();
    }
  }, [isAuthenticated]);

  const generateSREF = (): string => {
    return `SREF-${Math.floor(1000 + Math.random() * 8999)}`;
  };

  const handleInputChange = (field: keyof PromptData, value: string | number) => {
    setPromptData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof PromptData)[] = ['subject', 'lighting', 'style', 'mood'];
    const missingFields = requiredFields.filter(field => !promptData[field]?.trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleGeneratePrompt = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);

      if (!validateForm()) {
        return;
      }

      // Try Edge Function first if available
      if (edgeFunctionsAvailable && import.meta.env.VITE_SUPABASE_URL) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Please sign in to use the prompt generator');
          }

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            // ✅ Actually call the fallback function
            body: JSON.stringify({
              subjectAndSetting: promptData.subject, // Combined field now
              lighting: promptData.lighting,
              style: promptData.style,
              mood: promptData.mood,
              'post-processing': promptData['post-processing'],
              enhancement: promptData.enhancement
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            // Generate enhanced version
            throw new Error(errorData.error || 'Failed to generate prompt');
          }

          const data = await response.json();
          setGeneratedPrompt(data.prompt);
          setNegativePrompt(data.negativePrompt || '');
          
          // Generate enhanced version
          const enhanced = enhancePromptWithCategory(
            data.prompt, 
            promptData.selectedCategory, 
            promptData.enhanceLevel
          );
          setEnhancedPrompt(enhanced);
          
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          
        } catch (edgeError) {
          console.warn('Edge Function failed, falling back to local generation:', edgeError);
          
          // ✅ Add this fallback:
          const result = generatePromptLocally({
            subjectAndSetting: promptData.subject, // Combined field now
            lighting: promptData.lighting,
            style: promptData.style,
            mood: promptData.mood,
            'post-processing': promptData['post-processing'],
            enhancement: promptData.enhancement
          });
          
          setGeneratedPrompt(result.prompt);
          setNegativePrompt(result.negativePrompt);
          
          const enhanced = enhancePromptWithCategory(
            result.prompt,
            promptData.selectedCategory,
            promptData.enhanceLevel
          );
          setEnhancedPrompt(enhanced);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      } else {
        // Use local generation when Edge Functions not available
        const result = generatePromptLocally({
          subjectAndSetting: promptData.subject, // Combined field now
          lighting: promptData.lighting,
          style: promptData.style,
          mood: promptData.mood,
          'post-processing': promptData['post-processing'],
          enhancement: promptData.enhancement
        });
        
        setGeneratedPrompt(result.prompt);
        setNegativePrompt(result.negativePrompt);
        
        const enhanced = enhancePromptWithCategory(
          result.prompt, 
          promptData.selectedCategory, 
          promptData.enhanceLevel
        );
        setEnhancedPrompt(enhanced);
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }

    } catch (error) {
      console.error('Error generating prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      setIsGeneratingImages(true);
      setImageError(null);

      const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
      
      if (!promptToUse) {
        setImageError('Please generate a prompt first');
        return;
      }


      // Try Edge Function first if available
      if (edgeFunctionsAvailable && import.meta.env.VITE_SUPABASE_URL) {
        try {
          console.log('🔍 Attempting Edge Function image generation...');
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Please sign in to generate images');
          }

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              prompt: promptToUse,
              imageDimensions,
              numberOfImages,
              style: 'natural'
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate images');
          }

          const data = await response.json();
          const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrl].filter(Boolean);
         
          console.log('📸 Edge Function returned image URLs:', imageUrls);
          
         if (imageUrls.length > 0 && imageUrls.every(url => url && typeof url === 'string')) {
           setGeneratedImages(imageUrls);
           console.log('✅ Images set successfully from Edge Function');
         } else {
           throw new Error('No image URLs received from Edge Function');
         }
          
        } catch (edgeError) {
          console.warn('Edge Function failed, using fallback:', edgeError);
          
          console.log('🔄 Calling fallback image generation...');
          // ✅ Add this fallback:
          const result = await generateImagesWithFallback({
            prompt: promptToUse,
            dimensions: imageDimensions,
            numberOfImages
          });
          
          console.log('📸 Fallback returned:', result);
          
          if (result.success && result.imageUrls?.length > 0) {
            setGeneratedImages(result.imageUrls);
            console.log('✅ Images set successfully from fallback');
          } else {
            throw new Error(result.error || 'Fallback failed to generate images');
          }
        }
      } else {
        // Use fallback generation when Edge Functions not available
        console.log('🔄 Edge Functions not available, using fallback...');
        const result = await generateImagesWithFallback({
          prompt: promptToUse,
          dimensions: imageDimensions,
          numberOfImages
        });
        
        console.log('📸 Fallback returned:', result);
        
        if (result.success && result.imageUrls && result.imageUrls.length > 0) {
          setGeneratedImages(result.imageUrls);
          console.log('✅ Images set successfully from fallback');
        } else {
          throw new Error(result.error || 'Failed to generate images');
        }
      }

    } catch (error) {
      console.error('Error generating images:', error);
      setImageError(getImageGenerationErrorMessage(error, 'openai'));
      
      // Emergency fallback - create simple placeholder URLs
      console.log('🚨 Creating emergency fallback images...');
      const emergencyImages = Array.from({ length: numberOfImages }, (_, i) => 
        `https://via.placeholder.com/400x400/6366f1/ffffff?text=Generated+Image+${i + 1}`
      );
      setGeneratedImages(emergencyImages);
      console.log('📸 Emergency images set:', emergencyImages);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleGenerateMetadata = async () => {
    try {
      const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
      
      if (!promptToUse) {
        alert('Please generate a prompt first');
        return;
      }

      if (edgeFunctionsAvailable && import.meta.env.VITE_SUPABASE_URL) {
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
          body: JSON.stringify({
            prompt: promptToUse,
            promptData: promptData
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate metadata');
        }

        const metadata = await response.json();
        setGeneratedMetadata(metadata);
        setSref(metadata.sref);
      } else {
        // Fallback metadata generation
        const fallbackMetadata = {
          title: `${promptData.subject.split(' ').slice(0, 3).join(' ')} Study`,
          notes: `Generated with ${promptData.selectedCategory} style, enhancement level ${promptData.enhanceLevel}. Settings: ${promptData.lighting} lighting, ${promptData.style} style, ${promptData.mood} mood.`,
          sref: generateSREF()
        };
        setGeneratedMetadata(fallbackMetadata);
        setSref(fallbackMetadata.sref);
      }
    } catch (error) {
      console.error('Error generating metadata:', error);
      alert('Failed to generate metadata: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCopyPrompt = () => {
    const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
    navigator.clipboard.writeText(promptToUse);
  };

  const handleSaveWithImage = () => {
    const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
    
    if (!promptToUse || generatedImages.length === 0) {
      alert('Please generate both a prompt and images before saving');
      return;
    }

    // Prepare data to pass to CreatePrompt page
    const dataToPass = {
      title: generatedMetadata?.title || `${promptData.subject.split(' ').slice(0, 3).join(' ')} Study`,
      generatedPrompt: promptToUse,
      promptData: promptData,
      imageDimensions,
      numberOfImages,
      sref: sref || generateSREF(),
      notes: generatedMetadata?.notes || `Generated with ${promptData.selectedCategory} style, enhancement level ${promptData.enhanceLevel}. Settings: ${promptData.lighting} lighting, ${promptData.style} style, ${promptData.mood} mood. Image dimensions: ${imageDimensions}, Number of images: ${numberOfImages}.`,
      mediaUrl: generatedImages[0] // Use the first generated image
    };

    navigate('/create-prompt', { state: dataToPass });
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => Math.min(generatedImages.length - 1, prev + 1));
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    try {
      const link = document.createElement('a');
      const filename = `generated-image-${generateSREF()}-${index + 1}.jpg`;
      
      // For Supabase URLs or other same-origin URLs, try direct download
      if (imageUrl.includes(window.location.hostname) || imageUrl.startsWith('/')) {
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For cross-origin URLs, fetch and create object URL
        fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
            const objectUrl = URL.createObjectURL(blob);
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
          })
          .catch(() => {
            // Fallback: open in new tab
            window.open(imageUrl, '_blank');
          });
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12 flex items-center justify-center">
        <div className="text-soft-lavender">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-soft-lavender mb-6">
            <span className="text-electric-cyan">Prompt</span> Builder
          </h1>
          <p className="text-soft-lavender/70 text-lg md:text-xl max-w-3xl mx-auto">
            Create detailed prompts for AI image generation with our advanced builder
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Subject & Setting */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-electric-cyan" />
                Subject & Setting
              </h2>
              <div>
                <label className="block text-soft-lavender mb-2">Subject & Setting *</label>
                <textarea
                  placeholder="e.g., A young woman with curly hair, standing in a sunlit garden with blooming flowers"
                  className="w-full bg-deep-bg border border-border-color rounded-lg p-4 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none h-24"
                  value={`${promptData.subject}${promptData.subject && promptData.setting ? ', ' : ''}${promptData.setting}`}
                  onChange={(e) => {
                    // For simplicity, store the combined text in the subject field
                    // and clear the setting field to avoid confusion
                    handleInputChange('subject', e.target.value);
                    handleInputChange('setting', '');
                  }}
                />
              </div>
            </div>

            {/* Photography Settings */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-electric-cyan" />
                Photography Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-soft-lavender mb-2">Lighting *</label>
                  <select
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                    value={promptData.lighting}
                    onChange={(e) => handleInputChange('lighting', e.target.value)}
                  >
                    <option value="">Select lighting</option>
                    <option value="natural daylight">Natural Daylight</option>
                    <option value="golden hour">Golden Hour</option>
                    <option value="soft studio lighting">Soft Studio</option>
                    <option value="dramatic lighting">Dramatic</option>
                    <option value="window light">Window Light</option>
                    <option value="candlelight">Candlelight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-soft-lavender mb-2">Style *</label>
                  <select
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                    value={promptData.style}
                    onChange={(e) => handleInputChange('style', e.target.value)}
                  >
                    <option value="">Select style</option>
                    <option value="professional headshot">Professional Headshot</option>
                    <option value="fine art portrait">Fine Art Portrait</option>
                    <option value="candid lifestyle">Candid Lifestyle</option>
                    <option value="cinematic portrait">Cinematic Portrait</option>
                    <option value="fashion photography">Fashion Photography</option>
                    <option value="documentary style">Documentary Style</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mood & Processing */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-electric-cyan" />
                Mood & Processing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-soft-lavender mb-2">Mood *</label>
                  <select
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                    value={promptData.mood}
                    onChange={(e) => handleInputChange('mood', e.target.value)}
                  >
                    <option value="">Select mood</option>
                    <option value="confident and professional">Confident & Professional</option>
                    <option value="warm and inviting">Warm & Inviting</option>
                    <option value="dramatic and intense">Dramatic & Intense</option>
                    <option value="peaceful and serene">Peaceful & Serene</option>
                    <option value="energetic and vibrant">Energetic & Vibrant</option>
                    <option value="mysterious and moody">Mysterious & Moody</option>
                  </select>
                </div>
                <div>
                  <label className="block text-soft-lavender mb-2">Post-Processing</label>
                  <select
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                    value={promptData['post-processing']}
                    onChange={(e) => handleInputChange('post-processing', e.target.value)}
                  >
                    <option value="">Select processing</option>
                    <option value="natural color grading">Natural Color Grading</option>
                    <option value="film emulation">Film Emulation</option>
                    <option value="high contrast">High Contrast</option>
                    <option value="soft and dreamy">Soft & Dreamy</option>
                    <option value="vintage tone">Vintage Tone</option>
                    <option value="minimal processing">Minimal Processing</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Enhancement */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-electric-cyan" />
                Enhancement
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-soft-lavender mb-2">Category</label>
                  <select
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                    value={promptData.selectedCategory}
                    onChange={(e) => handleInputChange('selectedCategory', e.target.value)}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-soft-lavender mb-2">Enhancement Level: {promptData.enhanceLevel}</label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    className="w-full slider"
                    value={promptData.enhanceLevel}
                    onChange={(e) => handleInputChange('enhanceLevel', parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-soft-lavender/50 mt-1">
                    <span>Natural</span>
                    <span>Enhanced</span>
                    <span>Professional</span>
                    <span>Premium</span>
                    <span>Luxury</span>
                  </div>
                </div>
                <div>
                  <label className="block text-soft-lavender mb-2">Custom Enhancement</label>
                  <input
                    type="text"
                    placeholder="e.g., shot on Canon EOS R5, 85mm lens"
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                    value={promptData.enhancement}
                    onChange={(e) => handleInputChange('enhancement', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGeneratePrompt}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating Prompt...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Prompt
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-error-red/10 border border-error-red/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-error-red mt-0.5" />
                  <p className="text-error-red text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="bg-success-green/10 border border-success-green/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success-green" />
                  <p className="text-success-green text-sm">Prompt generated successfully!</p>
                </div>
              </div>
            )}

            {/* Generated Prompt */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-soft-lavender">Generated Prompt</h2>
                {generatedPrompt && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateMetadata}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Metadata
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-deep-bg border border-border-color rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                {generatedPrompt ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-soft-lavender mb-2">Base Prompt:</h3>
                      <p className="text-soft-lavender/80 text-sm leading-relaxed">{generatedPrompt}</p>
                    </div>
                    
                    {enhancedPrompt && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium text-soft-lavender">Enhanced Prompt:</h3>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={promptEnhancementEnabled}
                              onChange={(e) => setPromptEnhancementEnabled(e.target.checked)}
                              className="rounded border-border-color"
                            />
                            <span className="text-xs text-soft-lavender/70">Use for generation</span>
                          </label>
                        </div>
                        <p className="text-soft-lavender/80 text-sm leading-relaxed">{enhancedPrompt}</p>
                      </div>
                    )}

                    {negativePrompt && (
                      <div>
                        <h3 className="text-sm font-medium text-soft-lavender mb-2">Negative Prompt:</h3>
                        <p className="text-soft-lavender/60 text-sm leading-relaxed">{negativePrompt}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-soft-lavender/50">
                    <Wand2 className="w-8 h-8 mb-4" />
                    <p>Fill out the form and click "Generate Prompt" to begin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Metadata */}
            {generatedMetadata && (
              <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                <h2 className="text-xl font-bold text-soft-lavender mb-4">Generated Metadata</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-soft-lavender">Title:</label>
                    <p className="text-soft-lavender/80">{generatedMetadata.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-soft-lavender">Notes:</label>
                    <p className="text-soft-lavender/80">{generatedMetadata.notes}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-soft-lavender">SREF:</label>
                    <p className="text-soft-lavender/80">{generatedMetadata.sref}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Image Generation */}
            {generatedPrompt && (
              <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                <h2 className="text-xl font-bold text-soft-lavender mb-4">Generate Images</h2>
                
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-soft-lavender mb-2">Dimensions</label>
                      <select
                        className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                        value={imageDimensions}
                        onChange={(e) => setImageDimensions(e.target.value)}
                      >
                        <option value="1:1">Square (1:1)</option>
                        <option value="3:2">Landscape (3:2)</option>
                        <option value="2:3">Portrait (2:3)</option>
                        <option value="16:9">Wide (16:9)</option>
                        <option value="9:16">Tall (9:16)</option>
                        <option value="4:5">Instagram (4:5)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-soft-lavender mb-2">Images</label>
                      <select
                        className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                        value={numberOfImages}
                        onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                      >
                        <option value={1}>1 Image</option>
                        <option value={2}>2 Images</option>
                        <option value={3}>3 Images</option>
                        <option value={4}>4 Images</option>
                      </select>
                    </div>
                  </div>
                </div>

                {imageError && (
                  <div className="bg-error-red/10 border border-error-red/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-error-red mt-0.5" />
                      <p className="text-error-red text-sm">{imageError}</p>
                    </div>
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full mb-4"
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages}
                >
                  {isGeneratingImages ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating Images...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Generate Images
                    </>
                  )}
                </Button>

                {/* Generated Images */}
                {generatedImages.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {generatedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Generated artwork ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(index)}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(index);
                                }}
                                className="bg-black/50 text-white hover:bg-black/70 border-white/20"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadImage(imageUrl, index);
                                }}
                                className="bg-black/50 text-white hover:bg-black/70 border-white/20"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleDownloadImage(generatedImages[0], 0)}
                        className="flex-1"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download First
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSaveWithImage}
                        className="flex-1"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Save with Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image Viewer Modal */}
        <ImageViewerModal
          images={generatedImages}
          currentIndex={selectedImageIndex}
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          onDownload={handleDownloadImage}
        />
      </div>
    </div>
  );
};

export default PromptBuilder;
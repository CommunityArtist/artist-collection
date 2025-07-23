import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Wand2, 
  Copy, 
  Download, 
  Sparkles, 
  Settings, 
  RefreshCw, 
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  AlertCircle,
  Zap,
  Camera,
  Palette,
  Sun,
  Lightbulb,
  Target,
  Film,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Minus
} from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { generatePromptLocally, enhancePromptWithCategory, type PromptData as LocalPromptData } from '../utils/promptGeneration';
import { generateImagesWithFallback, testEdgeFunctionAvailability, getImageGenerationErrorMessage, clearEdgeFunctionCache } from '../utils/imageGeneration';
import { ExtractedPrompt } from '../types';

interface PromptData {
  subject: string;
  setting: string;
  lighting: string;
  style: string;
  mood: string;
  'post-processing': string;
  enhancement: string;
}

const PromptBuilder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [edgeFunctionsAvailable, setEdgeFunctionsAvailable] = useState(false);

  // Form state
  const [promptData, setPromptData] = useState<PromptData>({
    subject: '',
    setting: '',
    lighting: '',
    style: '',
    mood: '',
    'post-processing': '',
    enhancement: ''
  });

  // UI state
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [promptEnhancementEnabled, setPromptEnhancementEnabled] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Image generation settings
  const [imageDimensions, setImageDimensions] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  // Image viewer state
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Enhancement categories and levels
  const [selectedCategory, setSelectedCategory] = useState('Natural Photography');
  const [enhanceLevel, setEnhanceLevel] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(true);
  const [isCheckingFunctions, setIsCheckingFunctions] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Check if Edge Functions are available
  useEffect(() => {
    const checkEdgeFunctions = async () => {
      console.log('🔍 Starting Edge Function availability check...');
      setIsCheckingFunctions(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Test multiple functions to be sure
      const promptAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'generate-prompt');
      const imageAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'generate-image');
      const extractAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'extract-prompt');
      
      const available = promptAvailable && imageAvailable;
      console.log('🔍 Edge Function availability results:', {
        prompt: promptAvailable,
        image: imageAvailable,
        extract: extractAvailable,
        overall: available
      });
      
      setEdgeFunctionsAvailable(available);
      if (!available) {
        setUseFallbackMode(true);
      } else {
        // If Edge Functions are available and user was previously in fallback mode,
        // automatically switch to AI mode for better experience
        if (useFallbackMode) {
          console.log('✅ Switching to AI mode - Edge Functions detected!');
          setUseFallbackMode(false);
        }
      }
      setIsCheckingFunctions(false);
    };
    
    checkEdgeFunctions();
    
    // Check more frequently for newly deployed functions
    const interval = setInterval(checkEdgeFunctions, 30000);
    return () => clearInterval(interval);
  }, [useFallbackMode]);

  // Handle data from Prompt Extractor
  useEffect(() => {
    if (location.state?.extractedPromptData) {
      const extractedData: ExtractedPrompt = location.state.extractedPromptData;
      
      // Map extracted data to form fields
      setPromptData({
        subject: extractedData.mainPrompt.split('.') || '', // First sentence as subject
        setting: extractedData.composition || '',
        lighting: extractedData.lighting || '',
        style: extractedData.styleElements.join(', ') || '',
        mood: extractedData.mood || '',
        'post-processing': extractedData.technicalDetails.join(', ') || '',
        enhancement: `Camera: ${extractedData.camera}, Lens: ${extractedData.lens}, Colors: ${extractedData.colorPalette.join(', ')}`
      });
      
      // Set the main prompt as generated prompt
      setGeneratedPrompt(extractedData.mainPrompt);
      
      // Clear the location state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleInputChange = (field: keyof PromptData, value: string) => {
    setPromptData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleGeneratePrompt = async () => {
    try {
      if (!isAuthenticated) {
        setError('Please sign in to generate prompts');
        navigate('/auth');
        return;
      }

      setIsGeneratingPrompt(true);
      setError(null);

      // Use local generation if Edge Functions are not available or user prefers fallback
      if (useFallbackMode || !edgeFunctionsAvailable) {
        try {
          console.log('🔧 Using local prompt generation');
          const localPromptData: LocalPromptData = {
            subject: promptData.subject,
            setting: promptData.setting,
            lighting: promptData.lighting,
            style: promptData.style,
            mood: promptData.mood,
            'post-processing': promptData['post-processing'],
            enhancement: promptData.enhancement
          };
          
          const result = generatePromptLocally(localPromptData);
          let finalPrompt = result.prompt;
          
          if (enhanceLevel > 0) {
            finalPrompt = enhancePromptWithCategory(finalPrompt, selectedCategory, enhanceLevel);
          }
          
          setGeneratedPrompt(finalPrompt);
          
          // Show success message for local generation
          if (useFallbackMode && edgeFunctionsAvailable) {
            setError('✅ Generated using local templates (AI mode available but local mode selected)');
          } else if (!edgeFunctionsAvailable) {
            setError('✅ Generated using advanced local templates - Click Refresh to detect deployed functions');
          }
          
          return;
        } catch (localError) {
          console.error('Local prompt generation failed:', localError);
          setError('Local prompt generation failed. Please check your inputs and try again.');
          return;
        }
      }

      console.log('🤖 Using AI prompt generation');
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate prompts');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`;
      console.log('📡 Calling AI prompt generation:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(promptData),
      });

      const data = await response.json();
      console.log('📡 AI prompt response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate prompt: ${response.status} ${response.statusText}`);
      }

      setGeneratedPrompt(data.prompt);
      
    } catch (error) {
      console.error('Error generating prompt:', error);
      
      let errorMessage = 'Failed to generate prompt';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the prompt generation service. Please check that the Supabase Edge Functions are deployed and try again.';
        } else if (error.message.includes('OpenAI API key')) {
          errorMessage = 'OpenAI API key not configured. Please contact support.';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Try fallback local generation if API completely fails
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        const { subject, setting, lighting, style, mood } = promptData;
        
        if (subject && setting && lighting && style && mood) {
          let prompt = `${subject} in ${setting}, ${lighting}, ${style} style, ${mood} mood`;
          
          if (promptData['post-processing']) {
            prompt += `, ${promptData['post-processing']}`;
          }
          
          if (promptData.enhancement) {
            prompt += `, ${promptData.enhancement}`;
          }

          setGeneratedPrompt(prompt);
          setError('Used basic fallback prompt generation (Edge Functions unavailable)');
        }
      }
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      if (!isAuthenticated) {
        setError('Please sign in to generate images');
        navigate('/auth');
        return;
      }

      // Use fallback image generation if Edge Functions are not available
      if (useFallbackMode || !edgeFunctionsAvailable) {
        try {
          const result = await generateImagesWithFallback({
            prompt: promptToUse,
            dimensions: imageDimensions,
            numberOfImages: numberOfImages
          });
          
          if (result.success && result.imageUrls) {
            setGeneratedImages(result.imageUrls);
            setError(`Using placeholder images - Deploy Edge Functions for AI generation`);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback image generation failed:', fallbackError);
        }
      }

      setIsGeneratingImages(true);
      setError(null);

      const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
      
      if (!promptToUse) {
        throw new Error('Please generate a prompt first');
      }

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate images');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
      const requestPayload = {
        prompt: promptToUse,
        imageDimensions: imageDimensions,
        numberOfImages: numberOfImages
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      let imageUrls: string[] = [];
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        imageUrls = data.imageUrls;
      } else if (data.imageUrl) {
        imageUrls = Array.isArray(data.imageUrl) ? data.imageUrl : [data.imageUrl];
      } else {
        throw new Error('No images returned from the OpenAI API');
      }

      setGeneratedImages(imageUrls);

    } catch (error) {
      console.error('Error generating images:', error);
      
      let errorMessage = 'Failed to generate images';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the OpenAI image generation service. Please check that the Supabase Edge Functions are deployed and try again.';
        } else if (error.message.includes('OpenAI API key')) {
          errorMessage = 'OpenAI API key not configured. Please go to Account → API Config to set up your OpenAI API key.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please check your account billing or contact support.';
        } else if (error.message.includes('content filters')) {
          errorMessage = 'Your prompt was blocked by content filters. Please modify your prompt to comply with usage policies.';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const enhancePrompt = async () => {
    try {
      setIsEnhancingPrompt(true);
      setError(null);

      // Enhanced prompt generation using local utilities
      const enhancedResult = enhancePromptWithCategory(generatedPrompt, selectedCategory, enhanceLevel);
      setEnhancedPrompt(enhancedResult);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleCopyPrompt = async () => {
    const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
    
    if (!promptToUse) return;

    try {
      await navigator.clipboard.writeText(promptToUse);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadPrompt = () => {
    const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
    
    if (!promptToUse) return;

    const blob = new Blob([promptToUse], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-prompt.txt';
    document.body.appendChild(link);
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePrompt = async (selectedImageUrl?: string) => {
    const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
    
    if (!promptToUse) {
      setError('No prompt to save');
      return;
    }

    // Navigate to create prompt page with the generated prompt and form data
    navigate('/create-prompt', {
      state: {
        generatedPrompt: promptToUse,
        promptData: promptData,
        imageDimensions: imageDimensions,
        numberOfImages: numberOfImages,
        mediaUrl: selectedImageUrl
      }
    });
  };

  const forceRefreshEdgeFunctions = async () => {
    console.log('🔄 Forcing Edge Function refresh...');
    setIsCheckingFunctions(true);
    clearEdgeFunctionCache();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // Test all critical functions
    const promptAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'generate-prompt');
    const imageAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'generate-image');
    const extractAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'extract-prompt');
    
    const available = promptAvailable && imageAvailable;
    console.log('🔄 Force refresh results:', {
      prompt: promptAvailable,
      image: imageAvailable,
      extract: extractAvailable,
      overall: available,
      supabaseUrl: supabaseUrl
    });
    
    setEdgeFunctionsAvailable(available);
    if (available && useFallbackMode) {
      console.log('✅ Force refresh: Switching to AI mode!');
      setUseFallbackMode(false);
    }
    setIsCheckingFunctions(false);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12 flex items-center justify-center">
        <div className="text-soft-lavender">Loading...</div>
      </div>
    );
  }

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex(prev => Math.min(generatedImages.length - 1, prev + 1));
  };

  const resetForm = () => {
    setPromptData({
      subject: '',
      setting: '',
      lighting: '',
      style: '',
      mood: '',
      'post-processing': '',
      enhancement: ''
    });
    setGeneratedPrompt('');
    setEnhancedPrompt('');
    setGeneratedImages([]);
    setError(null);
    setSelectedCategory('Natural Photography');
    setEnhanceLevel(0);
  };

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-soft-lavender mb-6">
              <span className="text-electric-cyan">Prompt</span> Builder
            </h1>
            <p className="text-soft-lavender/70 text-lg md:text-xl max-w-3xl mx-auto">
              Create detailed, professional prompts for AI image generation with our intelligent builder
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-soft-lavender flex items-center gap-2">
                    <Settings className="w-5 h-5 text-electric-cyan" />
                    Prompt Configuration
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseFallbackMode(!useFallbackMode)}
                    className={`mr-3 ${useFallbackMode ? 'bg-cosmic-purple/20' : ''} ${!edgeFunctionsAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!edgeFunctionsAvailable}
                  >
                    <Info className="w-4 h-4 mr-2" />
                    {useFallbackMode ? 'Local Mode' : 'AI Mode'} {edgeFunctionsAvailable && '🤖'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="text-soft-lavender/70 hover:text-soft-lavender"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-soft-lavender mb-2 font-medium">
                      <Target className="w-4 h-4 inline mr-2" />
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., A young woman with curly hair"
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                      value={promptData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                    />
                  </div>

                  {/* Setting */}
                  <div>
                    <label className="block text-soft-lavender mb-2 font-medium">
                      <ImageIcon className="w-4 h-4 inline mr-2" />
                      Setting
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Modern coffee shop with large windows"
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                      value={promptData.setting}
                      onChange={(e) => handleInputChange('setting', e.target.value)}
                    />
                  </div>

                  {/* Lighting */}
                  <div>
                    <label className="block text-soft-lavender mb-2 font-medium">
                      <Lightbulb className="w-4 h-4 inline mr-2" />
                      Lighting
                    </label>
                    <select
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                      value={promptData.lighting}
                      onChange={(e) => handleInputChange('lighting', e.target.value)}
                    >
                      <option value="">Select lighting...</option>
                      <option value="Natural window light">Natural window light</option>
                      <option value="Golden hour">Golden hour</option>
                      <option value="Soft studio lighting">Soft studio lighting</option>
                      <option value="Dramatic side lighting">Dramatic side lighting</option>
                      <option value="Backlit">Backlit</option>
                      <option value="Overcast daylight">Overcast daylight</option>
                      <option value="Warm indoor lighting">Warm indoor lighting</option>
                    </select>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-soft-lavender mb-2 font-medium">
                      <Palette className="w-4 h-4 inline mr-2" />
                      Style
                    </label>
                    <select
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                      value={promptData.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                    >
                      <option value="">Select style...</option>
                      <option value="Photorealistic portrait">Photorealistic portrait</option>
                      <option value="Professional headshot">Professional headshot</option>
                      <option value="Candid lifestyle">Candid lifestyle</option>
                      <option value="Fashion photography">Fashion photography</option>
                      <option value="Documentary style">Documentary style</option>
                      <option value="Fine art portrait">Fine art portrait</option>
                      <option value="Commercial photography">Commercial photography</option>
                    </select>
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="block text-soft-lavender mb-2 font-medium">
                      <Sun className="w-4 h-4 inline mr-2" />
                      Mood & Atmosphere
                    </label>
                    <select
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                      value={promptData.mood}
                      onChange={(e) => handleInputChange('mood', e.target.value)}
                    >
                      <option value="">Select mood...</option>
                      <option value="Warm and inviting">Warm and inviting</option>
                      <option value="Professional and confident">Professional and confident</option>
                      <option value="Relaxed and natural">Relaxed and natural</option>
                      <option value="Energetic and vibrant">Energetic and vibrant</option>
                      <option value="Contemplative and serene">Contemplative and serene</option>
                      <option value="Dramatic and intense">Dramatic and intense</option>
                      <option value="Joyful and bright">Joyful and bright</option>
                    </select>
                  </div>

                  {/* Advanced Settings Toggle */}
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center gap-2 text-electric-cyan hover:text-cosmic-purple transition-colors duration-200"
                  >
                    {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Settings
                  </button>

                  {/* Advanced Settings */}
                  {showAdvancedSettings && (
                    <div className="space-y-4 pt-4 border-t border-border-color">
                      {/* Post-processing */}
                      <div>
                        <label className="block text-soft-lavender mb-2 font-medium">
                          <Camera className="w-4 h-4 inline mr-2" />
                          Post-processing
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Natural color grading, film grain"
                          className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                          value={promptData['post-processing']}
                          onChange={(e) => handleInputChange('post-processing', e.target.value)}
                        />
                      </div>

                      {/* Enhancement */}
                      <div>
                        <label className="block text-soft-lavender mb-2 font-medium">
                          <Zap className="w-4 h-4 inline mr-2" />
                          Enhancement Codes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., --ar 3:2 --style raw --v 6"
                          className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                          value={promptData.enhancement}
                          onChange={(e) => handleInputChange('enhancement', e.target.value)}
                        />
                      </div>

                      {/* Enhancement Category */}
                      <div>
                        <label className="block text-soft-lavender mb-2 font-medium">Enhancement Category</label>
                        <select
                          className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="Natural Photography">Natural Photography</option>
                          <option value="Professional Portrait">Professional Portrait</option>
                          <option value="Fashion & Beauty">Fashion & Beauty</option>
                          <option value="Lifestyle & Candid">Lifestyle & Candid</option>
                          <option value="Commercial & Brand">Commercial & Brand</option>
                        </select>
                      </div>

                      {/* Enhancement Level */}
                      <div>
                        <label className="block text-soft-lavender mb-2 font-medium">
                          Enhancement Level: {enhanceLevel}/5
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setEnhanceLevel(Math.max(0, enhanceLevel - 1))}
                            className="p-2 rounded-lg bg-cosmic-purple/20 text-cosmic-purple hover:bg-cosmic-purple/30 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 bg-deep-bg rounded-lg p-3 text-center text-soft-lavender">
                            {enhanceLevel}
                          </div>
                          <button
                            onClick={() => setEnhanceLevel(Math.min(5, enhanceLevel + 1))}
                            className="p-2 rounded-lg bg-cosmic-purple/20 text-cosmic-purple hover:bg-cosmic-purple/30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mode Information */}
                <div className="mt-4 p-3 bg-deep-bg rounded-lg">
                  <p className="text-xs text-soft-lavender/60">
                    <Info className="w-3 h-3 inline mr-1" />
                    {edgeFunctionsAvailable 
                      ? (useFallbackMode ? 'Using local prompt generation (AI available)' : '🤖 Using AI-powered prompt generation') 
                      : 'Using local prompt generation (AI unavailable)'
                    }
                  </p>
                </div>

                {/* Generate Prompt Button */}
                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleGeneratePrompt}
                    disabled={isGeneratingPrompt || !promptData.subject || !promptData.setting || !promptData.lighting || !promptData.style || !promptData.mood}
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
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
              </div>

              {/* Image Generation Settings */}
              {generatedPrompt && (
                <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                  <h3 className="text-lg font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                    <Film className="w-5 h-5 text-electric-cyan" />
                    Image Generation Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Image Dimensions */}
                    <div>
                      <label className="block text-soft-lavender mb-2 font-medium">Dimensions</label>
                      <select
                        className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                        value={imageDimensions}
                        onChange={(e) => setImageDimensions(e.target.value)}
                      >
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                        <option value="2:3">Portrait (2:3)</option>
                        <option value="3:2">Landscape (3:2)</option>
                        <option value="4:5">Portrait (4:5)</option>
                      </select>
                    </div>

                    {/* Number of Images */}
                    <div>
                      <label className="block text-soft-lavender mb-2 font-medium">Number of Images</label>
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

                  {/* Generate Images Button */}
                  <div className="mt-6">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={handleGenerateImages}
                      disabled={isGeneratingImages || !generatedPrompt}
                    >
                      {isGeneratingImages ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                          Generating Images...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 mr-2" />
                          Generate Images with DALL-E 3
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {/* Generated Prompt Section */}
              {generatedPrompt && (
                <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                  <h2 className="text-xl font-bold text-soft-lavender mb-4">Generated Prompt</h2>
                  
                  {/* Prompt Enhancement Toggle */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-deep-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPromptEnhancementEnabled(!promptEnhancementEnabled)}
                        className={`p-2 rounded-lg transition-colors ${
                          promptEnhancementEnabled 
                            ? 'bg-cosmic-purple/20 text-cosmic-purple' 
                            : 'bg-border-color/20 text-soft-lavender/50'
                        }`}
                      >
                        {promptEnhancementEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <span className="text-soft-lavender font-medium">
                        {promptEnhancementEnabled ? 'Enhanced Prompt' : 'Original Prompt'}
                      </span>
                    </div>
                    {promptEnhancementEnabled && !enhancedPrompt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={enhancePrompt}
                        disabled={isEnhancingPrompt}
                      >
                        {isEnhancingPrompt ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Enhance
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Prompt Display */}
                  <div className="bg-deep-bg border border-border-color rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                    <p className="text-soft-lavender whitespace-pre-wrap leading-relaxed">
                      {promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPrompt}
                      className={`flex-1 transition-colors duration-300 ${
                        copySuccess ? 'bg-success-green/20 text-success-green' : ''
                      }`}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPrompt}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSavePrompt()}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              )}
              {generatedImages.length > 0 && (
                <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                  <h2 className="text-xl font-bold text-soft-lavender mb-4">Generated Images</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={imageUrl}
                          alt={`Generated artwork ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                          onClick={() => openImageViewer(index)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openImageViewer(0)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Gallery
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSavePrompt(generatedImages)}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save with Image
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={generatedImages}
        currentIndex={currentImageIndex}
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onPrevious={goToPreviousImage}
        onNext={goToNextImage}
      />
    </div>
  );
};

export default PromptBuilder;
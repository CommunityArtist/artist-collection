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
  AlertCircle,
  Zap,
  Camera,
  Palette,
  Sun,
  Moon,
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
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

  // Generation state
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [promptEnhancementEnabled, setPromptEnhancementEnabled] = useState(false);
  
  // Image generation state
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageDimensions, setImageDimensions] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        setUser(user);
      } else {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  // Handle extracted prompt data from Prompt Extractor
  useEffect(() => {
    if (location.state?.extractedPromptData) {
      const extractedData: ExtractedPrompt = location.state.extractedPromptData;
      
      // Map extracted data to form fields
      setPromptData({
        subject: extractedData.mainPrompt.split('.')[0] || '',
        setting: extractedData.composition || '',
        lighting: extractedData.lighting || '',
        style: extractedData.styleElements.join(', ') || '',
        mood: extractedData.mood || '',
        'post-processing': extractedData.technicalDetails.join(', ') || '',
        enhancement: ''
      });

      // Set the full extracted prompt as generated prompt
      const fullPrompt = `${extractedData.mainPrompt}

Camera: ${extractedData.camera}
Lens: ${extractedData.lens}
Lighting: ${extractedData.lighting}
Color Palette: ${extractedData.colorPalette.join(', ')}
Audio Vibe: ${extractedData.audioVibe}

Style Elements: ${extractedData.styleElements.join(', ')}
Technical Details: ${extractedData.technicalDetails.join(', ')}
Composition: ${extractedData.composition}
Mood: ${extractedData.mood}`;

      setGeneratedPrompt(fullPrompt);
    }
  }, [location.state]);

  const handleInputChange = (field: keyof PromptData, value: string) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleGeneratePrompt = async () => {
    try {
      setIsGeneratingPrompt(true);
      setError(null);

      // Get authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate prompts');
      }

      // Validate required fields
      const requiredFields = ['subject', 'setting', 'lighting', 'style', 'mood'];
      const missingFields = requiredFields.filter(field => !promptData[field].trim());

      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
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
      
      // If enhancement is enabled, automatically enhance the prompt
      if (promptEnhancementEnabled) {
        await enhancePrompt(data.prompt);
      }

    } catch (error) {
      console.error('Error generating prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const enhancePrompt = async (basePrompt?: string) => {
    try {
      setIsEnhancingPrompt(true);
      setError(null);

      // Get authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to enhance prompts');
      }

      const promptToEnhance = basePrompt || generatedPrompt;
      if (!promptToEnhance) {
        throw new Error('No prompt to enhance. Please generate a prompt first.');
      }

      const enhancementPrompt = `Enhance this AI image generation prompt to produce more realistic, detailed, and visually stunning results. Focus on:

1. Adding specific technical photography details (camera settings, lens specifications)
2. Enhancing lighting descriptions with professional terminology
3. Including realistic texture and material details
4. Adding atmospheric and environmental elements
5. Improving composition and framing descriptions
6. Ensuring photorealistic quality keywords are included

Original prompt: ${promptToEnhance}

Return an enhanced version that will generate higher quality, more realistic images.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject: enhancementPrompt,
          setting: 'Professional photography studio',
          lighting: 'Professional lighting setup',
          style: 'Photorealistic enhancement',
          mood: 'High-quality professional result',
          'post-processing': 'Professional color grading'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance prompt');
      }

      setEnhancedPrompt(data.prompt);

    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      setIsGeneratingImages(true);
      setError(null);
      setGeneratedImages([]);

      // Get authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate images');
      }

      const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
      
      if (!promptToUse) {
        throw new Error('Please generate a prompt first');
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
          numberOfImages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      // Handle both single image and multiple images response
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        setGeneratedImages(data.imageUrls);
      } else if (data.imageUrl) {
        setGeneratedImages([data.imageUrl]);
      } else {
        throw new Error('No images were generated');
      }

    } catch (error) {
      console.error('Error generating images:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setIsGeneratingImages(false);
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
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePrompt = async () => {
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
        numberOfImages: numberOfImages
      }
    });
  };

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % generatedImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + generatedImages.length) % generatedImages.length);
  };

  if (!isAuthenticated) {
    return null;
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
            Create detailed prompts for AI image generation with professional photography techniques
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-electric-cyan" />
                Basic Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-soft-lavender mb-2">Subject *</label>
                  <input
                    type="text"
                    placeholder="e.g., A young woman with curly hair"
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                    value={promptData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-soft-lavender mb-2">Setting *</label>
                  <input
                    type="text"
                    placeholder="e.g., Standing in a sunlit garden"
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                    value={promptData.setting}
                    onChange={(e) => handleInputChange('setting', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-lavender mb-2">Lighting *</label>
                    <select
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                      value={promptData.lighting}
                      onChange={(e) => handleInputChange('lighting', e.target.value)}
                    >
                      <option value="">Select lighting</option>
                      <option value="Golden hour">Golden hour</option>
                      <option value="Soft natural light">Soft natural light</option>
                      <option value="Studio lighting">Studio lighting</option>
                      <option value="Dramatic lighting">Dramatic lighting</option>
                      <option value="Backlit">Backlit</option>
                      <option value="Overcast">Overcast</option>
                      <option value="Neon lighting">Neon lighting</option>
                      <option value="Candlelight">Candlelight</option>
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
                      <option value="Photorealistic">Photorealistic</option>
                      <option value="Portrait photography">Portrait photography</option>
                      <option value="Fashion photography">Fashion photography</option>
                      <option value="Street photography">Street photography</option>
                      <option value="Fine art">Fine art</option>
                      <option value="Cinematic">Cinematic</option>
                      <option value="Documentary">Documentary</option>
                      <option value="Editorial">Editorial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-soft-lavender mb-2">Mood *</label>
                  <select
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                    value={promptData.mood}
                    onChange={(e) => handleInputChange('mood', e.target.value)}
                  >
                    <option value="">Select mood</option>
                    <option value="Serene and peaceful">Serene and peaceful</option>
                    <option value="Dramatic and intense">Dramatic and intense</option>
                    <option value="Warm and inviting">Warm and inviting</option>
                    <option value="Cool and mysterious">Cool and mysterious</option>
                    <option value="Energetic and vibrant">Energetic and vibrant</option>
                    <option value="Melancholic">Melancholic</option>
                    <option value="Joyful and bright">Joyful and bright</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-xl font-bold text-soft-lavender flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-electric-cyan" />
                  Advanced Settings
                </h2>
                {showAdvanced ? (
                  <ChevronUp className="w-5 h-5 text-soft-lavender/70" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-soft-lavender/70" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-soft-lavender mb-2">Post-Processing</label>
                    <input
                      type="text"
                      placeholder="e.g., Film grain, color grading, vintage filter"
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                      value={promptData['post-processing']}
                      onChange={(e) => handleInputChange('post-processing', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-soft-lavender mb-2">Enhancement Codes</label>
                    <input
                      type="text"
                      placeholder="e.g., HDR, 8K, ultra-detailed"
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                      value={promptData.enhancement}
                      onChange={(e) => handleInputChange('enhancement', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate Prompt Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt}
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

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Generated Prompt */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-soft-lavender">Generated Prompt</h2>
                <div className="flex items-center gap-4">
                  {/* Prompt Enhancement Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-soft-lavender/70">Enhancement</span>
                    <button
                      onClick={() => setPromptEnhancementEnabled(!promptEnhancementEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                        promptEnhancementEnabled ? 'bg-cosmic-purple' : 'bg-border-color'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                          promptEnhancementEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {promptEnhancementEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => enhancePrompt()}
                        disabled={isEnhancingPrompt || !generatedPrompt}
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
                  
                  {(generatedPrompt || enhancedPrompt) && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPrompt}
                        className={`transition-colors duration-300 ${
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
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSavePrompt}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-deep-bg border border-border-color rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                {promptEnhancementEnabled && enhancedPrompt ? (
                  <div className="space-y-4">
                    <div className="bg-cosmic-purple/10 border border-cosmic-purple/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-cosmic-purple" />
                        <span className="text-sm font-medium text-cosmic-purple">Enhanced Prompt</span>
                      </div>
                      <p className="text-soft-lavender whitespace-pre-wrap">{enhancedPrompt}</p>
                    </div>
                    {generatedPrompt && (
                      <details className="group">
                        <summary className="cursor-pointer text-soft-lavender/70 text-sm hover:text-soft-lavender">
                          Show original prompt
                        </summary>
                        <div className="mt-2 p-3 bg-deep-bg border border-border-color rounded-lg">
                          <p className="text-soft-lavender/70 whitespace-pre-wrap">{generatedPrompt}</p>
                        </div>
                      </details>
                    )}
                  </div>
                ) : generatedPrompt ? (
                  <p className="text-soft-lavender whitespace-pre-wrap">{generatedPrompt}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-soft-lavender/50">
                    <Wand2 className="w-8 h-8 mb-4" />
                    <p>Fill in the form and click "Generate Prompt" to create your detailed prompt</p>
                  </div>
                )}
              </div>
            </div>

            {/* Image Generation Settings */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-electric-cyan" />
                Image Generation
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soft-lavender mb-2">Dimensions</label>
                    <select
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                      value={imageDimensions}
                      onChange={(e) => setImageDimensions(e.target.value)}
                    >
                      <option value="1:1">Square (1:1)</option>
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="4:5">Portrait (4:5)</option>
                      <option value="3:2">Landscape (3:2)</option>
                      <option value="2:3">Portrait (2:3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-soft-lavender mb-2">Number of Images</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNumberOfImages(Math.max(1, numberOfImages - 1))}
                        className="w-8 h-8 rounded-full bg-deep-bg border border-border-color flex items-center justify-center text-soft-lavender hover:border-cosmic-purple transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center text-soft-lavender font-medium">{numberOfImages}</span>
                      <button
                        onClick={() => setNumberOfImages(Math.min(4, numberOfImages + 1))}
                        className="w-8 h-8 rounded-full bg-deep-bg border border-border-color flex items-center justify-center text-soft-lavender hover:border-cosmic-purple transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages || (!generatedPrompt && !enhancedPrompt)}
                >
                  {isGeneratingImages ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Generating Images...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Generate Images
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Images */}
            {generatedImages.length > 0 && (
              <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                <h2 className="text-xl font-bold text-soft-lavender mb-4">Generated Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-border-color hover:border-cosmic-purple/40 transition-all duration-300"
                      onClick={() => openImageViewer(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Generated artwork ${index + 1}`}
                        className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
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
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500/70 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-card-bg rounded-lg p-8 border border-border-color">
            <h2 className="text-2xl font-bold text-soft-lavender mb-6 text-center">
              Tips for Better Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-soft-lavender flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-electric-cyan" />
                  Prompt Writing
                </h3>
                <ul className="space-y-2 text-soft-lavender/70">
                  <li>• Be specific about physical details and expressions</li>
                  <li>• Include environmental context and atmosphere</li>
                  <li>• Mention specific camera and lighting techniques</li>
                  <li>• Use descriptive adjectives for mood and style</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-soft-lavender flex items-center gap-2">
                  <Target className="w-5 h-5 text-electric-cyan" />
                  Enhancement Tips
                </h3>
                <ul className="space-y-2 text-soft-lavender/70">
                  <li>• Enable prompt enhancement for more detailed results</li>
                  <li>• Try different lighting and mood combinations</li>
                  <li>• Experiment with various aspect ratios</li>
                  <li>• Generate multiple images to compare results</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={generatedImages}
        currentIndex={currentImageIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        onNext={nextImage}
        onPrevious={previousImage}
      />
    </div>
  );
};

export default PromptBuilder;
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Wand2, 
  Sparkles, 
  Download, 
  Save, 
  RefreshCw, 
  Eye, 
  Settings,
  Zap,
  AlertCircle
} from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { generatePromptLocally } from '../utils/promptGeneration';
import { generateImagesWithFallback, testEdgeFunctionAvailabilityCached } from '../utils/imageGeneration';

interface PromptBuilderData {
  subjectAndSetting: string;
  lighting: string;
  artStyle: string;
  mood: string;
  postProcessing: string[];
  enhancementCodes: string[];
  customPrompt: string;
}

const PromptBuilder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we have extracted data from URL params or location state
  const urlParams = new URLSearchParams(location.search);
  const extractedData = location.state?.extractedPromptData;
  const isFromExtractor = urlParams.get('source') === 'extractor' || !!extractedData;
  
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 400);
    textarea.style.height = newHeight + 'px';
  };

  const initialFormData: PromptBuilderData = {
    subjectAndSetting: (urlParams.get('subject') || '') + (urlParams.get('setting') ? ` in ${urlParams.get('setting')}` : '') || extractedData?.mainPrompt || '',
    lighting: urlParams.get('lighting') || extractedData?.lighting || '',
    artStyle: urlParams.get('style') || '',
    mood: urlParams.get('mood') || extractedData?.mood || '',
    postProcessing: [],
    enhancementCodes: [],
    customPrompt: urlParams.get('customPrompt') || '',
  };
  
  const [formData, setFormData] = useState<PromptBuilderData>(initialFormData);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatedImages, setGeneratedImages] = useState<Array<{url: string, id: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [edgeFunctionsAvailable, setEdgeFunctionsAvailable] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'nebius' | 'rendernet'>('openai');

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
        setIsAuthenticated(false);
        navigate('/auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Check edge functions availability
  useEffect(() => {
    const checkEdgeFunctions = async () => {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const available = await testEdgeFunctionAvailabilityCached(
          import.meta.env.VITE_SUPABASE_URL,
          'generate-prompt',
          3000
        );
        setEdgeFunctionsAvailable(available);
      }
    };

    checkEdgeFunctions();
  }, []);

  // Generate smart filename based on prompt content
  const generateFilename = (prompt: string, suffix: string = ''): string => {
    try {
      const words = prompt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => 
          word.length > 2 && 
          !['the', 'and', 'with', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'end', 'few', 'got', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
        )
        .slice(0, 4);
      
      if (words.length === 0) {
        return `ai-artwork-${Date.now()}`;
      }
      
      const baseFilename = words.join('-') + (suffix ? `-${suffix}` : '');
      const timestamp = new Date().toISOString().slice(0, 10);
      
      return `${baseFilename}-${timestamp}`;
    } catch (error) {
      return `ai-artwork-${Date.now()}`;
    }
  };

  const downloadImage = async (imageUrl: string, customFilename?: string) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const filename = generateFilename(generatedPrompt);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${customFilename || filename}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
      };
      
      img.onerror = () => {
        downloadImageAlternative(imageUrl, customFilename || filename);
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error('Download failed:', error);
      downloadImageAlternative(imageUrl, customFilename);
    }
  };

  const downloadImageAlternative = (imageUrl: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${filename}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Alternative download failed:', error);
      window.open(imageUrl, '_blank');
      alert('Image opened in new tab. Right-click and select "Save image as..." to download.');
    }
  };

  const artStyles = [
    'Realistic', 'Ultra Realistic Photography', 'Natural Outdoor Portrait', 'Digital Art', 'Oil Painting', 'Watercolor', 'Sketch', 'Anime',
    'Cyberpunk', 'Fantasy', 'Surreal', 'Abstract', 'Minimalist', 'Vintage',
    'Pop Art', 'Impressionist', 'Gothic', 'Steampunk', 'Art Nouveau', 'Graffiti'
  ];

  const moods = [
    'Calm', 'Energetic', 'Mysterious', 'Dreamy', 'Dark', 'Bright',
    'Melancholic', 'Joyful', 'Dramatic', 'Serene', 'Intense', 'Playful',
    'Nostalgic', 'Futuristic', 'Romantic', 'Adventurous', 'Peaceful', 'Bold'
  ];

  const lightingOptions = [
    'Natural', 'Golden Hour', 'Warm Afternoon Light', 'Blue Hour', 'Neon', 'Soft', 'Dramatic',
    'Backlit', 'Studio', 'Cinematic', 'Moody', 'Bright', 'Dim',
    'Colorful', 'Monochrome', 'Sunset', 'Sunrise', 'Moonlight', 'Candlelight', 'Natural Outdoor Light'
  ];

  const postProcessingOptions = [
    'HDR', 'High Detail', 'Ultra Sharp', 'Cinematic', 'Film Grain',
    'Soft Focus', 'Vignette', 'Color Grading', 'Bokeh', 'Lens Flare',
    'Depth of Field', 'Motion Blur', 'Chromatic Aberration', 'Bloom'
  ];

  const enhancementCodes = [
    '--ar 16:9', '--ar 1:1', '--ar 2:3', '--ar 4:5', '--v 6', '--v 5',
    '--style raw', '--style 2', '--quality 2', '--seed 1234', '--chaos 25',
    '--weird 250', '--stylize 100', '--no text', '--no watermark'
  ];

  const handleInputChange = (field: keyof PromptBuilderData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayItem = (field: 'postProcessing' | 'enhancementCodes', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const generatePrompt = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      if (edgeFunctionsAvailable) {
        // Try using Edge Functions first
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            subjectAndSetting: formData.subjectAndSetting,
            lighting: formData.lighting,
            style: formData.artStyle,
            mood: formData.mood,
            'post-processing': formData.postProcessing.join(', '),
            enhancement: formData.customPrompt
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let finalPrompt = data.prompt;
          
          if (formData.enhancementCodes.length > 0) {
            finalPrompt += ' ' + formData.enhancementCodes.join(' ');
          }
          
          setGeneratedPrompt(finalPrompt);
          setIsGenerating(false);
          return;
        }
      }

      // Fallback to local generation
      const promptData = {
        subjectAndSetting: formData.subjectAndSetting,
        lighting: formData.lighting,
        style: formData.artStyle,
        mood: formData.mood,
        'post-processing': formData.postProcessing.join(', '),
        enhancement: formData.customPrompt
      };

      const result = generatePromptLocally(promptData);
      let finalPrompt = result.prompt;
      
      if (formData.enhancementCodes.length > 0) {
        finalPrompt += ' ' + formData.enhancementCodes.join(' ');
      }
      
      setGeneratedPrompt(finalPrompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
      setError(`Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBatchImages = async () => {
    if (!generatedPrompt) return;
    
    setIsGeneratingBatch(true);
    setError('');
    setGeneratedImages([]);
    
    try {
      const result = await generateImagesWithFallback({
        prompt: generatedPrompt,
        dimensions: '1:1',
        numberOfImages: 4
      }, selectedProvider);

      if (result.success && result.imageUrls) {
        const imagesWithIds = result.imageUrls.map((url, index) => ({
          url,
          id: `batch-${Date.now()}-${index}`
        }));
        
        setGeneratedImages(imagesWithIds);
      } else {
        throw new Error(result.error || 'Failed to generate images');
      }
    } catch (error) {
      console.error('Error generating batch images:', error);
      setError(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const downloadImageById = async (imageUrl: string, imageId: string) => {
    const filename = generateFilename(generatedPrompt, imageId);
    await downloadImage(imageUrl, filename);
  };

  const generateImage = async () => {
    if (!generatedPrompt) return;
    
    setIsGeneratingImage(true);
    setError('');
    
    try {
      const result = await generateImagesWithFallback({
        prompt: generatedPrompt,
        dimensions: '1:1',
        numberOfImages: 1
      }, selectedProvider);

      if (result.success && result.imageUrls && result.imageUrls.length > 0) {
        setGeneratedImage(result.imageUrls[0]);
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const savePrompt = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save prompts to your library');
      return;
    }

    if (!generatedPrompt) {
      alert('Please generate a prompt first');
      return;
    }

    setIsSavingPrompt(true);
    setSaveSuccess(false);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const title = formData.subjectAndSetting ? 
        formData.subjectAndSetting.slice(0, 50) + (formData.subjectAndSetting.length > 50 ? '...' : '') : 
        'Generated Prompt';

      const { error } = await supabase
        .from('prompts')
        .insert({
          title,
          prompt: generatedPrompt,
          notes: `Generated using Prompt Builder\nStyle: ${formData.artStyle}\nMood: ${formData.mood}\nLighting: ${formData.lighting}`,
          media_url: generatedImage || null,
          user_id: user.id,
          is_private: false,
          tags: [
            'prompt-builder',
            ...(formData.artStyle ? [formData.artStyle.toLowerCase()] : []),
            ...(formData.mood ? [formData.mood.toLowerCase()] : []),
            ...(formData.lighting ? [formData.lighting.toLowerCase()] : [])
          ].filter(Boolean)
        });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving prompt:', error);
      setError(`Failed to save prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const exportPrompt = () => {
    const data = {
      prompt: generatedPrompt,
      metadata: formData,
      createdAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.json';
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-soft-lavender mb-4">
            Prompt Builder
            {isFromExtractor && (
              <span className="ml-4 text-lg text-electric-cyan">
                (From Extractor)
              </span>
            )}
          </h1>
          <p className="text-xl text-soft-lavender/70">
            {isFromExtractor 
              ? "Refine your extracted prompt with additional settings"
              : "Create sophisticated AI prompts with our intelligent form system"
            }
          </p>
          
          {isFromExtractor && (
            <div className="mt-4 p-3 bg-electric-cyan/10 border border-electric-cyan/20 rounded-lg">
              <p className="text-electric-cyan text-sm">
                ✨ Your extracted prompt has been loaded! You can now refine it with additional settings.
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-2xl font-bold text-soft-lavender mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Prompt Configuration
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="subjectAndSetting" className="block text-sm font-medium text-soft-lavender mb-3">
                    Subject & Setting Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="subjectAndSetting"
                      value={formData.subjectAndSetting}
                      onChange={(e) => {
                        handleInputChange('subjectAndSetting', e.target.value);
                        setTimeout(() => autoResize(e.target), 0);
                      }}
                      onInput={(e) => {
                        autoResize(e.target as HTMLTextAreaElement);
                      }}
                      placeholder="Describe your subject and setting in detail. For example: 'A majestic dragon with iridescent scales soaring through a misty mountain valley at sunset, ancient castle ruins visible in the distance, surrounded by floating magical crystals and ethereal light beams piercing through storm clouds'"
                      maxLength={30000}
                      className="w-full px-4 py-3 bg-deep-bg border border-border-color rounded-lg text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple transition-all resize-none"
                      style={{ minHeight: '120px', maxHeight: '400px' }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-soft-lavender/50 bg-card-bg px-2 py-1 rounded">
                      {formData.subjectAndSetting.length}/30,000
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-3">
                    Art Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {artStyles.map((style) => (
                      <button
                        key={style}
                        onClick={() => handleInputChange('artStyle', style)}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          formData.artStyle === style
                            ? 'bg-gradient-to-r from-electric-cyan to-cosmic-purple text-soft-lavender'
                            : 'bg-deep-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-3">
                    Mood & Atmosphere
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {moods.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => handleInputChange('mood', mood)}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          formData.mood === mood
                            ? 'bg-gradient-to-r from-electric-cyan to-cosmic-purple text-soft-lavender'
                            : 'bg-deep-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-3">
                    Lighting Setup
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {lightingOptions.map((lighting) => (
                      <button
                        key={lighting}
                        onClick={() => handleInputChange('lighting', lighting)}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          formData.lighting === lighting
                            ? 'bg-gradient-to-r from-electric-cyan to-cosmic-purple text-soft-lavender'
                            : 'bg-deep-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
                        }`}
                      >
                        {lighting}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-3">
                    Post-Processing Effects
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {postProcessingOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleArrayItem('postProcessing', option)}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          formData.postProcessing.includes(option)
                            ? 'bg-gradient-to-r from-electric-cyan to-cosmic-purple text-soft-lavender'
                            : 'bg-deep-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-3">
                    Enhancement Codes
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {enhancementCodes.map((code) => (
                      <button
                        key={code}
                        onClick={() => toggleArrayItem('enhancementCodes', code)}
                        className={`p-2 rounded-lg text-sm font-mono transition-all ${
                          formData.enhancementCodes.includes(code)
                            ? 'bg-gradient-to-r from-electric-cyan to-cosmic-purple text-soft-lavender'
                            : 'bg-deep-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-2">
                    Custom Additions
                  </label>
                  <textarea
                    value={formData.customPrompt}
                    onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                    placeholder="Add any additional details or modifications..."
                    rows={3}
                    className="w-full px-4 py-3 bg-deep-bg border border-border-color rounded-lg text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple transition-all"
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={generatePrompt}
                  className={`w-full ${isGenerating ? 'opacity-50' : ''}`}
                  disabled={isGenerating}
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate AI Prompt'}
                </Button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-2xl font-bold text-soft-lavender mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-2" />
                Generated Output
              </h2>

              {generatedPrompt ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-soft-lavender mb-3">Generated Prompt</h3>
                    <div className="bg-deep-bg rounded-lg p-4 border border-border-color">
                      <p className="text-soft-lavender/80 whitespace-pre-wrap">{generatedPrompt}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="w-full mb-3">
                      <label className="block text-sm font-medium text-soft-lavender mb-2">
                        AI Provider
                      </label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value as 'openai' | 'nebius' | 'rendernet')}
                        className="w-full bg-card-bg border border-border-color rounded-lg px-4 py-2 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                      >
                        <option value="openai">OpenAI DALL-E 3</option>
                        <option value="nebius">Nebius AI (Yandex)</option>
                        <option value="rendernet">RenderNet AI</option>
                      </select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={generateImage}
                      disabled={isGeneratingImage}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isGeneratingImage ? 'Generating...' : `Generate with ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateBatchImages}
                      disabled={isGeneratingBatch}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isGeneratingBatch ? 'Generating...' : `Generate 4 with ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={savePrompt}
                      disabled={isSavingPrompt}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSavingPrompt ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save to Library')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportPrompt}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {isGeneratingImage && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-electric-cyan animate-spin mx-auto mb-4" />
                        <p className="text-soft-lavender/70">Generating image...</p>
                      </div>
                    </div>
                  )}

                  {generatedImage && (
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-3">Generated Image</h3>
                      <div className="bg-deep-bg rounded-lg p-4 border border-border-color">
                        <img
                          src={generatedImage}
                          alt="Generated artwork"
                          className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => downloadImage(generatedImage)}
                          title="Click to download as PNG"
                        />
                        <div className="mt-3 flex justify-between items-center">
                          <p className="text-sm text-soft-lavender/50">Generated AI Image</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadImage(generatedImage)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PNG
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Batch Images Grid */}
                  {generatedImages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-3">Generated Images (Click to Download PNG)</h3>
                      <div className="bg-deep-bg rounded-lg p-4 border border-border-color">
                        <div className="grid grid-cols-2 gap-4">
                          {generatedImages.map((image, index) => (
                            <div
                              key={image.id}
                              className="relative group cursor-pointer"
                              onClick={() => downloadImageById(image.url, `var${index + 1}`)}
                              title="Click to download as PNG"
                            >
                              <img
                                src={image.url}
                                alt={`Generated artwork ${index + 1}`}
                                className="w-full rounded-lg hover:opacity-90 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <div className="text-white text-center">
                                  <Download className="w-8 h-8 mx-auto mb-2" />
                                  <p className="text-sm font-medium">Download PNG</p>
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                #{index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-sm text-soft-lavender/50">Click any image to download as PNG • Generated AI Images</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Batch Generation Progress */}
                  {isGeneratingBatch && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-electric-cyan animate-spin mx-auto mb-4" />
                        <p className="text-soft-lavender/70">Generating 4 images...</p>
                        <p className="text-sm text-soft-lavender/50 mt-2">This may take a moment</p>
                      </div>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="p-3 bg-success-green/10 border border-success-green/20 rounded-lg">
                      <p className="text-success-green text-sm">
                        ✅ Prompt saved to your library! Check "My Library" to see it.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wand2 className="w-16 h-16 text-soft-lavender/30 mx-auto mb-4" />
                  <p className="text-soft-lavender/50">
                    Configure your prompt settings and click "Generate AI Prompt" to see the magic happen!
                  </p>
                </div>
              )}
              
              {error && (
                <div className="bg-error-red/10 border border-error-red/20 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-error-red mt-0.5" />
                    <p className="text-error-red text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBuilder;
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

interface PromptBuilderData {
  subject: string;
  setting: string;
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
  
  // Check if we have extracted data from URL params
  const urlParams = new URLSearchParams(location.search);
  const isFromExtractor = urlParams.get('source') === 'extractor';
  
  const initialFormData: PromptBuilderData = {
    subject: urlParams.get('subject') || '',
    setting: '',
    lighting: urlParams.get('lighting') || '',
    artStyle: urlParams.get('style') || '',
    mood: urlParams.get('mood') || '',
    postProcessing: [],
    enhancementCodes: [],
    customPrompt: urlParams.get('customPrompt') || '',
  };
  
  const [formData, setFormData] = useState<PromptBuilderData>({
    ...initialFormData
  });

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
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        setUser(user);
        if (!user) {
          navigate('/auth');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  // Generate smart filename based on prompt content
  const generateFilename = (prompt: string, suffix: string = ''): string => {
    try {
      // Extract key words from the prompt
      const words = prompt.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .split(' ')
        .filter(word => 
          word.length > 2 && 
          !['the', 'and', 'with', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'end', 'few', 'got', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
        )
        .slice(0, 4); // Take first 4 meaningful words
      
      if (words.length === 0) {
        return `ai-artwork-${Date.now()}`;
      }
      
      // Create filename from meaningful words
      const baseFilename = words.join('-') + (suffix ? `-${suffix}` : '');
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      
      return `${baseFilename}-${timestamp}`;
    } catch (error) {
      // Fallback to timestamp if extraction fails
      return `ai-artwork-${Date.now()}`;
    }
  };

  const downloadImage = async (imageUrl: string, customFilename?: string) => {
    try {
      // Create a canvas to convert the image and download it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const filename = generateFilename(generatedPrompt);
      
      img.onload = () => {
        // Create canvas and draw the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob and download
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
        // If image loading fails, try alternative method
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
      // Create a temporary link with download attribute
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${filename}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM temporarily
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Alternative download failed:', error);
      // Final fallback: open in new tab for manual save
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
      // Use fallback local generation
      const parts = [];
      
      if (formData.subject) parts.push(formData.subject);
      if (formData.setting) parts.push(`in ${formData.setting}`);
      if (formData.lighting) parts.push(`${formData.lighting} lighting`);
      if (formData.artStyle) parts.push(`${formData.artStyle} style`);
      if (formData.mood) parts.push(`${formData.mood} mood`);
      if (formData.postProcessing.length > 0) {
        parts.push(formData.postProcessing.join(', '));
      }
      
      let prompt = parts.join(', ');
      
      if (formData.customPrompt) {
        prompt += `, ${formData.customPrompt}`;
      }
      
      // Add technical enhancements
      prompt += ', highly detailed, professional quality, 8k resolution';
      
      if (formData.enhancementCodes.length > 0) {
        prompt += ' ' + formData.enhancementCodes.join(' ');
      }
      
      setGeneratedPrompt(prompt);
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
      // Fallback to mock images
      const mockImages = [
        'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2041540/pexels-photo-2041540.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1252869/pexels-photo-1252869.jpeg?auto=compress&cs=tinysrgb&w=800'
      ];
      
      const imagesWithIds = mockImages.map((url, index) => ({
        url,
        id: `batch-${Date.now()}-${index}`
      }));
      
      setGeneratedImages(imagesWithIds);
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
      // Fallback to mock image
      setGeneratedImage('https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800');
    } catch (error) {
      console.error('Error generating image:', error);
      setError(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const savePrompt = async () => {
    if (!user) {
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
      // Save to Supabase
      const { error } = await supabase
        .from('prompts')
        .insert({
          title: formData.subject || 'Generated Prompt',
          prompt: generatedPrompt,
          notes: `AI-generated prompt featuring ${formData.subject || 'custom content'}. Style: ${formData.artStyle}, Mood: ${formData.mood}, Lighting: ${formData.lighting}`,
          media_url: generatedImage || null,
          is_private: false,
          user_id: user.id,
          tags: [
            ...(formData.artStyle ? [formData.artStyle.toLowerCase()] : []),
            ...(formData.mood ? [formData.mood.toLowerCase()] : []),
            ...(formData.lighting ? [formData.lighting.toLowerCase()] : []),
            'ai-generated',
            'prompt-builder'
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

  if (!isAuthenticated) {
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
                <Settings className="w-6 h-6 mr-2 text-electric-cyan" />
                Prompt Configuration
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-2">
                    Subject Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., A majestic dragon flying through the clouds"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-soft-lavender mb-2">
                    Setting/Environment
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Ancient castle, futuristic city, mystical forest"
                    value={formData.setting}
                    onChange={(e) => handleInputChange('setting', e.target.value)}
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                  />
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
                            : 'bg-card-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
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
                            : 'bg-card-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
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
                            : 'bg-card-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
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
                            : 'bg-card-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
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
                            : 'bg-card-bg text-soft-lavender/70 hover:bg-cosmic-purple/10 border border-border-color'
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
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={generatePrompt}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate AI Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-2xl font-bold text-soft-lavender mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-electric-cyan" />
                Generated Output
              </h2>

              {generatedPrompt ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-soft-lavender mb-3">Generated Prompt</h3>
                    <div className="bg-deep-bg rounded-lg p-4 border border-border-color">
                      <p className="text-soft-lavender/70 whitespace-pre-wrap">{generatedPrompt}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={generateImage}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateBatchImages}
                      disabled={isGeneratingBatch}
                    >
                      {isGeneratingBatch ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate 4 Images
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={savePrompt}
                      disabled={isSavingPrompt}
                    >
                      {isSavingPrompt ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {saveSuccess ? 'Saved!' : 'Save to Library'}
                        </>
                      )}
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
                          <p className="text-sm text-soft-lavender/50">Generated by AI</p>
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
                          <p className="text-sm text-soft-lavender/50">Click any image to download as PNG • Generated by AI</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {saveSuccess && (
                    <div className="mt-4 p-3 bg-success-green/10 border border-success-green/20 rounded-lg">
                      <p className="text-success-green text-sm">
                        ✅ Prompt saved to your library! Check "My Library" to see it.
                      </p>
                    </div>
                  )}

                  {!generatedPrompt && (
                    <div className="text-center py-12">
                      <Wand2 className="w-16 h-16 text-soft-lavender/30 mx-auto mb-4" />
                      <p className="text-soft-lavender/50">
                        Configure your prompt settings and click "Generate AI Prompt" to see the magic happen!
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {error && (
                <div className="bg-error-red/10 border border-error-red/20 rounded-lg p-3">
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
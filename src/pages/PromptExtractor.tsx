import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Wand2, Copy, Download, X, Eye, Sparkles, Zap, Camera, AlertCircle, Music } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ExtractedPrompt {
  mainPrompt: string;
  styleElements: string[];
  technicalDetails: string[];
  colorPalette: string[];
  composition: string;
  lighting: string;
  mood: string;
  camera: string;
  lens: string;
  audioVibe: string;
}

const PromptExtractor: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedPrompt, setExtractedPrompt] = useState<ExtractedPrompt | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on component mount
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedPrompt(null);
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedPrompt(null);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedPrompt(null);
    setError(null);
  };

  const handleExtractPrompt = async () => {
    if (!selectedImage) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      console.log('Starting image upload...');
      
      // Upload image to Supabase storage
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `extract-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/temp/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('prompt-media')
        .upload(filePath, selectedImage);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      console.log('Image uploaded successfully:', uploadData);
      
      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('prompt-media')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      
      // Call the extract-prompt Edge Function
      console.log('Calling extract-prompt function...');
      
      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use the prompt extractor');
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract prompt');
      }

      setExtractedPrompt(data);

      // Clean up: delete the temporary image from storage
      try {
        console.log('Cleaning up temporary image...');
        await supabase.storage
          .from('prompt-media')
          .remove([filePath]);
        console.log('Cleanup successful');
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary image:', cleanupError);
        // Don't throw error for cleanup failure
      }

    } catch (error) {
      console.error('Error extracting prompt:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!extractedPrompt) return;

    const fullPrompt = `${extractedPrompt.mainPrompt}

Camera: ${extractedPrompt.camera}
Lens: ${extractedPrompt.lens}
Lighting: ${extractedPrompt.lighting}
Color Palette: ${extractedPrompt.colorPalette.join(', ')}
Audio Vibe: ${extractedPrompt.audioVibe}

Style Elements: ${extractedPrompt.styleElements.join(', ')}
Technical Details: ${extractedPrompt.technicalDetails.join(', ')}
Composition: ${extractedPrompt.composition}
Mood: ${extractedPrompt.mood}`;

    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadPrompt = () => {
    if (!extractedPrompt) return;

    const fullPrompt = `${extractedPrompt.mainPrompt}

Camera: ${extractedPrompt.camera}
Lens: ${extractedPrompt.lens}
Lighting: ${extractedPrompt.lighting}
Color Palette: ${extractedPrompt.colorPalette.join(', ')}
Audio Vibe: ${extractedPrompt.audioVibe}

Style Elements: ${extractedPrompt.styleElements.join(', ')}
Technical Details: ${extractedPrompt.technicalDetails.join(', ')}
Composition: ${extractedPrompt.composition}
Mood: ${extractedPrompt.mood}`;

    const blob = new Blob([fullPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted-prompt.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTransferToBuilder = () => {
    if (!extractedPrompt) return;

    // Navigate to prompt builder with extracted data
    navigate('/prompt-builder', {
      state: {
        extractedPromptData: extractedPrompt
      }
    });
  };
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-soft-lavender mb-6">
            <span className="text-electric-cyan">Prompt</span> Extractor
          </h1>
          <p className="text-soft-lavender/70 text-lg md:text-xl max-w-3xl mx-auto">
            Upload any image and let our AI analyze it to generate detailed prompts for recreating similar artwork
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h2 className="text-xl font-bold text-soft-lavender mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-electric-cyan" />
                Upload Image
              </h2>
              
              <div
                className="border-2 border-dashed border-border-color rounded-lg p-8 text-center transition-colors hover:border-cosmic-purple/40"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-error-red text-white rounded-full p-1 hover:bg-error-red/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex justify-center mb-4">
                      <ImageIcon className="w-12 h-12 text-electric-cyan" />
                    </div>
                    <p className="text-soft-lavender/70 mb-4">
                      Click to upload or drag and drop your image here
                    </p>
                    <p className="text-soft-lavender/50 text-sm mb-4">
                      Supports JPG, PNG, WebP (max. 10MB)
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Error Display */}
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

            {/* Analysis Button */}
            {selectedImage && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleExtractPrompt}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Extract Prompt
                  </>
                )}
              </Button>
            )}

            {/* Features Section */}
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-soft-lavender mb-4">What We Analyze</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cosmic-purple/20 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-cosmic-purple" />
                  </div>
                  <span className="text-soft-lavender/70 text-sm">Visual Elements</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-electric-cyan/20 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-electric-cyan" />
                  </div>
                  <span className="text-soft-lavender/70 text-sm">Camera & Lens</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-pink/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-neon-pink" />
                  </div>
                  <span className="text-soft-lavender/70 text-sm">Style & Mood</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-green/20 flex items-center justify-center">
                    <Music className="w-4 h-4 text-success-green" />
                  </div>
                  <span className="text-soft-lavender/70 text-sm">Audio Vibe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-soft-lavender">Extracted Prompt</h2>
                {extractedPrompt && (
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
                      variant="primary"
                      size="sm"
                      onClick={handleTransferToBuilder}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Transfer to Builder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPrompt}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-deep-bg border border-border-color rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center h-full text-soft-lavender/50">
                    <div className="animate-spin mb-4">
                      <Sparkles className="w-8 h-8 text-electric-cyan" />
                    </div>
                    <p>Analyzing your image with AI...</p>
                    <p className="text-sm mt-2">This may take a few moments</p>
                  </div>
                ) : extractedPrompt ? (
                  <div className="space-y-6">
                    {/* Main Prompt */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Main Prompt</h3>
                      <p className="text-soft-lavender/80 leading-relaxed">{extractedPrompt.mainPrompt}</p>
                    </div>

                    {/* Camera & Lens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-soft-lavender mb-2">Camera</h3>
                        <div className="bg-cosmic-purple/20 text-cosmic-purple rounded-lg p-3">
                          {extractedPrompt.camera}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-soft-lavender mb-2">Lens</h3>
                        <div className="bg-electric-cyan/20 text-electric-cyan rounded-lg p-3">
                          {extractedPrompt.lens}
                        </div>
                      </div>
                    </div>

                    {/* Lighting */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Lighting</h3>
                      <p className="text-soft-lavender/80">{extractedPrompt.lighting}</p>
                    </div>

                    {/* Color Palette */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Color Palette</h3>
                      <div className="flex flex-wrap gap-2">
                        {extractedPrompt.colorPalette.map((color, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-neon-pink/20 text-neon-pink rounded-full text-sm"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Audio Vibe */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2 flex items-center gap-2">
                        <Music className="w-5 h-5 text-success-green" />
                        Audio Vibe
                      </h3>
                      <div className="bg-success-green/20 text-success-green rounded-lg p-3">
                        {extractedPrompt.audioVibe}
                      </div>
                    </div>

                    {/* Style Elements */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Style Elements</h3>
                      <div className="flex flex-wrap gap-2">
                        {extractedPrompt.styleElements.map((element, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-cosmic-purple/20 text-cosmic-purple rounded-full text-sm"
                          >
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Technical Details</h3>
                      <div className="flex flex-wrap gap-2">
                        {extractedPrompt.technicalDetails.map((detail, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-electric-cyan/20 text-electric-cyan rounded-full text-sm"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Composition */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Composition</h3>
                      <p className="text-soft-lavender/80">{extractedPrompt.composition}</p>
                    </div>

                    {/* Mood */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Mood & Atmosphere</h3>
                      <p className="text-soft-lavender/80">{extractedPrompt.mood}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-soft-lavender/50">
                    <Wand2 className="w-8 h-8 mb-4" />
                    <p>Upload an image and click "Extract Prompt" to begin analysis</p>
                  </div>
                )}
              </div>
            </div>
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
                <h3 className="text-lg font-semibold text-soft-lavender">Image Quality</h3>
                <ul className="space-y-2 text-soft-lavender/70">
                  <li>• Use high-resolution images (at least 1024x1024)</li>
                  <li>• Ensure good lighting and clarity</li>
                  <li>• Avoid heavily compressed or pixelated images</li>
                  <li>• Clear subject focus works best</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-soft-lavender">Best Practices</h3>
                <ul className="space-y-2 text-soft-lavender/70">
                  <li>• Single subject images work better than complex scenes</li>
                  <li>• Professional photography yields more detailed prompts</li>
                  <li>• Artistic styles are well-recognized</li>
                  <li>• Review and refine extracted prompts as needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptExtractor;
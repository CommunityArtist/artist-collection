import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Wand2, Copy, Download, X, Eye, Sparkles, Zap, Camera } from 'lucide-react';
import Button from '../components/Button';

interface ExtractedPrompt {
  mainPrompt: string;
  styleElements: string[];
  technicalDetails: string[];
  colorPalette: string[];
  composition: string;
  lighting: string;
  mood: string;
}

const PromptExtractor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedPrompt, setExtractedPrompt] = useState<ExtractedPrompt | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedPrompt(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedPrompt(null);
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
  };

  const handleExtractPrompt = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    
    // Simulate AI analysis - in a real implementation, this would call an AI service
    setTimeout(() => {
      // Mock extracted prompt data
      const mockPrompt: ExtractedPrompt = {
        mainPrompt: "A professional portrait of a young woman with flowing auburn hair, wearing a cream-colored silk blouse, sitting in a modern minimalist studio setting with soft natural lighting from a large window. The composition follows the rule of thirds with the subject positioned slightly off-center. Shot with a Canon EOS R5 using an 85mm f/1.4 lens at f/2.8, creating a shallow depth of field with creamy bokeh in the background.",
        styleElements: [
          "Professional portrait photography",
          "Minimalist aesthetic",
          "Contemporary fashion",
          "Clean composition",
          "Soft natural lighting"
        ],
        technicalDetails: [
          "Canon EOS R5 camera",
          "85mm f/1.4 lens",
          "Aperture: f/2.8",
          "Shallow depth of field",
          "Natural window lighting",
          "ISO 200-400 range"
        ],
        colorPalette: [
          "Warm cream tones",
          "Soft auburn highlights",
          "Neutral beige background",
          "Golden hour warmth",
          "Subtle skin tone variations"
        ],
        composition: "Rule of thirds positioning with subject slightly off-center, creating visual balance and drawing attention to the subject's eyes and expression",
        lighting: "Soft, diffused natural light from a large window positioned at 45-degree angle, creating gentle shadows and highlighting facial features",
        mood: "Professional yet approachable, confident and serene, with a contemporary and sophisticated atmosphere"
      };

      setExtractedPrompt(mockPrompt);
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleCopyPrompt = async () => {
    if (!extractedPrompt) return;

    const fullPrompt = `${extractedPrompt.mainPrompt}

Style Elements: ${extractedPrompt.styleElements.join(', ')}
Technical Details: ${extractedPrompt.technicalDetails.join(', ')}
Color Palette: ${extractedPrompt.colorPalette.join(', ')}
Composition: ${extractedPrompt.composition}
Lighting: ${extractedPrompt.lighting}
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

Style Elements: ${extractedPrompt.styleElements.join(', ')}
Technical Details: ${extractedPrompt.technicalDetails.join(', ')}
Color Palette: ${extractedPrompt.colorPalette.join(', ')}
Composition: ${extractedPrompt.composition}
Lighting: ${extractedPrompt.lighting}
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
                  <span className="text-soft-lavender/70 text-sm">Technical Details</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-pink/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-neon-pink" />
                  </div>
                  <span className="text-soft-lavender/70 text-sm">Style & Mood</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-green/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-success-green" />
                  </div>
                  <span className="text-soft-lavender/70 text-sm">Composition</span>
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
                    <p>Analyzing your image...</p>
                    <p className="text-sm mt-2">This may take a few moments</p>
                  </div>
                ) : extractedPrompt ? (
                  <div className="space-y-6">
                    {/* Main Prompt */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Main Prompt</h3>
                      <p className="text-soft-lavender/80 leading-relaxed">{extractedPrompt.mainPrompt}</p>
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

                    {/* Composition */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Composition</h3>
                      <p className="text-soft-lavender/80">{extractedPrompt.composition}</p>
                    </div>

                    {/* Lighting */}
                    <div>
                      <h3 className="text-lg font-semibold text-soft-lavender mb-2">Lighting</h3>
                      <p className="text-soft-lavender/80">{extractedPrompt.lighting}</p>
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
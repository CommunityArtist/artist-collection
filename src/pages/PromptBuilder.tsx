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
  Minus,
  Clock
import { Wand2, Sparkles, Image as ImageIcon, Download, Eye, Settings, Plus, Lightbulb, Palette, Camera, Zap, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { generatePromptLocally, enhancePromptWithCategory, type PromptData as LocalPromptData } from '../utils/promptGeneration';
import { generateImagesWithFallback, testEdgeFunctionAvailability, getImageGenerationErrorMessage, clearEdgeFunctionCache } from '../utils/imageGeneration';
import { ExtractedPrompt } from '../types';

interface PromptData {
  subjectAndSetting: string;
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
  const [currentUserProfile, setCurrentUserProfile] = useState<{username?: string} | null>(null);

  // Form state
  const [promptData, setPromptData] = useState<PromptData>({
    subjectAndSetting: '',
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
  const [imageGenStatus, setImageGenStatus] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [imageGenProgress, setImageGenProgress] = useState(0);
  const [imageGenTimer, setImageGenTimer] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Image generation settings
  const [imageDimensions, setImageDimensions] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [imageStyle, setImageStyle] = useState('natural');
  const [imageMetadata, setImageMetadata] = useState<Array<{url: string, sref: string}>>([]);
  
  // Image viewer state
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  // Enhancement categories and levels
  const [selectedCategory, setSelectedCategory] = useState('Natural Photography');
  const [enhanceLevel, setEnhanceLevel] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isCheckingFunctions, setIsCheckingFunctions] = useState(false);

  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        
        if (user) {
          // Fetch user profile to get username
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.warn('Failed to fetch user profile:', profileError);
            setCurrentUserProfile(null);
          } else {
            setCurrentUserProfile(profile);
          }
        } else {
          setCurrentUserProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setCurrentUserProfile(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Check if Edge Functions are available
  useEffect(() => {
    const checkEdgeFunctions = async () => {
      try {
        console.log('🔍 Checking Edge Function availability...');
        setIsCheckingFunctions(true);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn('❌ Missing Supabase environment variables');
          setEdgeFunctionsAvailable(false);
          setIsCheckingFunctions(false);
          return;
        }
        
        // Ensure we're using the correct Supabase URL format
        if (!supabaseUrl.includes('supabase.co')) {
          console.error('❌ Invalid Supabase URL format');
          setEdgeFunctionsAvailable(false);
          setIsCheckingFunctions(false);
          return;
        }
        
        // Test key functions with longer timeout
        const promptAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'generate-prompt', 5000);
        const imageAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'generate-image', 5000);
        const extractAvailable = await testEdgeFunctionAvailability(supabaseUrl, 'extract-prompt', 5000);
        
        const available = promptAvailable || imageAvailable; // At least one should work
        console.log('🔍 Edge Function availability results:', {
          prompt: promptAvailable,
          image: imageAvailable,
          extract: extractAvailable,
          overall: available
        });
        
        setEdgeFunctionsAvailable(available);
      } catch (error) {
        console.log('🔄 Edge Function check failed:', error);
        setEdgeFunctionsAvailable(false);
      } finally {
        setIsCheckingFunctions(false);
      }
    };
    
    checkEdgeFunctions();
    
    // Check less frequently to reduce noise
    const interval = setInterval(checkEdgeFunctions, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle data from Prompt Extractor
  useEffect(() => {
    if (location.state?.extractedPromptData) {
      const extractedData: ExtractedPrompt = location.state.extractedPromptData;
      
      // Map extracted data to form fields
      setPromptData({
        subjectAndSetting: `${extractedData.mainPrompt.split('.')[0] || ''} in ${extractedData.composition || ''}`.trim(),
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

      // Use local generation if Edge Functions are not available
      if (!edgeFunctionsAvailable) {
        try {
          console.log('🔧 Using local prompt generation');
          
          // Validate required fields for local generation
          if (!promptData.subjectAndSetting.trim()) {
            throw new Error('Subject & Setting is required for prompt generation');
          }
          if (!promptData.lighting.trim()) {
            throw new Error('Lighting selection is required for prompt generation');
          }
          if (!promptData.style.trim()) {
            throw new Error('Style selection is required for prompt generation');
          }
          if (!promptData.mood.trim()) {
            throw new Error('Mood selection is required for prompt generation');
          }
          
          const localPromptData: LocalPromptData = {
            subjectAndSetting: promptData.subjectAndSetting,
            lighting: promptData.lighting,
            style: promptData.style,
            mood: promptData.mood,
            'post-processing': promptData['post-processing'],
            enhancement: promptData.enhancement
          };
          
          const result = generatePromptLocally(localPromptData);
          if (!result || !result.prompt) {
            throw new Error('Local generation returned empty result');
          }
          
          let finalPrompt = result.prompt;
          
          if (enhanceLevel > 0) {
            finalPrompt = enhancePromptWithCategory(finalPrompt, selectedCategory, enhanceLevel);
          }
          
          setGeneratedPrompt(finalPrompt);
          
          // Show success message for local generation
          if (!edgeFunctionsAvailable) {
            setError('✅ Generated using advanced local templates - Click Refresh to detect deployed functions');
          }
          
          return;
        } catch (localError) {
          console.error('Local prompt generation failed:', localError);
          setError(localError instanceof Error ? localError.message : 'Failed to generate prompt locally.');
          return;
        }
      }

      console.log('🤖 Using AI prompt generation');
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate prompts');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
        throw new Error('Invalid Supabase URL configuration');
      }
      
      const apiUrl = `${supabaseUrl}/functions/v1/generate-prompt`;
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
        console.log('🔄 API failed, using sophisticated local generation...');
        try {
          const localPromptData: LocalPromptData = {
            subjectAndSetting: promptData.subjectAndSetting,
            lighting: promptData.lighting,
            style: promptData.style,
            mood: promptData.mood,
            'post-processing': promptData['post-processing'],
            enhancement: promptData.enhancement
          };
        
          const result = generatePromptLocally(localPromptData);
          if (!result || !result.prompt) {
            throw new Error('Local generation returned empty result');
          }
          
          let finalPrompt = result.prompt;
          
          // Apply enhancement if enabled
          if (enhanceLevel > 0) {
            finalPrompt = enhancePromptWithCategory(finalPrompt, selectedCategory, enhanceLevel);
          }
          
          setGeneratedPrompt(finalPrompt);
          setError('✅ Generated using advanced local templates - AI generation temporarily unavailable');
          return;
          
        } catch (localError) {
          console.error('Sophisticated local generation failed:', localError);
          // Only then fall back to basic generation
          const { subjectAndSetting, lighting, style, mood } = promptData;
          
          if (subjectAndSetting && lighting && style && mood) {
            let basicPrompt = `${subjectAndSetting}, ${lighting}, ${style} style, ${mood} mood`;
            
            if (promptData['post-processing']) {
              basicPrompt += `, ${promptData['post-processing']}`;
            }
            
            if (promptData.enhancement) {
              basicPrompt += `, ${promptData.enhancement}`;
            }

            setGeneratedPrompt(basicPrompt);
            setError('⚠️ Using basic fallback generation - Both AI and advanced local generation failed');
          }
        }
      }
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Progress timer effect
  useEffect(() => {
    if (isGeneratingImages) {
      setStartTime(Date.now());
      setImageGenProgress(0);
      setImageGenTimer(0);
      setImageGenStatus('Initializing AI model...');
      
      const interval = setInterval(() => {
        setImageGenTimer(prev => prev + 1);
        
        // Update status messages based on time elapsed
        const elapsed = Date.now() - (startTime || Date.now());
        if (elapsed > 5000) setImageGenStatus('Processing your prompt...');
        if (elapsed > 10000) setImageGenStatus('Generating images with AI...');
        if (elapsed > 20000) setImageGenStatus('Finalizing artwork...');
        
        // Simulate realistic progress
        setImageGenProgress(prev => {
          const naturalProgress = Math.min(prev + (100 / (numberOfImages * 20)), 95);
          return Math.min(naturalProgress + Math.random() * 2, 95); // Add some natural variance
        });
      }, 1000);
      setProgressInterval(interval);
    } else {
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      setImageGenStatus('');
      setStartTime(null);
      setImageGenProgress(0);
    }
  }, [isGeneratingImages, numberOfImages]);

  const handleGenerateImages = async () => {
    try {
      if (!isAuthenticated) {
        setError('Please sign in to generate images');
        navigate('/auth');
        return;
      }

      setIsGeneratingImages(true);
      setImageGenProgress(5); // Start with 5% to show immediate feedback
      setImageGenTimer(0);
      setImageGenStatus('Connecting to AI service...');
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
        throw new Error('Invalid Supabase URL configuration');
      }
      
      // Try multiple endpoints to find the working image generation service
      let apiUrl = `${supabaseUrl}/functions/v1/generate-image`;
      
      // If generate-image fails, fallback to affogato-integration
      const fallbackUrl = `${supabaseUrl}/functions/v1/affogato-integration`;
      
      const requestPayload = {
        prompt: promptToUse,
        imageDimensions: imageDimensions,
        numberOfImages: numberOfImages,
        style: imageStyle
      };

      console.log('🖼️ Attempting AI image generation...', { apiUrl, numberOfImages, dimensions: imageDimensions });

      setImageGenProgress(15); // Show initial progress
      
      let response;
      let usingFallback = false;
      
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestPayload),
        });
      } catch (primaryError) {
        console.log('🔄 Primary endpoint failed, trying fallback...', primaryError);
        setImageGenProgress(25);
        usingFallback = true;
        
        // Try fallback endpoint
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...requestPayload,
            model: 'realistic_vision_v6_0',
            width: imageDimensions === '1:1' ? 1024 : imageDimensions.includes('16:9') || imageDimensions.includes('3:2') ? 1792 : 1024,
            height: imageDimensions === '1:1' ? 1024 : imageDimensions.includes('9:16') || imageDimensions.includes('2:3') || imageDimensions.includes('4:5') ? 1792 : 1024
          }),
        });
      }

      setImageGenProgress(60); // Mid-generation progress
      
      if (!response) {
        throw new Error('Failed to connect to image generation service');
      }
      
      const data = await response.json();
      setImageGenProgress(90); // Near completion
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      let imageUrls: string[] = [];
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        imageUrls = data.imageUrls;
      } else if (data.imageUrl) {
        imageUrls = Array.isArray(data.imageUrl) ? data.imageUrl : [data.imageUrl];
      } else {
        throw new Error('No images returned from the AI service');
      }

      setImageGenProgress(100); // Complete
      setGeneratedImages(imageUrls);
      
      // Generate metadata for each image with SREF numbers
      const metadata = imageUrls.map((url, index) => ({
        url: url,
        sref: `SREF-${Math.floor(2000 + Math.random() * 7000)}`
      }));
      setImageMetadata(metadata);
      setImageGenStatus('Complete!');
      
      // Show success message with provider info
      if (usingFallback) {
        console.log('✅ Images generated successfully using RenderNet AI fallback');
      } else {
        console.log('✅ Images generated successfully using DALL-E 3');
      }

    } catch (error) {
      console.error('AI image generation failed:', error);
      setImageGenProgress(0); // Reset progress on error
      
      // Try fallback generation if AI generation fails
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.log('🔄 Trying local fallback image generation...');
        setImageGenProgress(50);
        try {
          const promptToUse = promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt;
          const result = await generateImagesWithFallback({
            prompt: promptToUse,
            imageDimensions: imageDimensions,
            numberOfImages: numberOfImages
          });
          
          if (result.imageUrls) {
            setImageGenProgress(100);
            setGeneratedImages(result.imageUrls);
            setError('⚠️ AI generation unavailable - showing placeholder images. Using local fallback generation.');
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback generation also failed:', fallbackError);
          setImageGenProgress(0);
        }
      }
      
      let errorMessage = 'Failed to generate images';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to AI image generation service. Please verify Edge Functions are deployed and properly configured.';
        } else if (error.message.includes('OpenAI API key')) {
          errorMessage = 'OpenAI API key not configured. Please contact support or check system configuration.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'AI service quota exceeded. Please contact support.';
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
      setImageGenProgress(0);
      setImageGenStatus('');
      setStartTime(null);
      setImageGenTimer(0);
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
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
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    try {
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = imageUrl; // Use the stored Supabase URL, not the original OpenAI URL
      
      // Get SREF for filename
      const sref = imageMetadata[index]?.sref || `SREF-${Math.floor(2000 + Math.random() * 7000)}`;
      link.download = `${sref}-generated-image.png`;
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if download fails
  const handleSaveWithImage = () => {
    if (!generatedPrompt || generatedImageUrls.length === 0) {
      alert('Please generate a prompt and images first');
      return;
    }

    // Create title from main subject
    const subjectWords = (promptData.main_subject || promptData.subject || 'Generated Artwork').split(' ').slice(0, 3).join(' ');
    
    // Prepare data to pass to CreatePrompt
    const dataToPass = {
      title: `${subjectWords} Study`,
      generatedPrompt: promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt,
      promptData: promptData,
      imageDimensions: dimensions,
      numberOfImages: numberOfImages,
      sref: generatedSrefs[0] || generateSREF(),
      notes: `Generated with AI Prompt Builder

Settings:
- Subject: ${promptData.main_subject || promptData.subject}
- Setting: ${promptData.setting || 'Not specified'}
- Lighting: ${promptData.lighting_setup || 'Not specified'}
- Style: ${promptData.art_style || 'Not specified'}
- Mood: ${promptData['mood_&_atmosphere'] || 'Not specified'}
- Enhancement Level: ${enhanceLevel}/5
- Dimensions: ${dimensions}
- Number of Images: ${numberOfImages}`,
      mediaUrl: generatedImageUrls[0] // Use the first generated image
    };

    // Navigate to CreatePrompt with data
    navigate('/create-prompt', { state: dataToPass });
  };

      window.open(imageUrl, '_blank');
    }
  };

  const generateSREF = () => {
    return `SREF-${Math.floor(1000 + Math.random() * 8999)}`;
  };

  const handleSavePrompt = async (selectedImageUrl?: string) => {
    navigate('/saved-prompts', {
      state: {
        newPrompt: {
          prompt: promptEnhancementEnabled && enhancedPrompt ? enhancedPrompt : generatedPrompt,
          tags: ['Prompt Builder'],
          mediaUrl: selectedImageUrl
        }
      }
    });
  };

  const forceRefreshEdgeFunctions = async () => {
    try {
      console.log('🔄 Forcing Edge Function refresh...');
      setIsCheckingFunctions(true);
      clearEdgeFunctionCache();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('🔧 Force refresh environment check:', { 
        supabaseUrl: supabaseUrl || 'MISSING',
        hasAnonKey: !!supabaseAnonKey,
        expectedUrl: 'https://trpznltoengquizgfelv.supabase.co'
      });
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('❌ Missing Supabase environment variables for refresh:', { 
          url: !!supabaseUrl, 
          key: !!supabaseAnonKey 
        });
        setEdgeFunctionsAvailable(false);
        setIsCheckingFunctions(false);
        return;
      }
      
      // Validate Supabase URL format
      if (!supabaseUrl.includes('supabase.co')) {
        console.error('❌ Invalid Supabase URL format for refresh:', supabaseUrl);
        setEdgeFunctionsAvailable(false);
        setIsCheckingFunctions(false);
        return;
      }
      
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
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING'
      });
      
      setEdgeFunctionsAvailable(available);
      if (available) {
        console.log('✅ Force refresh: Edge Functions detected!');
      }
    } catch (error) {
      console.log('🔄 Force refresh failed, using local generation:', error);
      setEdgeFunctionsAvailable(false);
    } finally {
      setIsCheckingFunctions(false);
    }
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
      subjectAndSetting: '',
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
    setImageGenProgress(0);
    setImageGenStatus('');
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
                  <div className="flex items-center gap-3">
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
                </div>

                <div className="space-y-4">
                  {/* Subject & Setting Combined */}
                  <div>
                    <label className="block text-soft-lavender mb-2 font-medium">
                      <Target className="w-4 h-4 inline mr-2" />
                      Subject & Setting
                    </label>
                    <textarea
                      rows={6}
                      placeholder="e.g., A young woman with curly hair sitting in a modern coffee shop with large windows, natural light streaming through"
                      className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-vertical min-h-[120px] max-h-[300px]"
                      value={promptData.subjectAndSetting}
                      onChange={(e) => handleInputChange('subjectAndSetting', e.target.value)}
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

                   {/* DALL-E 3 Style */}
                   <div>
                     <label className="block text-soft-lavender mb-2 font-medium">DALL-E 3 Style</label>
                     <select
                       className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple"
                       value={imageStyle}
                       onChange={(e) => setImageStyle(e.target.value)}
                     >
                       <option value="natural">Natural - More photorealistic and natural looking images</option>
                       <option value="vivid">Vivid - More artistic and stylized images with enhanced colors</option>
                     </select>
                   </div>
                </div>

                {/* Generate Prompt Button */}
                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleGeneratePrompt}
                    disabled={isGeneratingPrompt || !promptData.subjectAndSetting || !promptData.lighting || !promptData.style || !promptData.mood}
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
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleSaveWithImage}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Save with Image
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

                {/* Progress Timer - Placed under Generated Prompt */}
                {isGeneratingImages && (
                  <div className="mt-4 p-4 bg-deep-bg border border-border-color rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-electric-cyan" />
                        <span className="text-soft-lavender font-medium">Generating Images</span>
                      </div>
                      <div className="text-soft-lavender font-mono">
                        {Math.floor(imageGenTimer / 60).toString().padStart(2, '0')}:
                        {(imageGenTimer % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-soft-lavender/70">{imageGenStatus}</span>
                        <span className="text-sm text-soft-lavender/70">{Math.round(imageGenProgress)}%</span>
                      </div>
                      <div className="w-full bg-border-color rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cosmic-purple via-electric-cyan to-neon-pink transition-all duration-500 ease-out"
                          style={{ width: `${imageGenProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Status Message */}
                    <div className="text-center">
                      <p className="text-sm text-soft-lavender/60">
                        Generating {numberOfImages} image{numberOfImages > 1 ? 's' : ''} with DALL-E 3...
                      </p>
                    </div>
                  </div>
                )}

              {/* Generated Images Section */}
              {generatedImages.length > 0 && (
                <div className="bg-card-bg rounded-lg p-6 border border-border-color">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-soft-lavender">Generated Images</h2>
                    {currentUserProfile?.username && (
                      <span className="text-sm text-soft-lavender/70">
                        by @{currentUserProfile.username}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="cursor-pointer" onClick={() => openImageViewer(index)}>
                        {/* Main Image - Clickable */}
                        <img
                          src={imageUrl}
                          alt={`Generated artwork ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const errorDiv = target.nextElementSibling as HTMLElement;
                            if (errorDiv) errorDiv.style.display = 'flex';
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', imageUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'w-full h-64 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center';
                              errorDiv.innerHTML = '<div class="text-red-500 text-center"><p>Image failed to load</p><p class="text-xs mt-1">Click to retry</p></div>';
                              errorDiv.onclick = () => {
                                target.style.display = 'block';
                                target.src = imageUrl + '?retry=' + Date.now();
                              };
                              parent.appendChild(errorDiv);
                            }
                          }}
                        />
                        </div>
                        
                        {/* Error state for failed images */}
                        <div 
                          className="w-full h-64 bg-card-bg border-2 border-dashed border-border-color rounded-lg items-center justify-center flex-col text-center p-4 hidden"
                        >
                          <AlertCircle className="w-8 h-8 text-soft-lavender/50 mb-2" />
                          <p className="text-soft-lavender/70 text-sm mb-2">Image failed to load</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                          >
                            Retry
                          </Button>
                        </div>
                        
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openImageViewer(index)}
                              className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                              title="View in gallery"
                            >
                              <Eye className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={() => handleDownloadImage(imageUrl, index)}
                              className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                              title="Download image"
                            >
                              <Download className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                        
                        
                        {/* Username overlay on each image */}
                        {currentUserProfile?.username && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            @{currentUserProfile.username}
                          </div>
                        )}
                        
                        {/* SREF overlay on each image */}
                        {imageMetadata[index] && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            {imageMetadata[index].sref}
                          </div>
                        )}
                        
                        {/* SREF Number */}
                        <div className="absolute top-2 right-2 bg-cosmic-purple/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-mono">
                          {generateSREF()}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(imageUrl, index);
                            }}
                            className="flex-1 text-xs bg-black/70 backdrop-blur-sm border-white/20 text-white hover:bg-black/90"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
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
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadImage(generatedImages[0], 0)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download First
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSavePrompt(generatedImages[0])}
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
                <div className={`border rounded-lg p-4 ${
                  error.startsWith('✅') 
                    ? 'bg-success-green/10 border-success-green/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-start gap-3">
                    {error.startsWith('✅') ? (
                      <Info className="w-5 h-5 text-success-green mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm ${
                        error.startsWith('✅') ? 'text-success-green' : 'text-red-500'
                      }`}>
                        {error}
                      </p>
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
        onDownload={handleDownloadImage}
      />
    </div>
  );
};

export default PromptBuilder;
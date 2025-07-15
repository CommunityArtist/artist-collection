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
  // ... [rest of the code remains unchanged until handleSavePrompt]

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

  // ... [rest of the code remains unchanged]

  return (
    // ... [rest of the JSX remains unchanged]
  );
};

export default PromptBuilder;
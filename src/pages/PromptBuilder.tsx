import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Camera, Palette, Sparkles, Settings, Copy, Image as ImageIcon, Plus, Sliders, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import ImageViewerModal from '../components/ImageViewerModal';
import { supabase } from '../lib/supabase';
import { PromptTag } from '../types';

// [Previous code remains the same until the end]

const PromptBuilder: React.FC = () => {
  // [All the component code remains exactly the same]
};

export default PromptBuilder;

// Added missing closing brackets for ChevronLeft/ChevronRight buttons section:
<button
  key={index}
  onClick={() => setCurrentImageIndex(index)}
  className={`w-2 h-2 rounded-full transition-colors ${
    index === currentImageIndex ? 'bg-electric-cyan' : 'bg-border-color hover:bg-cosmic-purple/50'
  }`}
>
</button>
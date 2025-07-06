export interface StatCounterProps {
  value: string;
  label: string;
}

export interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export interface NavItem {
  label: string;
  href: string;
  dropdown?: {
    label: string;
    href: string;
  }[];
}

export interface FooterColumn {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}

export type PromptTag = 
  | 'Illustration' 
  | 'Photography' 
  | 'Graphics' 
  | 'Product' 
  | '3D' 
  | 'Architecture' 
  | 'Fashion' 
  | 'ChatGPT' 
  | 'FreePik' 
  | 'Leonardo Ai'
  | 'Digen Ai'
  | 'Animals'
  | 'Anime'
  | 'Character'
  | 'Food'
  | 'Sci-Fi';

export interface Collection {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface PromptCollection {
  prompt_id: string;
  collection_id: string;
}

export interface Prompt {
  id: string;
  title: string;
  prompt: string;
  notes?: string;
  sref?: string;
  media_url?: string;
  created_at: string;
  is_private: boolean;
  user_id: string;
  seed?: string;
  tags?: PromptTag[];
  profiles?: {
    username: string;
  };
  collections?: Collection[];
}

export interface ExtractedPrompt {
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
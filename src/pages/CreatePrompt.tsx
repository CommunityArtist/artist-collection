import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { Image, Film, Eye, EyeOff, X, Plus, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PromptTag } from '../types';

const AVAILABLE_TAGS: PromptTag[] = [
  '3D',
  'Animals',
  'Anime',
  'Architecture',
  'Character',
  'Fashion',
  'Food',
  'Graphics',
  'Illustration',
  'Photography',
  'Product',
  'Sci-Fi',
  'Adobe Firefly',
  'ChatGPT',
  'ChatGPT / OpenAI',
  'Claude / Anthropic',
  'DALL-E (OpenAI)',
  'Digen Ai',
  'FreePik',
  'Gemini / Google AI',
  'Grok / xAI',
  'HeyGen',
  'Leonardo Ai',
  'Llama / Meta AI',
  'Luma AI',
  'Midjourney',
  'Mistral AI',
  'Pika Labs',
  'Playground AI',
  'Prompt Builder',
  'Runway',
  'Sora (OpenAI)',
  'Stable Diffusion',
  'Synthesia'  
];

const CreatePrompt: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [notes, setNotes] = useState('');
  const [sref, setSref] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
        navigate('/auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!editId) return;

      try {
        const { data: prompt, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) throw error;

        if (prompt) {
          setTitle(prompt.title);
          setPrompt(prompt.prompt);
          setNotes(prompt.notes || '');
          setSref(prompt.sref || '');
          setIsPrivate(prompt.is_private);
          setSelectedTags(prompt.tags || []);
          if (prompt.media_url) {
            setPreviewUrl(prompt.media_url);
            setIsVideo(prompt.media_url.match(/\.(mp4|webm|ogg)$/i) ? true : false);
          }
        }
      } catch (error) {
        console.error('Error fetching prompt:', error);
        alert('Failed to fetch prompt details');
        navigate('/library/my');
      }
    };

    fetchPrompt();
  }, [editId, navigate]);

  // Handle data from Prompt Builder
  useEffect(() => {
    if (location.state?.generatedPrompt && location.state?.promptData) {
      const { 
        title: generatedTitle,
        generatedPrompt, 
        promptData, 
        imageDimensions, 
        numberOfImages, 
        sref: generatedSref,
        notes: generatedNotes,
        mediaUrl
      } = location.state;
      
      // Generate a title based on the subject
      const subjectWords = promptData.subject.split(' ').slice(0, 3).join(' ');
      setTitle(subjectWords || 'Generated Prompt');
      
      // Set title, SREF, and notes if provided
      if (generatedTitle) setTitle(generatedTitle);
      if (generatedSref) setSref(generatedSref);
      if (generatedNotes) setNotes(generatedNotes);
      
      // Set the generated prompt
      setPrompt(generatedPrompt);
      
      // Create detailed notes from the prompt data
      const notesArray = [];
      if (promptData.setting) notesArray.push(`Setting: ${promptData.setting}`);
      if (promptData.lighting) notesArray.push(`Lighting: ${promptData.lighting}`);
      if (promptData.style) notesArray.push(`Style: ${promptData.style}`);
      if (promptData.mood) notesArray.push(`Mood: ${promptData.mood}`);
      if (promptData['post-processing']) notesArray.push(`Post-processing: ${promptData['post-processing']}`);
      if (promptData.enhancement) notesArray.push(`Enhancement: ${promptData.enhancement}`);
      if (imageDimensions) notesArray.push(`Dimensions: ${imageDimensions}`);
      if (numberOfImages) notesArray.push(`Images generated: ${numberOfImages}`);
      
      setNotes(notesArray.join('\n'));
      
      // Set default privacy to false for shared prompts
      setIsPrivate(false);
      
      // Set media URL if provided
      if (mediaUrl) {
        setPreviewUrl(mediaUrl);
        setIsVideo(mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? true : false);
      }
      
      // Add relevant tags based on the prompt data
      const autoTags = [];
      if (promptData.style) {
        if (promptData.style.toLowerCase().includes('photography')) autoTags.push('Photography');
        if (promptData.style.toLowerCase().includes('portrait')) autoTags.push('Character');
        if (promptData.style.toLowerCase().includes('fashion')) autoTags.push('Fashion');
        if (promptData.style.toLowerCase().includes('cinematic')) autoTags.push('Photography');
      }
      if (promptData.subject) {
        if (promptData.subject.toLowerCase().includes('woman') || promptData.subject.toLowerCase().includes('man') || promptData.subject.toLowerCase().includes('person')) {
          autoTags.push('Character');
        }
      }
      // Add Prompt Builder tag to indicate source
      autoTags.push('Prompt Builder');
      
      setSelectedTags(autoTags.filter((tag, index, self) => self.indexOf(tag) === index) as PromptTag[]);
      
      // Set media URL if provided (from selected image)
      if (mediaUrl) {
        setPreviewUrl(mediaUrl);
        setIsVideo(mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? true : false);
      }
      
      // Clear the location state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Only image or video files are allowed');
        return;
      }

      setSelectedFile(file);
      setIsVideo(file.type.startsWith('video/'));
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Only image or video files are allowed');
        return;
      }

      setSelectedFile(file);
      setIsVideo(file.type.startsWith('video/'));
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleTagSelect = (tag: PromptTag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: PromptTag) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleClearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
  };
  
  const handleSavePrompt = async () => {
    try {
      setIsLoading(true);

      if (!title || !prompt) {
        alert('Title and prompt are required');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to create a prompt');
        return;
      }

      let mediaUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('prompt-media')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('prompt-media')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      const promptData = {
        title,
        prompt,
        notes,
        sref,
        media_url: mediaUrl || previewUrl,
        user_id: user.id,
        is_private: isPrivate,
        tags: selectedTags
      };

      if (editId) {
        // Update existing prompt
        const { error } = await supabase
          .from('prompts')
          .update(promptData)
          .eq('id', editId);

        if (error) throw error;
      } else {
        // Create new prompt
        const { error } = await supabase
          .from('prompts')
          .insert(promptData);

        if (error) throw error;
      }

      navigate('/library/my');
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-soft-lavender">
            {editId ? 'Edit Prompt' : 'Add Prompt'}
          </h1>

          <div>
            <label className="block text-soft-lavender mb-2">Title</label>
            <input
              type="text"
              placeholder="Enter a title for your prompt"
              className="w-full bg-card-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-soft-lavender mb-2">Notes</label>
            <textarea
              placeholder="Add notes about the creation process (optional)"
              className="w-full bg-card-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none h-32"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-soft-lavender mb-2">Media (Image or Video)</label>
            <div
              className="border-2 border-dashed border-border-color rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <div className="relative">
                  {isVideo ? (
                    <div className="relative max-h-64 mx-auto">
                      <video
                        ref={videoRef}
                        src={previewUrl}
                        className="max-h-64 mx-auto rounded-lg"
                        controls
                      />
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  )}
                  <button
                    onClick={handleClearPreview}
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
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <div className="flex justify-center gap-4 mb-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-electric-cyan hover:text-cosmic-purple transition-colors"
                    >
                      <Image className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-electric-cyan hover:text-cosmic-purple transition-colors"
                    >
                      <Film className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-soft-lavender/70 text-sm">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-soft-lavender/50 text-xs mt-1">
                    Images or Videos (max. 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-soft-lavender mb-2">Prompt</label>
            <textarea
              placeholder="Enter the prompt used to generate the image or video"
              className="w-full bg-card-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple resize-none h-48"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-soft-lavender mb-2">SREF</label>
            <input
              type="text"
              placeholder="Enter reference number (optional)"
              className="w-full bg-card-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
              value={sref}
              onChange={(e) => setSref(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-soft-lavender mb-2">Tags</label>
            <div className="relative">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cosmic-purple/20 text-cosmic-purple"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-electric-cyan"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="w-full justify-between"
                >
                  <span>Add Tag</span>
                  <Plus className="w-4 h-4" />
                </Button>
                {showTagDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-card-bg border border-border-color rounded-lg shadow-lg">
                    <div className="py-1">
                      {AVAILABLE_TAGS.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                        <button
                          key={tag}
                          className="w-full text-left px-4 py-2 text-soft-lavender hover:bg-cosmic-purple/10 transition-colors"
                          onClick={() => handleTagSelect(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-card-bg border border-border-color rounded-lg p-4">
            <div>
              <h3 className="text-soft-lavender font-medium">Visibility</h3>
              <p className="text-soft-lavender/70 text-sm">
                {isPrivate ? 'Only visible to you' : 'Visible to everyone'}
              </p>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`p-2 rounded-lg transition-colors ${
                isPrivate 
                  ? 'bg-cosmic-purple/20 text-cosmic-purple' 
                  : 'bg-electric-cyan/20 text-electric-cyan'
              }`}
            >
              {isPrivate ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/library/my')}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleSavePrompt}
              className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isLoading ? 'Saving...' : editId ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePrompt;
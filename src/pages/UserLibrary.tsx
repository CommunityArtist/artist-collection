import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import { Prompt, PromptTag } from '../types';
import { Copy, Download, Play, Search, Tag, Filter, RefreshCw, X, Plus, Edit, Trash2 } from 'lucide-react';

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

// Optimized Image Component for fast loading
const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  isVideo?: boolean;
}> = ({ src, alt, className = '', isVideo = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    if (!src) return;
    
    // Reset states when src changes
    setImageLoaded(false);
    setImageError(false);
    
    // For Supabase storage URLs, we can add transformation parameters for optimization
    let optimizedSrc = src;
    if (src.includes('supabase.co') && src.includes('storage/v1/object/public/')) {
      // Add width and quality parameters for faster loading of thumbnails
      optimizedSrc = `${src}?width=400&quality=80`;
    }
    
    setImageSrc(optimizedSrc);
    
    // Preload the image
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = optimizedSrc;
  }, [src]);

  if (isVideo) {
    return (
      <div className="relative w-full h-full">
        <video
          src={src}
          className={`w-full h-full object-cover ${className}`}
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-deep-bg animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-electric-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error placeholder */}
      {imageError && (
        <div className="absolute inset-0 bg-deep-bg flex items-center justify-center">
          <div className="text-soft-lavender/30 text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-xs">Failed to load</div>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};
const UserLibrary: React.FC = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);

  // Add proper error handling for database operations
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Handle special case for 'my' library
      if (username === 'my' && !user) {
        navigate('/auth');
        return;
      }

      // If username is 'my', get the current user's prompts (including private ones)
      if (username === 'my' && user) {
        const { data: userPrompts, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (promptsError) throw promptsError;
        setPrompts(userPrompts || []);
        return;
      }

      // Validate username parameter
      if (!username || username.trim() === '') {
        setError('Invalid username provided');
        setPrompts([]);
        return;
      }

      // Get user ID by username for other users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username.trim())
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError(`User "${username}" not found`);
          setPrompts([]);
          return;
        }
        throw profileError;
      }

      if (!profiles?.id) {
        setError(`User "${username}" not found`);
        setPrompts([]);
        return;
      }

      // For other users' libraries, only show public prompts
      const { data: userPrompts, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', profiles.id)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (promptsError) throw promptsError;
      setPrompts(userPrompts || []);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [username, navigate]);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const handleDownloadMedia = (url: string, title: string, isVideo: boolean) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.${isVideo ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i);
  };

  const toggleTag = (tag: PromptTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', promptId);

        if (error) throw error;

        // Refresh the prompts list after deletion
        fetchPrompts();
      } catch (err) {
        console.error('Error deleting prompt:', err);
        alert('Failed to delete prompt. Please try again.');
      }
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12 flex items-center justify-center">
        <div className="text-soft-lavender">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-soft-lavender mb-4">
              {error}
            </h1>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-soft-lavender">
              {username === 'my' ? 'My Library' : `${username}'s Library`}
            </h1>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={fetchPrompts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link to="/create-prompt">
                <Button variant="secondary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prompts
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-soft-lavender/50" />
                </div>
                <input
                  type="text"
                  placeholder="Search prompts by title, content, or tags..."
                  className="w-full bg-card-bg border border-border-color rounded-lg pl-10 pr-4 py-2 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-cosmic-purple/10' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {showFilters && (
              <div className="bg-card-bg border border-border-color rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-soft-lavender/70" />
                  <h3 className="text-soft-lavender font-medium">Filter by Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-cosmic-purple text-soft-lavender'
                          : 'bg-cosmic-purple/10 text-soft-lavender/70 hover:bg-cosmic-purple/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-soft-lavender/70">No prompts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-card-bg rounded-lg overflow-hidden border border-border-color hover:border-cosmic-purple/40 transition-all duration-300"
                >
                  <div 
                    className="aspect-square overflow-hidden bg-deep-bg cursor-pointer"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    {prompt.media_url ? (
                      <OptimizedImage
                        src={prompt.media_url}
                        alt={prompt.title}
                        className="transition-transform duration-300 hover:scale-105"
                        isVideo={isVideoUrl(prompt.media_url)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-soft-lavender/30">
                        No media
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-soft-lavender font-medium">{prompt.title}</h3>
                      {prompt.is_private && (
                        <span className="text-xs bg-cosmic-purple/20 text-cosmic-purple px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-soft-lavender/70 text-sm line-clamp-3 mb-4">{prompt.prompt}</p>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-cosmic-purple/10 text-cosmic-purple px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {username === 'my' && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/create-prompt?edit=${prompt.id}`);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error-red border-error-red hover:bg-error-red/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Details Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card-bg rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-border-color">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-soft-lavender">{selectedPrompt.title}</h2>
                {selectedPrompt.is_private && (
                  <span className="text-xs bg-cosmic-purple/20 text-cosmic-purple px-2 py-1 rounded">
                    Private
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="text-soft-lavender/70 hover:text-soft-lavender p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {selectedPrompt.media_url && (
                <div>
                  {isVideoUrl(selectedPrompt.media_url) ? (
                    <video
                      src={selectedPrompt.media_url}
                      controls
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <img
                      src={selectedPrompt.media_url}
                      alt={selectedPrompt.title}
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-soft-lavender mb-2">Prompt Details</h3>
                  <div className="bg-deep-bg rounded-lg p-4 relative group">
                    <p className="text-soft-lavender whitespace-pre-wrap">{selectedPrompt.prompt}</p>
                    <button
                      onClick={() => handleCopyPrompt(selectedPrompt.prompt)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4 text-soft-lavender/70 hover:text-soft-lavender" />
                    </button>
                  </div>
                </div>

                {selectedPrompt.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-soft-lavender mb-2">Notes</h3>
                    <div className="bg-deep-bg rounded-lg p-4">
                      <p className="text-soft-lavender/70">{selectedPrompt.notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-soft-lavender mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm bg-cosmic-purple/20 text-cosmic-purple"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopyPrompt(selectedPrompt.prompt)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Prompt
                  </Button>
                  {selectedPrompt.media_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadMedia(
                        selectedPrompt.media_url!,
                        selectedPrompt.title,
                        isVideoUrl(selectedPrompt.media_url)
                      )}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download {isVideoUrl(selectedPrompt.media_url) ? 'Video' : 'Image'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLibrary;
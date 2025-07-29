import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, X, Copy, Download, Play, Search, Tag, Plus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Prompt, PromptTag } from '../types';

// Optimized Image Component with better error handling and loading states
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
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
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

const CommunityLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);

  const fetchPrompts = async () => {
    try {
      const isInitialLoad = prompts.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      // First, fetch all public prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (promptsError) throw promptsError;
      
      if (!promptsData || promptsData.length === 0) {
        setPrompts([]);
        return;
      }

      // Get unique user IDs from the prompts
      const userIds = [...new Set(promptsData.map(prompt => prompt.user_id))];
      
      if (userIds.length === 0) {
        setPrompts(promptsData);
        return;
      }
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Failed to fetch user profiles:', profilesError);
        // Continue without profile data rather than failing completely
        setPrompts(promptsData.map(prompt => ({ ...prompt, profiles: null })));
        return;
      }

      // Create a map of user_id to username for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Combine prompts with profile data
      const promptsWithProfiles = promptsData.map(prompt => ({
        ...prompt,
        profiles: profilesMap.get(prompt.user_id) || null
      }));

      setPrompts(promptsWithProfiles);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load community prompts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    console.log('Manually refreshing community library...');
    await fetchPrompts();
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const handleDownloadMedia = async (url: string, title: string, isVideo: boolean) => {
    try {
      // Generate a clean filename
      const filename = `${title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}.${isVideo ? 'mp4' : 'jpg'}`;
      
      // Try to fetch the image as blob first (works for cross-origin)
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
    } catch (error) {
      console.error('Download failed, trying alternative method:', error);
      
      // Fallback method: try direct download
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}.${isVideo ? 'mp4' : 'jpg'}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        
        // Final fallback: open in new window
        window.open(url, '_blank');
        alert('Image opened in new tab. Right-click and select "Save image as..." to download.');
      }
    }
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

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-deep-bg pt-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-soft-lavender">Community Library</h1>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className={refreshing ? 'opacity-50' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
             
              <Link to="/create-prompt">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prompt
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

          {loading ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-electric-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-soft-lavender">Loading community prompts...</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-error-red/10 border border-error-red/20 rounded-lg p-6 max-w-md mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-error-red" />
                </div>
                <h3 className="text-error-red font-medium mb-2">Failed to Load Prompts</h3>
                <p className="text-error-red/80 text-sm mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <ImageIcon className="w-16 h-16 text-soft-lavender/30 mb-4" />
                <div className="text-soft-lavender/70 text-lg mb-2">No prompts found</div>
                <p className="text-soft-lavender/50 text-sm">
                  {searchQuery || selectedTags.length > 0 
                    ? "Try adjusting your search or filters" 
                    : "Be the first to share a prompt with the community!"
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-card-bg rounded-lg overflow-hidden border border-border-color hover:border-cosmic-purple/40 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <div className="aspect-square overflow-hidden bg-deep-bg relative">
                    {prompt.media_url ? (
                      <OptimizedImage
                        src={prompt.media_url}
                        alt={prompt.title}
                        className="transition-transform duration-300 hover:scale-105"
                        isVideo={isVideoUrl(prompt.media_url)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-soft-lavender/30">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <div className="text-xs">No media</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-soft-lavender font-medium">{prompt.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-soft-lavender/50">
                          by @{prompt.profiles?.username || 'unknown'}
                        </span>
                      </div>
                    </div>
                    <p className="text-soft-lavender/70 text-sm line-clamp-3 mb-3">{prompt.prompt}</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {refreshing && !loading && (
            <div className="fixed top-24 right-4 bg-card-bg border border-border-color rounded-lg p-3 shadow-lg z-40">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-electric-cyan" />
                <span className="text-soft-lavender text-sm">Refreshing images...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Prompt Details Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card-bg rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-border-color">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-soft-lavender">{selectedPrompt.title}</h2>
                <span className="text-sm text-soft-lavender/50">
                  by @{selectedPrompt.profiles?.username || 'unknown'}
                </span>
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
                    <OptimizedImage
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

                {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
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
                )}

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

export default CommunityLibrary;
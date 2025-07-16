import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, X, Copy, Download, Play, Search, Tag, Plus } from 'lucide-react';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Prompt, PromptTag } from '../types';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PromptTag[]>([]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

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
              <Button variant="outline" size="sm" onClick={fetchPrompts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
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
              <div className="text-soft-lavender">Loading prompts...</div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-soft-lavender/70">No prompts found</div>
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
                      isVideoUrl(prompt.media_url) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={prompt.media_url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={prompt.media_url}
                          alt={prompt.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-soft-lavender/30">
                        No media
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
        </div>
      </div>

      {/* Prompt Details Modal */}
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

export default CommunityLibrary;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

interface UserProfile {
  email: string;
  username: string;
  avatar_url?: string;
}

const Account: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        setProfile({
          email: user.email || '',
          username: profile?.username || '',
          avatar_url: user.user_metadata.avatar_url,
        });
        setUsername(profile?.username || '');
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    try {
      setUpdateLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username: username,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, username } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating username:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12 flex items-center justify-center">
        <div className="text-soft-lavender">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-card-bg rounded-lg border border-border-color p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-cosmic-purple/20 flex items-center justify-center text-2xl text-soft-lavender">
              {profile?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-soft-lavender mb-2">My Account</h1>
              <p className="text-soft-lavender/70">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Username Section */}
            <div className="border-t border-border-color pt-6">
              <h2 className="text-xl font-semibold text-soft-lavender mb-4">Username</h2>
              <div className="flex items-center gap-4">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 bg-deep-bg border border-border-color rounded-lg px-4 py-2 text-soft-lavender"
                      placeholder="Enter username"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUpdateUsername}
                      className={updateLoading ? 'opacity-50' : ''}
                    >
                      {updateLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setUsername(profile?.username || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-soft-lavender">
                      {profile?.username || 'No username set'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* User Library Link */}
            <div className="border-t border-border-color pt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/library/my')}
                className="w-full"
              >
                My Library
              </Button>
            </div>

            {/* AI Tools Section */}
            <div className="border-t border-border-color pt-6">
              <h2 className="text-xl font-semibold text-soft-lavender mb-4">AI Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/prompt-extractor"
                  className="block p-4 bg-deep-bg rounded-lg border border-border-color hover:border-cosmic-purple/40 transition-all duration-300"
                >
                  <h3 className="text-electric-cyan font-semibold mb-2">Prompt Extractor</h3>
                  <p className="text-soft-lavender/70 text-sm">Extract prompts from images</p>
                </a>
                <a
                  href="https://virtuaide-assistant.lovable.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-deep-bg rounded-lg border border-border-color hover:border-cosmic-purple/40 transition-all duration-300"
                >
                  <h3 className="text-electric-cyan font-semibold mb-2">VirtuAide</h3>
                  <p className="text-soft-lavender/70 text-sm">AI-powered virtual assistant</p>
                </a>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="border-t border-border-color pt-6">
              <Button variant="outline" size="lg" onClick={handleSignOut} className="w-full">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, Check, X, Mail, Calendar } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

interface ApiAccess {
  id: string;
  user_email: string;
  has_access: boolean;
  granted_by: string;
  granted_at: string;
  notes?: string;
}

const ApiAccessManagement: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessList, setAccessList] = useState<ApiAccess[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserNotes, setNewUserNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username !== 'ADMIN') {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadAccessList();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccessList = async () => {
    try {
      const { data, error } = await supabase
        .from('api_access')
        .select('*')
        .order('granted_at', { ascending: false });

      if (error) throw error;
      setAccessList(data || []);
    } catch (error) {
      console.error('Error loading access list:', error);
    }
  };

  const addUserAccess = async () => {
    if (!newUserEmail.trim()) return;

    try {
      setIsAdding(true);
      const { error } = await supabase
        .from('api_access')
        .upsert({
          user_email: newUserEmail.toLowerCase().trim(),
          has_access: true,
          granted_by: 'admin',
          notes: newUserNotes.trim() || null
        }, {
          onConflict: 'user_email'
        });

      if (error) throw error;

      setNewUserEmail('');
      setNewUserNotes('');
      await loadAccessList();
    } catch (error) {
      console.error('Error adding user access:', error);
      alert('Failed to add user access');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleUserAccess = async (id: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('api_access')
        .update({ 
          has_access: !currentAccess,
          granted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await loadAccessList();
    } catch (error) {
      console.error('Error toggling user access:', error);
      alert('Failed to update user access');
    }
  };

  const removeUserAccess = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user\'s access?')) return;

    try {
      const { error } = await supabase
        .from('api_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAccessList();
    } catch (error) {
      console.error('Error removing user access:', error);
      alert('Failed to remove user access');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12 flex items-center justify-center">
        <div className="text-soft-lavender">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-electric-cyan" />
            <h1 className="text-3xl font-bold text-soft-lavender">API Access Management</h1>
          </div>

          {/* Add New User */}
          <div className="bg-card-bg rounded-lg p-6 border border-border-color mb-8">
            <h2 className="text-xl font-semibold text-soft-lavender mb-4">Grant API Access</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-soft-lavender mb-2">User Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-soft-lavender mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Reason for access..."
                  className="w-full bg-deep-bg border border-border-color rounded-lg p-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple"
                  value={newUserNotes}
                  onChange={(e) => setNewUserNotes(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={addUserAccess}
                disabled={isAdding || !newUserEmail.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? 'Adding...' : 'Grant Access'}
              </Button>
            </div>
          </div>

          {/* Access List */}
          <div className="bg-card-bg rounded-lg border border-border-color">
            <div className="p-6 border-b border-border-color">
              <h2 className="text-xl font-semibold text-soft-lavender">Current Access List</h2>
              <p className="text-soft-lavender/70 text-sm mt-1">
                {accessList.length} user{accessList.length !== 1 ? 's' : ''} with API access
              </p>
            </div>

            <div className="divide-y divide-border-color">
              {accessList.length === 0 ? (
                <div className="p-6 text-center text-soft-lavender/70">
                  No users have been granted API access yet
                </div>
              ) : (
                accessList.map((access) => (
                  <div key={access.id} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-4 h-4 text-soft-lavender/50" />
                        <span className="text-soft-lavender font-medium">{access.user_email}</span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          access.has_access 
                            ? 'bg-success-green/20 text-success-green' 
                            : 'bg-error-red/20 text-error-red'
                        }`}>
                          {access.has_access ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {access.has_access ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-soft-lavender/50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(access.granted_at).toLocaleDateString()}
                        </div>
                        <span>by {access.granted_by}</span>
                        {access.notes && <span>• {access.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserAccess(access.id, access.has_access)}
                        className={access.has_access ? 'text-error-red border-error-red' : 'text-success-green border-success-green'}
                      >
                        {access.has_access ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserAccess(access.id)}
                        className="text-error-red border-error-red hover:bg-error-red/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiAccessManagement;
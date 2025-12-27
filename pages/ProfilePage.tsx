import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserIcon, UploadIcon, SpinnerIcon } from '../components/icons';

interface ProfilePageProps {
  setPage: (page: 'chat' | 'profile' | 'knowledge') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ setPage }) => {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarUrl || undefined });
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;
      
      setAvatarUrl(newAvatarUrl);
      await updateProfile({ avatar_url: newAvatarUrl });
      setMessage("Avatar updated successfully!");

    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="w-full max-w-2xl mx-auto p-8 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex items-center space-x-6">
            {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
            ) : (
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-slate-400" />
                </div>
            )}
            <div>
                <label htmlFor="avatar-upload" className="cursor-pointer px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-opacity-80 flex items-center justify-center">
                    {uploading ? <SpinnerIcon className="w-5 h-5"/> : <UploadIcon className="w-5 h-5 mr-2"/>}
                    {uploading ? 'Uploading...' : 'Upload Avatar'}
                </label>
                <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" onChange={uploadAvatar} accept="image/*" disabled={uploading} />
                <p className="text-xs text-brand-text-secondary mt-2">PNG, JPG, GIF up to 1MB</p>
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-2">Email</label>
            <input id="email" type="text" value={user?.email} disabled className="w-full px-4 py-3 bg-brand-surface/50 border border-white/10 rounded-lg cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-brand-text-secondary mb-2">Full Name</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-brand-surface border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent" />
          </div>
          <div className="flex items-center space-x-4">
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 font-semibold text-white bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
             <button type="button" onClick={() => setPage('chat')} className="px-6 py-3 font-semibold text-brand-text-primary bg-brand-surface rounded-lg hover:bg-opacity-80 transition-colors">
                Back to Chat
             </button>
          </div>
        </form>
         {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
         {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
      </div>
    </div>
  );
};
"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ chats: number, messages: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'stats' | 'avatar'>('profile');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const userData = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        };

        setUser(userData);
        setDisplayName(userData.display_name);
        setAvatarUrl(userData.avatar_url);

        // Fetch user stats
        fetchUserStats(user.id);
      }
    };

    fetchUser();
  }, []);

  const fetchUserStats = async (userId: string) => {
    try {
      // Get chat count
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (chatsError) throw chatsError;

      // Get message count
      const { count: messageCount, error: messagesError } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .in('chat_id', chats?.map(chat => chat.id) || []);

      if (messagesError) throw messagesError;

      setStats({
        chats: chats?.length || 0,
        messages: messageCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });

      // Update local user state
      if (user) {
        setUser({
          ...user,
          display_name: displayName,
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'An error occurred while updating password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Max size: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Image size should be less than 2MB' });
      return;
    }

    setAvatarLoading(true);
    setAvatarMessage(null);

    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
          display_name: displayName // Keep existing display name
        },
      });

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setAvatarMessage({ type: 'success', text: 'Avatar updated successfully' });

      // Update local user state
      if (user) {
        setUser({
          ...user,
          avatar_url: publicUrl,
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setAvatarMessage({ type: 'error', text: error.message || 'An error occurred while updating avatar' });
    } finally {
      setAvatarLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const handleBackToChats = () => {
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Account</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleBackToChats}
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Chats
          </button>
        </div>
      </div>

      <div className="flex mb-6 items-center">
        <div
          className="relative mr-6 cursor-pointer group"
          onClick={handleAvatarClick}
        >
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-blue-500">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-xl font-medium">{displayName || user?.email}</h3>
          <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
          {avatarLoading && <p className="text-sm text-blue-500 mt-1">Uploading...</p>}
          {avatarMessage && (
            <p className={`text-sm mt-1 ${avatarMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {avatarMessage.text}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 flex border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`py-2 px-4 ${activeTab === 'password' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-2 px-4 ${activeTab === 'stats' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Stats
        </button>
      </div>

      {activeTab === 'profile' && (
        <div>
          {message && (
            <div
              className={`${
                message.type === 'success' ? 'bg-green-100 text-green-700 border-green-400' : 'bg-red-100 text-red-700 border-red-400'
              } px-4 py-3 rounded mb-4 border`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div>
          {passwordMessage && (
            <div
              className={`${
                passwordMessage.type === 'success' ? 'bg-green-100 text-green-700 border-green-400' : 'bg-red-100 text-red-700 border-red-400'
              } px-4 py-3 rounded mb-4 border`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                minLength={6}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Your Chats</h3>
              <p className="text-3xl font-bold">{stats?.chats || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total conversations</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Your Messages</h3>
              <p className="text-3xl font-bold">{stats?.messages || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total messages exchanged</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2 text-blue-800 dark:text-blue-200">AI Models</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Gemini (Cloud)</span>
                <span>✓ Available</span>
              </div>
              <div className="flex justify-between">
                <span>Llama 2 (Local)</span>
                <span>{window.location.hostname === 'localhost' ? '✓ Available' : '⚠️ Only on local installs'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 py-3 px-4 rounded-md hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 00-1 1v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

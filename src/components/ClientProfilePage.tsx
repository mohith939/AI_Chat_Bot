"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Profile from '@/components/auth/Profile';
import ChatSidebar from '@/components/chat/ChatSidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ClientProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        setSession(data.session);
      } catch (error: any) {
        console.error('Error checking session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          // If user signs out, redirect to sign in
          router.push('/signin');
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
          <div className="flex justify-center">
            <Link href="/" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show sign-in button
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Please sign in to view your profile.
          </p>
          <div className="flex justify-center">
            <Link href="/signin" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, show the profile page
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <Profile />
      </div>
    </div>
  );
}

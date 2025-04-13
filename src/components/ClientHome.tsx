"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import ChatSidebar from '@/components/chat/ChatSidebar';
import Link from 'next/link';

export default function ClientHome() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

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
            <Link href="/signin" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              Go to Sign In
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
          <h1 className="text-2xl font-bold mb-4">Welcome to AI Chat</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Please sign in to start chatting with AI.
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

  // If authenticated, show the chat interface
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">Welcome to AI Chat</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Start a new chat or select an existing conversation from the sidebar.
          </p>
          <div className="flex flex-col space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-2">Gemini API</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cloud-based AI responses using Google's Gemini model</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-2">Ollama (Llama 2)</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Local AI responses using Llama 2 model via Ollama</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

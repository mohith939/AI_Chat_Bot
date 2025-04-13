"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatInterface from '@/components/chat/ChatInterface';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClientChatPageProps {
  chatId: string;
}

export default function ClientChatPage({ chatId }: ClientChatPageProps) {
  const [session, setSession] = useState<any>(null);
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkSessionAndChat() {
      try {
        // Check session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (!sessionData.session) {
          if (isMounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setSession(sessionData.session);
        }

        // Fetch chat data directly from Supabase
        try {
          // First, try to get the chat
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .eq('user_id', sessionData.session.user.id)
            .single();

          if (chatError) {
            // If the error is that the chat doesn't exist, create a new one
            if (chatError.code === 'PGRST116') {
              console.log('Chat not found, creating a new one');

              // Create a new chat
              const { data: newChat, error: createError } = await supabase
                .from('chats')
                .insert([
                  {
                    title: 'New Chat',
                    user_id: sessionData.session.user.id
                  }
                ])
                .select()
                .single();

              if (createError) {
                // If we can't create a chat, there might be a database issue
                console.error('Error creating chat:', createError);
                if (isMounted) {
                  setError(`Could not create chat: ${createError.message}`);
                  setLoading(false);
                }
                return;
              }

              if (newChat && isMounted) {
                // Redirect to the new chat
                router.push(`/chat-client?id=${newChat.id}`);
                return;
              }
            } else {
              // For other errors, show the error
              throw chatError;
            }
          } else if (chatData && isMounted) {
            // Chat found
            setChat(chatData);
          }
        } catch (chatError: any) {
          console.error('Error with chat:', chatError);

          // For database not existing errors, redirect to home
          if (chatError.message?.includes('does not exist')) {
            console.log('Database issue, redirecting to home');
            if (isMounted) {
              router.push('/');
            }
            return;
          }

          // For other errors, show the error message
          if (isMounted) {
            setError(`Error: ${chatError.message}`);
          }
        }
      } catch (error: any) {
        console.error('Error checking session:', error);
        if (isMounted) {
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkSessionAndChat();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          setSession(session);
          if (!session && event === 'SIGNED_OUT') {
            // Only redirect on explicit sign out
            router.push('/signin');
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [chatId, router]);

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
            Please sign in to view this chat.
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

  // If chat not found or doesn't belong to user, this will redirect in the useEffect

  // If authenticated and chat exists, show the chat interface
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <ChatInterface chatId={chatId} />
    </div>
  );
}

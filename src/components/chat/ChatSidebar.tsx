"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { setupDatabase } from '@/lib/supabase/db-setup';
import { Chat } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../ui/ThemeToggle';

export default function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, []);

  // Show new chat input by default if there are no chats
  useEffect(() => {
    if (chats.length === 0 && !loading) {
      setShowNewChatInput(true);
    }
  }, [chats, loading]);

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signin');
        return;
      }

      // Try to fetch chats
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // If there's an error, it might be because the table doesn't exist
      if (error) {
        console.log('Error fetching chats, attempting to set up database:', error);

        // Try to set up the database
        await setupDatabase(supabase);

        // Try fetching chats again
        const { data: retriedData, error: retriedError } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (retriedError) {
          console.error('Still error after database setup:', retriedError);
          setChats([]);
        } else {
          setChats(retriedData || []);
        }
      } else {
        setChats(data || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    let title = newChatTitle.trim();

    // If no title is provided, prompt the user for one
    if (!title) {
      const promptedTitle = prompt('Enter a title for your new chat:', 'New Chat');
      if (!promptedTitle) return; // User cancelled the prompt
      title = promptedTitle.trim() || 'New Chat';
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signin');
        return;
      }

      // Try to create a new chat
      const { data, error } = await supabase
        .from('chats')
        .insert([
          { title: title, user_id: user.id }
        ])
        .select()
        .single();

      // If there's an error, it might be because the table doesn't exist
      if (error) {
        console.log('Error creating chat, attempting to set up database:', error);

        // Try to set up the database
        await setupDatabase(supabase);

        // Try creating the chat again
        const { data: retriedData, error: retriedError } = await supabase
          .from('chats')
          .insert([
            { title: title, user_id: user.id }
          ])
          .select()
          .single();

        if (retriedError) {
          console.error('Still error after database setup:', retriedError);
          throw retriedError;
        }

        if (retriedData) {
          setChats([retriedData, ...chats]);
          setNewChatTitle('');
          setShowNewChatInput(false);
          router.push(`/chat-client?id=${retriedData.id}`);
        }
      } else if (data) {
        setChats([data, ...chats]);
        setNewChatTitle('');
        setShowNewChatInput(false);
        router.push(`/chat-client?id=${data.id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) {
        throw error;
      }

      setChats(chats.filter(chat => chat.id !== chatId));

      // If we're on the deleted chat's page, redirect to home
      if (window.location.pathname.includes(chatId)) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const clearAllChats = async () => {
    if (!confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setChats([]);
      router.push('/');
    } catch (error) {
      console.error('Error clearing chats:', error);
    }
  };

  return (
    <div className="w-64 h-screen bg-gray-100 dark:bg-gray-800 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">AI Chat</h1>
        <ThemeToggle />
      </div>

      <button
        onClick={() => setShowNewChatInput(true)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-4"
      >
        New Chat
      </button>

      {showNewChatInput && (
        <div className="mb-4 flex">
          <input
            type="text"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Chat title"
            className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                createNewChat();
              } else if (e.key === 'Escape') {
                setShowNewChatInput(false);
                setNewChatTitle('');
              }
            }}
          />
          <button
            onClick={createNewChat}
            disabled={isCreating}
            className="bg-blue-600 text-white px-3 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? '...' : 'Create'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No chats yet. Create a new chat to get started.
          </div>
        ) : (
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/chat-client?id=${chat.id}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <span className="truncate flex-1">{chat.title}</span>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="text-gray-500 hover:text-red-500"
                    aria-label="Delete chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Link
          href="/profile"
          className="flex items-center justify-between w-full py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Profile Settings
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>

        <button
          onClick={clearAllChats}
          className="flex items-center w-full text-red-600 py-2 px-4 rounded-md hover:bg-red-100 dark:hover:bg-red-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear All Chats
        </button>
      </div>
    </div>
  );
}

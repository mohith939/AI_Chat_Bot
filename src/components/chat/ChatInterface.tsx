"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Message, Chat, FollowUpQuestion } from '@/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatSkeleton from './ChatSkeleton';
import { generateResponse, generateFollowUpQuestions, AIProvider } from '@/lib/ai';
import { isOllamaAvailable } from '@/lib/ai/ollama';
import { moderateContent, moderateAIResponse } from '@/utils/moderation';

interface ChatInterfaceProps {
  chatId: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const MESSAGES_PER_PAGE = 20;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);

  // Fetch chat and messages
  useEffect(() => {
    const fetchChatAndMessages = async () => {
      try {
        setIsLoading(true);
        setPage(0);
        setMessages([]);
        setHasMoreMessages(false);
        setError(null);

        // Fetch chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single();

        if (chatError) throw chatError;
        setChat(chatData);

        // Get total count of messages
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chatId);

        if (countError) throw countError;

        // Fetch initial page of messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .range(0, MESSAGES_PER_PAGE - 1);

        if (messagesError) throw messagesError;

        // Check if there are more messages to load
        if (count && count > MESSAGES_PER_PAGE) {
          setHasMoreMessages(true);
        }

        // Reverse the messages to display in ascending order
        setMessages(messagesData ? [...messagesData].reverse() : []);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Failed to load chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      fetchChatAndMessages();
    }
  }, [chatId, MESSAGES_PER_PAGE]);

  // Check if Ollama is available
  useEffect(() => {
    const checkOllama = async () => {
      const available = await isOllamaAvailable();
      setOllamaAvailable(available);
    };

    checkOllama();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId]);

  const handleSendMessage = async (content: string) => {
    if (!chatId || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setFollowUpQuestions([]);

    try {
      // Check for harmful content
      const moderationResult = moderateContent(content);
      if (moderationResult.flagged) {
        setError(moderationResult.reason || 'This message may violate our content policy.');
        setIsProcessing(false);
        return;
      }

      // Add user message to the database
      const { data: userMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert([
          { chat_id: chatId, content, role: 'user' }
        ])
        .select()
        .single();

      if (userMessageError) throw userMessageError;

      // Update messages locally for immediate feedback
      setMessages(prev => [...prev, userMessage]);

      // Generate AI response
      const allMessages = [...messages, userMessage];
      try {
        const aiResponse = await generateResponse(allMessages, aiProvider);

        // Check if AI response indicates harmful content request
        const aiModerationResult = moderateAIResponse(aiResponse);
        if (aiModerationResult.flagged) {
          setError(aiModerationResult.reason || 'The AI detected potentially harmful content.');

          // Still save the AI's refusal response
          const { data: assistantMessage, error: assistantMessageError } = await supabase
            .from('messages')
            .insert([
              { chat_id: chatId, content: aiResponse, role: 'assistant' }
            ])
            .select()
            .single();

          if (!assistantMessageError) {
            setMessages(prev => [...prev, assistantMessage]);
          }

          setIsProcessing(false);
          return;
        }

        // Add AI response to the database
        const { data: assistantMessage, error: assistantMessageError } = await supabase
          .from('messages')
          .insert([
            { chat_id: chatId, content: aiResponse, role: 'assistant' }
          ])
          .select()
          .single();

        if (assistantMessageError) throw assistantMessageError;

        // Update messages locally with the AI response
        setMessages(prev => [...prev, assistantMessage]);

        // Generate follow-up questions
        try {
          const questions = await generateFollowUpQuestions(aiResponse, aiProvider);
          setFollowUpQuestions(questions.map((text, index) => ({ id: `follow-up-${index}`, text })));
        } catch (followUpError) {
          console.error('Error generating follow-up questions:', followUpError);
          // Non-critical error, don't show to user
        }
      } catch (aiError: any) {
        console.error('Error generating AI response:', aiError);

        // Add error message to the database
        let errorMessage = 'Sorry, I encountered an error generating a response.';

        // Check for specific error types
        if (aiError.message && (aiError.message.includes('API key') || aiError.message.includes('not found'))) {
          errorMessage = 'Error: Issue with Gemini API. This could be due to:\n' +
            '1. Invalid or missing API key\n' +
            '2. The model name has changed or is not available\n' +
            '3. You do not have access to the Gemini API\n\n' +
            'Please check your API key in .env.local file and ensure you have access to the Gemini API.';
        } else if (aiError.message && aiError.message.includes('Ollama')) {
          errorMessage = 'Error: Could not connect to Ollama. Make sure Ollama is running locally.';
        }

        try {
          // Add error message to the database
          const { data: errorResponse } = await supabase
            .from('messages')
            .insert([
              { chat_id: chatId, content: errorMessage, role: 'assistant' }
            ])
            .select()
            .single();

          // Update messages locally with the error message
          if (errorResponse) {
            setMessages(prev => [...prev, errorResponse]);
          }
        } catch (dbError) {
          console.error('Error saving error message to database:', dbError);
        }

        // Set the error state but don't throw
        setError(errorMessage);
        // The messages are already updated in the try/catch blocks above
      }

      // Follow-up questions are now generated in the try/catch block above

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

    } catch (error: any) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAiProvider = () => {
    // Allow toggling even if Ollama is not available, but show a warning
    if (!ollamaAvailable && aiProvider === 'gemini') {
      setError('Ollama is not available. Please install and run Ollama to use this feature.');
      // Don't toggle if Ollama is not available and we're on Gemini
      return;
    }

    // Toggle between providers
    setAiProvider(prev => prev === 'gemini' ? 'ollama' : 'gemini');

    // Clear any previous errors
    setError(null);
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const start = nextPage * MESSAGES_PER_PAGE;
      const end = start + MESSAGES_PER_PAGE - 1;

      const { data: olderMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      if (olderMessages && olderMessages.length > 0) {
        // Save current scroll position
        const scrollContainer = messagesEndRef.current?.parentElement;
        const scrollHeight = scrollContainer?.scrollHeight || 0;

        // Add older messages to the beginning of the array (in reverse order)
        setMessages(prev => [...olderMessages.reverse(), ...prev]);
        setPage(nextPage);

        // Check if we have more messages to load
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chatId);

        setHasMoreMessages(count ? count > (nextPage + 1) * MESSAGES_PER_PAGE : false);

        // Restore scroll position after messages are added
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - scrollHeight;
          }
        }, 100);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setError('Failed to load more messages. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold">{chat.title}</h1>
            <span className={`text-xs px-2 py-1 rounded-md font-medium ${aiProvider === 'gemini' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
              <span className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1 ${aiProvider === 'gemini' ? 'bg-green-500' : 'bg-purple-500'}`}></span>
                {aiProvider === 'gemini' ? 'Gemini' : 'Ollama'}
              </span>
            </span>
            <button
              onClick={() => {
                const newTitle = prompt('Enter a new title for this chat', chat.title);
                if (newTitle && newTitle.trim() !== '') {
                  supabase
                    .from('chats')
                    .update({ title: newTitle.trim() })
                    .eq('id', chat.id)
                    .then(({ error }) => {
                      if (!error) {
                        setChat({ ...chat, title: newTitle.trim() });
                      }
                    });
                }
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Rename chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">AI Model:</span>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as 'gemini' | 'ollama')}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm"
            >
              <option value="gemini">Gemini (Cloud)</option>
              <option value="ollama" disabled={!ollamaAvailable}>Llama 2 (Local){!ollamaAvailable ? ' - Not Available' : ''}</option>
            </select>
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
              <p>Send a message to begin chatting with the AI</p>
            </div>
          </div>
        ) : (
          <div>
            {hasMoreMessages && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                  className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-md disabled:opacity-50 flex items-center"
                >
                  {isLoadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Load More Messages'
                  )}
                </button>
              </div>
            )}
            <div ref={messagesStartRef} />
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-t border-red-200 text-red-700 px-4 py-2">
          {error}
        </div>
      )}

      <ChatInput
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        followUpQuestions={followUpQuestions}
        aiProvider={aiProvider}
        onToggleProvider={toggleAiProvider}
        isOllamaAvailable={ollamaAvailable}
      />
    </div>
  );
}

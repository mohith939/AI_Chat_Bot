"use client";

import { useState, useRef, useEffect } from 'react';
import { FollowUpQuestion } from '@/types';
import { sanitizeInput } from '@/utils/sanitize';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  followUpQuestions: FollowUpQuestion[];
  aiProvider: 'gemini' | 'ollama';
  onToggleProvider: () => void;
  isOllamaAvailable: boolean;
}

export default function ChatInput({
  onSendMessage,
  isProcessing,
  followUpQuestions,
  aiProvider,
  onToggleProvider,
  isOllamaAvailable,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      // Sanitize the message before sending
      const sanitizedMessage = sanitizeInput(message.trim());
      onSendMessage(sanitizedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFollowUpClick = (question: string) => {
    if (!isProcessing) {
      // Sanitize the follow-up question before sending
      const sanitizedQuestion = sanitizeInput(question);
      onSendMessage(sanitizedQuestion);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="max-w-3xl mx-auto">
        {followUpQuestions.length > 0 && (
          <div className="mb-4" role="region" aria-label="Follow-up questions">
            <div className="sr-only" id="follow-up-description">Suggested follow-up questions. Click any to send.</div>
            <div className="flex flex-wrap gap-2" aria-describedby="follow-up-description">
              {followUpQuestions.map((question, index) => (
                <button
                  key={question.id || index}
                  onClick={() => handleFollowUpClick(question.text)}
                  disabled={isProcessing}
                  className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-full disabled:opacity-50"
                  aria-label={`Ask: ${question.text}`}
                >
                  {question.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={isProcessing}
              aria-label="Message input"
              aria-describedby="message-help"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 pr-10"
            />
            <span id="message-help" className="sr-only">
              Type your message and press Enter to send. Use Shift+Enter for a new line.
            </span>
            <div className="absolute right-2 bottom-2 flex items-center">
              <button
                type="button"
                onClick={onToggleProvider}
                disabled={!isOllamaAvailable}
                className={`text-xs px-2 py-1 rounded-md font-medium ${
                  aiProvider === 'gemini'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                } ${!isOllamaAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-offset-1'}`}
                title={!isOllamaAvailable ? 'Ollama not available' : 'Toggle AI provider'}
                aria-label={`Current AI provider: ${aiProvider}. ${isOllamaAvailable ? 'Click to switch to ' + (aiProvider === 'gemini' ? 'Ollama' : 'Gemini') : 'Ollama is not available'}`}
                aria-checked={aiProvider === 'ollama'}
                role="switch"
              >
                <span className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1 ${aiProvider === 'gemini' ? 'bg-green-500' : 'bg-purple-500'}`}></span>
                  {aiProvider === 'gemini' ? 'Gemini' : 'Ollama'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isProcessing}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            aria-label={isProcessing ? 'Sending message...' : 'Send message'}
          >
            {isProcessing ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
            <span className="sr-only">{isProcessing ? 'Sending message...' : 'Send message'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

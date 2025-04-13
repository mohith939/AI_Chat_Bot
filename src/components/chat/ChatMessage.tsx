"use client";

import { Message } from '@/types';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-4 ${message.role === 'assistant' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
      <div className="max-w-3xl mx-auto px-4 flex">
        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
          {message.role === 'user' ? (
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-full h-full rounded-full flex items-center justify-center">
              U
            </div>
          ) : (
            <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 w-full h-full rounded-full flex items-center justify-center">
              AI
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium">
              {message.role === 'user' ? 'You' : 'AI'}
            </span>
            {message.created_at && (
              <span className="text-xs text-gray-500 dark:text-gray-400" title={new Date(message.created_at).toLocaleString()}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.role === 'assistant' && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={copyToClipboard}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm flex items-center"
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

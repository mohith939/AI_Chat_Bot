"use client";

import { useSearchParams } from 'next/navigation';
import ClientChatPage from '../../components/ClientChatPage';
import { useEffect, Suspense } from 'react';

// Client component that uses useSearchParams
function ChatClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    // If no ID is provided, redirect to home
    useEffect(() => {
      window.location.href = '/';
    }, []);

    return <div>Redirecting...</div>;
  }

  return <ClientChatPage chatId={id} />;
}

export default function ChatClientPage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatClient />
    </Suspense>
  );
}

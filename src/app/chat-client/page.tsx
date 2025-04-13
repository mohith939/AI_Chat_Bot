"use client";

import { useSearchParams } from 'next/navigation';
import ClientChatPage from '../../components/ClientChatPage';
import { useEffect } from 'react';

export default function ChatClientPage() {
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

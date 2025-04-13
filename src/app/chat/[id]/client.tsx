"use client";

import ClientChatPage from '../../../components/ClientChatPage';

interface ChatPageClientProps {
  id: string;
}

export default function ChatPageClient({ id }: ChatPageClientProps) {
  return <ClientChatPage chatId={id} />;
}

"use client";

import ClientChatPage from '../../../components/ClientChatPage';

interface ClientChatWrapperProps {
  id: string;
}

export default function ClientChatWrapper({ id }: ClientChatWrapperProps) {
  return <ClientChatPage chatId={id} />;
}

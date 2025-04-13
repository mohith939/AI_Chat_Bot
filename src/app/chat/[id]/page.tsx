import { redirect } from 'next/navigation';
import { use } from 'react';

export default function ChatPage({ params }: { params: { id: string } }) {
  // Properly handle params by using React.use
  const unwrappedParams = use(Promise.resolve(params));
  redirect(`/chat-client?id=${unwrappedParams.id}`);
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OfflineIndicator from './ui/OfflineIndicator';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Define keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      ctrlKey: true,
      action: () => router.push('/'),
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => router.push('/new-chat'),
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => router.push('/profile'),
    },
    {
      key: '?',
      action: () => setShowShortcutsHelp(prev => !prev),
    },
    {
      key: 'Escape',
      action: () => setShowShortcutsHelp(false),
      preventDefault: false,
    },
  ]);

  return (
    <>
      {children}
      <OfflineIndicator />
      {/* Keyboard shortcuts help dialog will be implemented in a future update */}
    </>
  );
}

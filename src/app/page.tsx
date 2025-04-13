import Link from 'next/link';
import ClientHome from '../components/ClientHome';

export default function Home() {
  // Check if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

  // If Supabase is not configured, show setup instructions
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Setup Required</h1>
          <div className="mb-6 text-gray-600 dark:text-gray-400">
            <p className="mb-4">You need to configure your environment variables:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Create a Supabase project at <a href="https://supabase.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
              <li>Get your Supabase URL and anon key from the project settings</li>
              <li>Get a Gemini API key from <a href="https://ai.google.dev/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
              <li>Update the <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">.env.local</code> file with your credentials</li>
            </ol>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
            <p>Check the README.md file for complete setup instructions.</p>
          </div>
        </div>
      </div>
    );
  }

  // Use client component for authentication
  return <ClientHome />;
}

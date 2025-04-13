# Free AI Chat App with Gemini + Ollama (Llama 2)

A cost-free full-stack chat application that integrates with both Google's Gemini API (cloud) and Ollama (local) for AI responses.

## Features

### User System
- **Authentication**: Email/password signup and login via Supabase Auth
- **Profile Management**: Edit display name, email, and profile picture
- **Session Persistence**: Stay logged in across browser sessions

### Chat Features
- **Conversation Management**: Create, rename, and delete individual chats
- **Bulk Actions**: Clear all chats with confirmation
- **Message Timestamps**: Each message displays time in HH:MM:SS format
- **Follow-up Questions**: AI generates 3 follow-up questions after each response
- **Chat History**: Persistent chat history stored in Supabase

### AI Integration
- **Dual AI Providers**:
  - Gemini API for cloud-based responses (free tier)
  - Ollama with Llama 2 for local, offline responses
- **Provider Selection**: Toggle between Gemini and Ollama in the UI
- **Automatic Fallback**: Falls back to Ollama if Gemini fails
- **Error Handling**: Detailed error messages for API issues

### UI/UX
- **Theme Support**: Light/dark mode toggle
- **Responsive Design**: Works on mobile and desktop
- **Minimalist Interface**: Clean, distraction-free chat experience
- **Loading States**: Visual feedback during AI processing

## Tech Stack

- **Frontend**: Next.js + Tailwind CSS
- **Authentication & Database**: Supabase (PostgreSQL)
- **AI Providers**:
  - Google Gemini API
  - Ollama (Llama 2)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Google AI Studio account for Gemini API key
- Ollama installed locally (for offline mode)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-chat-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Get your Supabase URL and anon key from the project settings
3. Set up the database tables using one of these methods:

#### Option 1: Automatic Setup (Recommended)

The application will automatically attempt to create the necessary tables when you first use it. Just sign up, sign in, and try to create a chat. The tables will be created automatically if they don't exist.

#### Option 2: Manual Setup via SQL Editor

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of the `supabase/migrations/create_tables.sql` file from this repository
3. Paste it into the SQL Editor and run the query
4. This will create the necessary functions and tables with proper Row Level Security policies

#### Option 3: Manual Table Creation

If you prefer to create the tables manually, you can use the following SQL:

**Chats Table**:
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model TEXT DEFAULT 'gemini'
);

-- Create index for faster queries
CREATE INDEX chats_user_id_idx ON chats(user_id);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own chats
CREATE POLICY "Users can create their own chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
  ON chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Messages Table**:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX messages_chat_id_idx ON messages(chat_id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage messages in their chats
CREATE POLICY "Users can create messages in their chats"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their chats"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their chats"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
```

### 4. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 5. Get a Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Navigate to the API keys section (Get API key)
4. Create a new API key
5. Copy the API key and add it to your `.env.local` file

**Important Notes about Gemini API**:
- The Gemini API key should be a valid key from Google AI Studio
- Make sure you've replaced the placeholder in `.env.local` with your actual API key
- The application will try to use different Gemini model versions (gemini-1.5-pro, gemini-pro, gemini-1.0-pro)
- If you see an error about models not being found, it could be due to:
  - Your API key not having access to the Gemini models
  - Google changing the model names or API versions
  - Regional restrictions on the Gemini API
- If you can't get Gemini working, you can still use Ollama locally

### 6. Set up Ollama (for local AI)

#### Windows Setup

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. After installation, Ollama will run in the background (check the system tray)
3. Open a command prompt and pull the Llama 2 model:

```bash
ollama pull llama2
```

4. Ollama should now be running and accessible at http://localhost:11434

#### macOS Setup

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. After installation, open Terminal and pull the Llama 2 model:

```bash
ollama pull llama2
```

3. Start the Ollama server if it's not already running:

```bash
ollama serve
```

#### Linux Setup

1. Install Ollama using the installation script:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. Pull the Llama 2 model:

```bash
ollama pull llama2
```

3. Start the Ollama server:

```bash
ollama serve
```

#### Troubleshooting Ollama

- **Ollama Not Available**: Make sure the Ollama service is running in the background
- **Model Not Found**: Verify you've pulled the llama2 model with `ollama list`
- **Connection Issues**: Check that Ollama is running on the default port (11434)
- **Performance**: Llama 2 requires at least 8GB of RAM, preferably 16GB for smooth operation

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Specifications

### Gemini API

The application uses Google's Gemini API for cloud-based AI responses.

- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Authentication**: API Key (passed as a query parameter)
- **Models Used**: The app tries these models in order:
  1. `gemini-1.5-pro` (newest)
  2. `gemini-pro` (standard)
  3. `gemini-1.0-pro` (fallback)
- **Request Format**: JSON with conversation history
- **Response Format**: JSON with generated text
- **Rate Limits**: Free tier has limits on requests per minute and tokens per day

### Ollama API

The application uses Ollama's local API for offline AI responses.

- **API Endpoint**: `http://localhost:11434/api/generate`
- **Authentication**: None (local API)
- **Model Used**: `llama2` (only)
- **Request Format**: JSON with prompt and model parameters
- **Response Format**: Streaming JSON with generated text
- **Performance**: Depends on your local hardware (CPU/GPU/RAM)

## Deployment

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GEMINI_API_KEY`
4. Deploy

### Backend (Supabase)

Your Supabase project is already deployed and ready to use. Make sure to:

1. Set up authentication (Email/Password provider)
2. Create the necessary database tables (as described in the setup section)
3. Configure Row Level Security policies

### Ollama (Local Only)

Ollama runs locally on the user's machine and is not deployed to the cloud. Users will need to install and run Ollama themselves following the instructions in this README.

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Ollama](https://ollama.ai/)
- [Tailwind CSS](https://tailwindcss.com/)

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to execute SQL dynamically
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create chats table
CREATE OR REPLACE FUNCTION create_chats_table()
RETURNS VOID AS $$
BEGIN
  -- Create chats table if it doesn't exist
  CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model TEXT DEFAULT 'gemini'
  );
  
  -- Create RLS policies for chats
  ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can create their own chats" ON chats;
  DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
  DROP POLICY IF EXISTS "Users can update their own chats" ON chats;
  DROP POLICY IF EXISTS "Users can delete their own chats" ON chats;
  
  -- Create policies
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
  
  -- Create messages table if it doesn't exist
  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create RLS policies for messages
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can create messages in their chats" ON messages;
  DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
  DROP POLICY IF EXISTS "Users can update messages in their chats" ON messages;
  DROP POLICY IF EXISTS "Users can delete messages in their chats" ON messages;
  
  -- Create policies
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

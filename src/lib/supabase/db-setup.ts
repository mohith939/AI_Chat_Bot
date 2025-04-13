import { SupabaseClient } from '@supabase/supabase-js';

export async function setupDatabase(supabase: SupabaseClient) {
  try {
    // Check if the chats table exists
    const { error: checkError } = await supabase
      .from('chats')
      .select('id')
      .limit(1);

    // If there's an error, the table might not exist
    if (checkError) {
      console.log('Setting up database tables...');
      
      // Create chats table
      const { error: createChatsError } = await supabase.rpc('create_chats_table');
      
      if (createChatsError) {
        console.error('Error creating chats table:', createChatsError);
        
        // Fallback: Try to create tables using SQL
        await createTablesManually(supabase);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up database:', error);
    return { success: false, error };
  }
}

async function createTablesManually(supabase: SupabaseClient) {
  try {
    // Create chats table
    await supabase.rpc('execute_sql', {
      sql_query: `
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
      `
    });

    // Create messages table
    await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create RLS policies for messages
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        
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
      `
    });

    console.log('Database tables created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating tables manually:', error);
    return { success: false, error };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResponse, generateFollowUpQuestions } from '@/lib/ai';
import { Message } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { messages, chatId, provider = 'gemini' } = await request.json();

    // Validate request
    if (!messages || !Array.isArray(messages) || !chatId) {
      return NextResponse.json(
        { error: 'Invalid request. Messages array and chatId are required.' },
        { status: 400 }
      );
    }

    // Check if chat exists and belongs to user
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', session.user.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // Generate AI response
    const aiResponse = await generateResponse(messages as Message[], provider);

    // Generate follow-up questions based on the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    let followUpQuestions: string[] = [];
    
    if (lastUserMessage) {
      followUpQuestions = await generateFollowUpQuestions(lastUserMessage.content, provider);
    }

    // Return the response
    return NextResponse.json({
      response: aiResponse,
      followUpQuestions,
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

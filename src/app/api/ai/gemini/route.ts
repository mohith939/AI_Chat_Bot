import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

// Get the API key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Check if API key is valid (basic check)
const isApiKeyValid = apiKey && apiKey.length > 10 && !apiKey.startsWith('YOUR_');

// List of model names to try, in order of preference
const modelNames = ['gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];

// Initialize the Gemini API if the key appears valid
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (isApiKeyValid) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);

    // Try to initialize with the first model (others will be tried on demand)
    model = genAI.getGenerativeModel({ model: modelNames[0] });
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    genAI = null;
    model = null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication is completely disabled for simplicity
    // In a production environment, you would want to implement proper authentication

    // Parse request body
    const body = await request.json();
    const { messages, type } = body;

    if (!messages) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Check if Gemini API is available
    if (!genAI || !model) {
      return NextResponse.json(
        { error: 'Gemini API is not available. Please provide a valid API key in your .env.local file and ensure you have access to the Gemini API.' },
        { status: 500 }
      );
    }

    // Try each model until one works
    let response;
    let error;

    for (const modelName of modelNames) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });

        if (type === 'chat') {
          // Format messages for Gemini
          const formattedMessages = messages.map((msg: any) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          }));

          // Generate response
          const result = await currentModel.generateContent({
            contents: formattedMessages,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1000,
            },
          });

          response = result.response.text();
          break;
        } else if (type === 'followup') {
          const lastMessage = messages;
          const prompt = `Based on this message: "${lastMessage}", generate 3 follow-up questions that would be interesting to ask next. Return only the questions as a numbered list, with no additional text.`;

          const result = await currentModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 200,
            },
          });

          const responseText = result.response.text();

          // Parse the response to extract questions
          const questions = responseText
            .split('\n')
            .filter(line => line.trim().match(/^\d+\.\s/))
            .map(line => line.replace(/^\d+\.\s/, '').trim())
            .slice(0, 3);

          response = questions.length ? questions : ['Tell me more about this topic', 'Can you explain in more detail?', 'What are the implications of this?'];
          break;
        } else {
          return NextResponse.json(
            { error: 'Invalid request type. Must be "chat" or "followup".' },
            { status: 400 }
          );
        }
      } catch (modelError) {
        console.warn(`Failed to use model ${modelName}:`, modelError);
        error = modelError;
      }
    }

    if (response) {
      return NextResponse.json({ response });
    } else {
      return NextResponse.json(
        { error: `All Gemini models failed: ${error?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

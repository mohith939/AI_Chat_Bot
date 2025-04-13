import { Message } from '@/types';

export async function generateGeminiResponse(messages: Message[]): Promise<string> {
  try {
    const response = await fetch('/api/ai/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        type: 'chat',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate response from Gemini API');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate response from Gemini');
  }
}

export async function generateFollowUpQuestions(lastMessage: string): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: lastMessage,
        type: 'followup',
      }),
    });

    if (!response.ok) {
      console.warn('Error generating follow-up questions from API:', response.statusText);
      return ['Tell me more about this topic', 'Can you explain in more detail?', 'What are the implications of this?'];
    }

    const data = await response.json();
    return Array.isArray(data.response) ? data.response : ['Tell me more about this topic', 'Can you explain in more detail?', 'What are the implications of this?'];
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return ['Tell me more about this topic', 'Can you explain in more detail?', 'What are the implications of this?'];
  }
}

import { Message } from '@/types';

// Default Ollama endpoint (users will need to run Ollama locally)
const OLLAMA_ENDPOINT = 'http://localhost:11434/api';

export async function generateOllamaResponse(messages: Message[]): Promise<string> {
  try {
    // Format messages for Ollama
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Make request to local Ollama instance
    const response = await fetch(`${OLLAMA_ENDPOINT}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2', // Only using Llama 2 as specified
        messages: formattedMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.95,
          top_k: 40,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'No response from Ollama';
  } catch (error) {
    console.error('Error generating Ollama response:', error);
    throw new Error('Failed to connect to Ollama. Make sure Ollama is running locally with Llama 2 model installed.');
  }
}

export async function generateFollowUpQuestions(lastMessage: string): Promise<string[]> {
  try {
    const prompt = `Based on this message: "${lastMessage}", generate 3 follow-up questions that would be interesting to ask next. Return only the questions as a numbered list, with no additional text.`;

    const response = await fetch(`${OLLAMA_ENDPOINT}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.8,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.message?.content || '';

    // Parse the response to extract questions
    const questions = responseText
      .split('\n')
      .filter(line => line.trim().match(/^\d+\.\s/))
      .map(line => line.replace(/^\d+\.\s/, '').trim())
      .slice(0, 3);

    return questions.length ? questions : ['Tell me more about this topic', 'Can you explain in more detail?', 'What are the implications of this?'];
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return ['Tell me more about this topic', 'Can you explain in more detail?', 'What are the implications of this?'];
  }
}

// Function to check if Ollama is available
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`${OLLAMA_ENDPOINT}/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Clear the timeout if fetch completes

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // Check if Llama 2 model is available
    return data.models?.some((model: any) => model.name.toLowerCase().includes('llama2')) || false;
  } catch (error) {
    console.error('Error checking Ollama availability:', error);
    return false;
  }
}

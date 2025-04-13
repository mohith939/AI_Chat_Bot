import { Message } from '@/types';
import { generateGeminiResponse, generateFollowUpQuestions as generateGeminiFollowUpQuestions } from './gemini';
import {
  generateOllamaResponse,
  generateFollowUpQuestions as generateOllamaFollowUpQuestions,
  isOllamaAvailable
} from './ollama';

export type AIProvider = 'gemini' | 'ollama';

// Generate response based on selected provider
export async function generateResponse(
  messages: Message[],
  provider: AIProvider = 'gemini'
): Promise<string> {
  // Track attempts for retry logic
  let attempts = 0;
  const maxAttempts = 3;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Try primary provider with retries
  async function tryWithRetries(fn: () => Promise<string>, providerName: string): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        attempts++;
        return await fn();
      } catch (error) {
        console.error(`Attempt ${i + 1}/${maxAttempts} failed for ${providerName}:`, error);
        if (i < maxAttempts - 1) {
          // Exponential backoff: 1s, 2s, 4s...
          const backoffTime = Math.pow(2, i) * 1000;
          console.log(`Retrying ${providerName} in ${backoffTime}ms...`);
          await delay(backoffTime);
        } else {
          throw error; // Rethrow after all attempts fail
        }
      }
    }
    throw new Error(`All ${maxAttempts} attempts failed for ${providerName}`);
  }

  try {
    // If provider is ollama, check if it's available first
    if (provider === 'ollama') {
      const ollamaAvailable = await isOllamaAvailable();

      if (ollamaAvailable) {
        try {
          return await tryWithRetries(
            () => generateOllamaResponse(messages),
            'Ollama'
          );
        } catch (ollamaError) {
          console.warn('All Ollama attempts failed, falling back to Gemini');
          return await tryWithRetries(
            () => generateGeminiResponse(messages),
            'Gemini'
          );
        }
      } else {
        console.warn('Ollama not available, falling back to Gemini');
        return await tryWithRetries(
          () => generateGeminiResponse(messages),
          'Gemini'
        );
      }
    }

    // Default to Gemini with fallback to Ollama
    try {
      return await tryWithRetries(
        () => generateGeminiResponse(messages),
        'Gemini'
      );
    } catch (geminiError) {
      console.warn('All Gemini attempts failed, trying Ollama as fallback');
      const ollamaAvailable = await isOllamaAvailable();

      if (ollamaAvailable) {
        return await tryWithRetries(
          () => generateOllamaResponse(messages),
          'Ollama'
        );
      } else {
        throw new Error('Gemini failed and Ollama is not available');
      }
    }
  } catch (error) {
    console.error(`All AI providers failed after ${attempts} total attempts:`, error);
    throw new Error(`Failed to generate response after ${attempts} attempts. Please try again later.`);
  }
}

// Generate follow-up questions based on selected provider
export async function generateFollowUpQuestions(
  lastMessage: string,
  provider: AIProvider = 'gemini'
): Promise<string[]> {
  // Default fallback questions
  const defaultQuestions = [
    'Tell me more about this topic',
    'Can you explain in more detail?',
    'What are the implications of this?'
  ];

  // Track attempts for retry logic
  let attempts = 0;
  const maxAttempts = 2; // Fewer attempts for follow-up questions since they're less critical
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Try with retries
  async function tryWithRetries(fn: () => Promise<string[]>, providerName: string): Promise<string[]> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        attempts++;
        return await fn();
      } catch (error) {
        console.error(`Attempt ${i + 1}/${maxAttempts} failed for ${providerName} follow-up questions:`, error);
        if (i < maxAttempts - 1) {
          const backoffTime = 1000; // Simple 1s delay for follow-up questions
          await delay(backoffTime);
        } else {
          return defaultQuestions; // Return defaults after all attempts fail
        }
      }
    }
    return defaultQuestions;
  }

  try {
    if (provider === 'ollama') {
      const ollamaAvailable = await isOllamaAvailable();

      if (ollamaAvailable) {
        try {
          return await tryWithRetries(
            () => generateOllamaFollowUpQuestions(lastMessage),
            'Ollama'
          );
        } catch (error) {
          console.warn('Ollama follow-up questions failed, falling back to Gemini');
          return await tryWithRetries(
            () => generateGeminiFollowUpQuestions(lastMessage),
            'Gemini'
          );
        }
      } else {
        console.warn('Ollama not available for follow-up questions, falling back to Gemini');
        return await tryWithRetries(
          () => generateGeminiFollowUpQuestions(lastMessage),
          'Gemini'
        );
      }
    }

    // Default to Gemini with fallback to default questions
    try {
      return await tryWithRetries(
        () => generateGeminiFollowUpQuestions(lastMessage),
        'Gemini'
      );
    } catch (error) {
      // For follow-up questions, we don't try Ollama as fallback if not explicitly selected
      // Just return default questions
      console.warn('Failed to generate follow-up questions, using defaults');
      return defaultQuestions;
    }
  } catch (error) {
    console.error(`All providers failed for follow-up questions after ${attempts} attempts:`, error);
    return defaultQuestions;
  }
}

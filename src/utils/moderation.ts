/**
 * Basic content moderation to prevent misuse of the AI
 * 
 * This is a simple implementation that checks for obvious harmful content.
 * In a production environment, you would want to use a more sophisticated solution.
 */

// List of terms that might indicate harmful content
const HARMFUL_TERMS = [
  // Violence
  'how to kill', 'how to murder', 'how to harm', 'how to injure',
  'bomb making', 'weapon making', 'explosive',
  
  // Illegal activities
  'how to hack', 'how to steal', 'how to scam',
  'illegal drugs', 'buy drugs', 'sell drugs',
  
  // Hate speech indicators
  'racial slur', 'racist', 'nazi', 'white supremacy',
  
  // Self-harm
  'suicide method', 'how to commit suicide', 'self-harm',
  
  // Child safety
  'child porn', 'child pornography', 'underage',
];

/**
 * Checks if content might violate content policies
 * 
 * @param content The content to check
 * @returns Object with result and reason if flagged
 */
export function moderateContent(content: string): { flagged: boolean; reason?: string } {
  if (!content) return { flagged: false };
  
  const lowerContent = content.toLowerCase();
  
  // Check for harmful terms
  for (const term of HARMFUL_TERMS) {
    if (lowerContent.includes(term)) {
      return {
        flagged: true,
        reason: `Content may violate our content policy. Please avoid discussing harmful topics.`,
      };
    }
  }
  
  return { flagged: false };
}

/**
 * Checks if AI response might contain harmful content
 * 
 * @param response The AI response to check
 * @returns Object with result and reason if flagged
 */
export function moderateAIResponse(response: string): { flagged: boolean; reason?: string } {
  if (!response) return { flagged: false };
  
  const lowerResponse = response.toLowerCase();
  
  // Check for refusal patterns that might indicate harmful content was requested
  const refusalPatterns = [
    'i cannot provide',
    'i\'m not able to provide',
    'i am not able to provide',
    'i cannot assist with',
    'i\'m not able to assist with',
    'i am not able to assist with',
    'i cannot help with',
    'i\'m not able to help with',
    'i am not able to help with',
    'violates content policy',
    'against content policy',
    'harmful content',
    'illegal activity',
  ];
  
  for (const pattern of refusalPatterns) {
    if (lowerResponse.includes(pattern)) {
      return {
        flagged: true,
        reason: 'The AI detected that your request may violate content policies.',
      };
    }
  }
  
  return { flagged: false };
}

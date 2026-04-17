import { groqGenerate } from './groq';
import { geminiEmbed } from './gemini';

/**
 * Unified AI Interface for Echo.
 * Replaces legacy on-device WebLLM logic with Cloud APIs.
 */

export const ai = {
  /**
   * Sanitizes text by removing PII using Groq.
   */
  async anonymize(content: string): Promise<string> {
    const prompt = `
      [TASK] Rewrite the following text to remove all Personally Identifiable Information (PII).
      [RULES]
      - Replace full names with realistic generic names (e.g., "Alex", "Jordan").
      - Replace specific addresses with generic ones (e.g., "the park", "my street").
      - Replace phone numbers with dummy ones (e.g., "555-0199").
      - Replace email addresses with generic placeholders (e.g., "someone@example.com").
      - Replace specific dates with generic months or days (e.g., "last Tuesday", "in March").
      - Maintain the emotional tone and original length as closely as possible.
      - Return ONLY the sanitized text. No conversational filler.

      [TEXT]
      "${content}"

      [SANITIZED TEXT]
    `;

    try {
      const sanitized = await groqGenerate(prompt, 1024);
      if (!sanitized || sanitized.length < content.length * 0.1) {
        return content; // Fallback to original
      }
      return sanitized;
    } catch (error) {
      console.error('AI Anonymization failed:', error);
      return content;
    }
  },

  /**
   * Classifies content safety using Groq.
   */
  async moderate(content: string): Promise<'safe' | 'distress' | 'aggression'> {
    const prompt = `
      [TASK] Classify the potential risk level of the following text into exactly one of these labels: "safe", "distress", or "aggression".
      
      [LABELS]
      - "distress": The text indicates self-harm, severe emotional crisis, suicidal ideation, or clinical hopelessness.
      - "aggression": The text contains hate speech, harassment, severe bullying, or threats of violence toward others.
      - "safe": The text is normal social expression, even if it expresses shared sadness, normal frustration, or daily struggles.

      [RULE] Reply with ONLY the single label word.

      [CONTENT]
      "${content.slice(0, 1000)}"

      [LABEL]
    `;

    try {
      const response = await groqGenerate(prompt, 20);
      const cleaned = response.toLowerCase().trim().replace(/[^a-z]/g, '');

      if (cleaned.includes('distress')) return 'distress';
      if (cleaned.includes('aggression')) return 'aggression';
      return 'safe';
    } catch (error) {
      console.error('AI Moderation failed:', error);
      return 'safe';
    }
  },

  /**
   * Detects the emotional tone using Groq.
   */
  async getMood(content: string): Promise<string> {
    const moodList = 'calm, melancholy, hopeful, anxious, grateful, conflicted, numb, tender';
    const prompt = `Classify the mood of this text into exactly one word from this list: ${moodList}. Text: "${content.slice(0, 500)}". Reply with only the single mood word, nothing else.`;
    
    try {
      const response = await groqGenerate(prompt, 10);
      const word = response.toLowerCase().replace(/[^a-z]/g, '');
      const valid = moodList.split(', ');
      return valid.includes(word) ? word : 'Quiet';
    } catch {
      return 'Quiet';
    }
  },

  /**
   * Generates 768-dimensional semantic embedding for text using Gemini.
   */
  async embed(content: string): Promise<number[]> {
    return geminiEmbed(content);
  }
};

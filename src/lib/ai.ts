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
    const systemPrompt =
      'You are a PII-removal engine. You rewrite text to remove all personally ' +
      'identifiable information. Output ONLY the rewritten text — no preamble, ' +
      'no labels, no quotes, no explanation.';

    const prompt = `Rewrite the following text to remove all Personally Identifiable Information (PII).

RULES:
- Replace full names with realistic generic names (e.g. "Alex", "Jordan").
- Replace specific addresses with generic ones (e.g. "the park", "my street").
- Replace phone numbers with dummy ones (e.g. "555-0199").
- Replace email addresses with generic placeholders (e.g. "someone@example.com").
- Replace specific dates with generic references (e.g. "last Tuesday", "in March").
- Maintain the emotional tone and original length as closely as possible.
- OUTPUT THE SANITIZED TEXT ONLY.

TEXT:
${content}

SANITIZED TEXT:`;

    try {
      let sanitized = await groqGenerate(prompt, 1024, systemPrompt);

      // Strip any residual AI preamble despite instructions
      sanitized = sanitized
        .replace(/^(here is|here's|sanitized text|sanitized|output)[^:]*:\s*/i, '')
        .replace(/^[\"']|[\"']$/g, '')
        .trim();

      // Hard fail if result is unusable — do NOT silently post raw PII
      if (!sanitized || sanitized.length < content.length * 0.3) {
        throw new Error(
          'Anonymization produced an unusable result. Please try again.',
        );
      }

      return sanitized;
    } catch (error: any) {
      // Re-throw so the pipeline surfaces this as a visible error
      console.error('AI Anonymization failed:', error);
      throw new Error(
        error?.message ?? 'Anonymization failed. Your post was not shared.',
      );
    }
  },

  /**
   * Classifies content safety using Groq.
   */
  async moderate(content: string): Promise<'safe' | 'distress' | 'aggression'> {
    const systemPrompt =
      'You are a strict one-word content safety classifier. ' +
      'You MUST reply with exactly one word and nothing else: safe, distress, or aggression. ' +
      'No punctuation. No explanation. No preamble. Just the single word.';

    const prompt = `Classify the risk level of the text below.

LABELS:
- distress: expressions of self-harm, suicidal ideation, not wanting to exist, 
  feeling like a burden, severe hopelessness, "I want to disappear", "nobody 
  would miss me", "I'm so tired of living", "I can't do this anymore", 
  clinical despair, crisis-level emotional pain
- aggression: hate speech, slurs, threats of violence toward others, harassment
- safe: normal sadness, frustration, venting, daily struggles, shared grief

TEXT:
${content.slice(0, 1000)}

REPLY WITH ONE WORD ONLY:`;

    try {
      const response = await groqGenerate(prompt, 20, systemPrompt);

      // Scan from the END of the response for the first valid label.
      // This handles any preamble the model may have added despite instructions.
      const words = response.toLowerCase().match(/[a-z]+/g) ?? [];
      for (const word of [...words].reverse()) {
        if (word === 'distress') return 'distress';
        if (word === 'aggression') return 'aggression';
        if (word === 'safe') return 'safe';
      }

      // No recognisable label found — default to safe
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

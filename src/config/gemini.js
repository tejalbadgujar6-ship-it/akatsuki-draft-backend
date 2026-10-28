import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import ApiError from '../utils/apiError.js';

/**
 * Default model name if not specified in environment
 * Configurable via GEMINI_MODEL (e.g., 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro')
 */
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let genAIInstance = null;

/**
 * Initializes and returns the GoogleGenerativeAI instance
 */
export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
};

/**
 * Calls Google Gemini to improve written content
 * @param {string} content - The original post content
 * @param {object} options - Optional configuration (model, custom instructions)
 * @returns {Promise<string>} The improved content
 */
export const improveContentWithGemini = async (content, options = {}) => {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw ApiError.badRequest('Content to improve cannot be empty');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isMockAllowed = process.env.USE_AI_MOCK === 'true' || process.env.NODE_ENV === 'test';

  // If no API key is configured
  if (!apiKey) {
    if (isMockAllowed) {
      logger.warn('GEMINI_API_KEY not configured. Using simulated AI improvement for test/dev mode.');
      return mockImproveContent(content);
    }
    throw new ApiError(
      503,
      'Gemini AI service is unavailable: GEMINI_API_KEY environment variable is not configured on the server.'
    );
  }

  try {
    const genAI = getGeminiClient();
    const modelName = options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    });

    const prompt = `You are an expert editorial assistant.
Improve the following article content for grammar, readability, clarity, structure, and overall writing quality.
STRICT REQUIREMENTS:
1. Preserve the author's original meaning, core facts, and original intent completely.
2. Return ONLY the improved content text.
3. Do NOT include any intro, conversational preface (like "Here is the improved version:"), markdown block code fences, or concluding remarks.

Original Content:
${content.trim()}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedText = response.text();

    if (!improvedText || !improvedText.trim()) {
      throw new ApiError(502, 'Received empty response from Gemini AI service.');
    }

    return improvedText.trim();
  } catch (error) {
    logger.error(`Gemini AI service error: ${error.message}`);

    if (error instanceof ApiError) {
      throw error;
    }

    // Handle common Gemini API errors gracefully
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      throw new ApiError(429, 'Gemini AI rate limit or quota exceeded. Please try again shortly.');
    }

    if (error.status === 400 || error.message?.includes('API_KEY_INVALID')) {
      throw new ApiError(401, 'Invalid Gemini API Key configured on server.');
    }

    throw new ApiError(502, `Failed to improve content with Gemini AI: ${error.message}`);
  }
};

/**
 * Fallback simulated improvement function for offline test suites
 */
const mockImproveContent = (content) => {
  const trimmed = content.trim();
  // Capitalize first letter of each sentence and clean spacing
  const enhanced = trimmed
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, sep, char) => sep + char.toUpperCase())
    .replace(/\s+/g, ' ');

  return `${enhanced}\n\n[Enhanced for clarity and structure by AI Assistant]`;
};

export default {
  getGeminiClient,
  improveContentWithGemini,
  DEFAULT_GEMINI_MODEL
};

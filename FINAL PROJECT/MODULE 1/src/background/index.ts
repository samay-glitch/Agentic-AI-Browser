import { generateLongAnswer } from '../services/ai/gemini';

/**
 * Background Service Worker
 * 
 * This script runs in the background and acts as a proxy for sensitive operations.
 * For example, it handles AI requests so that the Gemini API key is never exposed
 * to the content scripts running in the potentially untrusted webpage context.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed
});

// Proxy for AI Requests to avoid exposing API keys in content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AI_REQUEST') {
    handleAIRequest(message.question)
      .then(answer => sendResponse({ status: 'SUCCESS', answer }))
      .catch(error => sendResponse({ status: 'ERROR', error: error.message }));
    
    return true; // Keep the message channel open for async response
  }
});

/**
 * Processes the AI request by retrieving the API key and user profile
 * from storage, and then calling the Gemini API to generate an answer.
 */
async function handleAIRequest(question: string): Promise<string> {
  // Get profile and API key from storage
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['agentic-profile-storage', 'gemini_api_key'], async (result) => {
      try {
        const apiKey = result['gemini_api_key'];
        if (!apiKey) {
          throw new Error("Gemini API Key not configured. Please set it in Options.");
        }

        const stateStr = result['agentic-profile-storage'];
        if (!stateStr) {
          throw new Error("Profile is empty.");
        }

        const state = JSON.parse(stateStr);
        const profile = state.state.profile;

        const answer = await generateLongAnswer(apiKey, question, profile);
        resolve(answer);
      } catch (err: any) {
        reject(err);
      }
    });
  });
}

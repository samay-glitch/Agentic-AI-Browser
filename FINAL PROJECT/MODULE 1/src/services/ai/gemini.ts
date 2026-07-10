import { UserProfile } from "@/types/profile";

/**
 * Discovers which Gemini models are available for the given API key.
 * Tries both v1beta and v1 endpoints and returns model names + the working API version.
 */
async function discoverModels(apiKey: string): Promise<{ models: string[]; apiVersion: string }> {
  for (const apiVersion of ['v1beta', 'v1']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''));
        if (models.length > 0) {
          return { models, apiVersion };
        }
      }
    } catch (_) {
      // Try next API version
    }
  }
  return { models: [], apiVersion: 'v1beta' };
}

/**
 * Tries to call generateContent with a list of models, returning the first successful result.
 */
async function callWithFallback(
  apiKey: string,
  apiVersion: string,
  models: string[],
  requestBody: object
): Promise<any> {
  const errors: string[] = [];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        errors.push(`${model}: ${err.error?.message || response.statusText}`);
        continue;
      }

      return await response.json();
    } catch (e: any) {
      errors.push(`${model}: ${e.message}`);
    }
  }

  // If we used v1beta and everything failed, try v1 (or vice versa)
  const otherVersion = apiVersion === 'v1beta' ? 'v1' : 'v1beta';
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${otherVersion}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        continue;
      }

      return await response.json();
    } catch (_) {
      // Continue
    }
  }

  throw new Error(`All models failed.\n\nTried: ${errors.join('\n')}\n\nPlease verify your API key at https://aistudio.google.com/app/apikey`);
}

/**
 * Picks the best model from a list, preferring flash > pro for speed.
 */
function prioritizeModels(models: string[]): string[] {
  const priority = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-robotics-er-1.6-preview",
    "gemma-4-31b",
    "flash",
    "pro",
  ];

  return [...new Set(models)].sort((a, b) => {
    const score = (model: string) => {
      const lower = model.toLowerCase();

      for (let i = 0; i < priority.length; i++) {
        if (lower.includes(priority[i])) return i;
      }

      return priority.length;
    };

    return score(a) - score(b);
  });
}

export async function generateLongAnswer(
  apiKey: string,
  question: string,
  profile: UserProfile
): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set it in the Options page.");
  }

  const profileContext = Object.entries(profile)
    .filter(([_, value]) => value && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const systemPrompt = `You are an AI assistant helping a user fill out a form. 
You will be provided with the user's profile information and the question from the form.
Your goal is to write a highly professional, well-structured, and concise answer to the question using ONLY the context provided in the user's profile.
Do not invent or hallucinate information that is not in the profile.
If the profile lacks sufficient information to fully answer the question, answer to the best of your ability with what is available, and gracefully omit what is not.

USER PROFILE:
${profileContext}

FORM QUESTION:
${question}`;

  const { models, apiVersion } = await discoverModels(apiKey);
  const modelsToTry = prioritizeModels(models.length > 0 ? models : [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-robotics-er-1.6-preview'
  ]);
  const requestBody = {
    contents: [{ parts: [{ text: systemPrompt }] }]
  };

  const data = await callWithFallback(apiKey, apiVersion, modelsToTry, requestBody);
  return data.candidates[0].content.parts[0].text.trim();
}

export interface VisionField {
  id: number;
  label: string;
  value: string;
}

export async function analyzeFormWithVision(
  apiKey: string,
  base64Image: string,
  profile: UserProfile
): Promise<VisionField[]> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing.");
  }

  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

  const profileContext = Object.entries(profile)
    .filter(([_, value]) => value && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const systemPrompt = `You are a highly advanced Vision AI Form Filler.
I am providing you with a screenshot of a web form where each input field has been marked with a red numbered badge (e.g., [0], [1], [2]).
Your task is to analyze the form visually, identify the label/purpose of each numbered field, and determine the correct value to fill based strictly on the provided USER PROFILE.

USER PROFILE:
${profileContext}

INSTRUCTIONS:
1. Examine the screenshot and locate the red numbered badges.
2. For each numbered badge, determine what the field is asking for based on the visual context (labels nearby, placeholders).
3. If the User Profile contains relevant information for that field, provide the value.
4. Return your response ONLY as a raw JSON array of objects. Do not include markdown formatting or any other text.
5. Format: [{"id": 0, "label": "Detected Label", "value": "Value to fill"}]
6. Only include fields where you have a value to fill. If the profile has no relevant data for a field, omit it from the array.`;

  const requestBody = {
    contents: [{
      parts: [
        { text: systemPrompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ]
    }]
  };

  const { models, apiVersion } = await discoverModels(apiKey);
  
  // For vision, prefer models that support multimodal (1.5+, 2.0+, or pro-vision)
  const visionCapable = models.filter(m => {
  const name = m.toLowerCase();

  return (
    name.includes("flash") ||
    name.includes("omni") ||
    name.includes("vision") ||
    name.includes("image") ||
    name.includes("banana") ||
    name.includes("pro")
  );
});
  const modelsToTry = prioritizeModels(
  visionCapable.length > 0
    ? visionCapable
    : (models.length > 0
        ? models
        : [
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite',
            'gemini-3-flash',
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite'
          ])
);

  const data = await callWithFallback(apiKey, apiVersion, modelsToTry, requestBody);
  let text = data.candidates[0].content.parts[0].text.trim();
  
  // Clean up potential markdown formatting
  text = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  
  return JSON.parse(text) as VisionField[];
}

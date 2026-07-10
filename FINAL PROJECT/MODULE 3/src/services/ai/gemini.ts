import { AI_CONFIG } from '@/constants';
import type { Settings } from '@/types/settings';
import type { Summary } from '@/types/summary';
import { calculateReadingTime } from '@/utils/time';

export interface CompareResult {
  pages: {
    title: string;
    url: string;
    tldr: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  comparison: {
    similarities: string[];
    differences: string[];
    recommendation: string;
  };
}

export class GeminiService {
  // ─── Core API Call ──────────────────────────────────────────
  private static async callAPI(
    systemPrompt: string,
    userContent: string,
    settings: Settings
  ): Promise<string> {
    if (!settings.apiKey) {
      throw new Error('Gemini API key is missing. Please configure it in Settings.');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userContent }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: AI_CONFIG.TEMPERATURE,
      }
    });

    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    // Auto-retry once on 503 High Demand or 429 Rate Limit
    if (response.status === 503 || response.status === 429) {
      console.warn('Gemini API overloaded. Retrying in 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the response was blocked by safety settings
    if (data.promptFeedback?.blockReason) {
        throw new Error(`Content blocked by Gemini Safety Settings: ${data.promptFeedback.blockReason}`);
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No response from Gemini API');
    }

    return resultText;
  }

  // ─── System Prompts ──────────────────────────────────────────

  private static getSummarizePrompt(length: Settings['summaryLength']): string {
    const lengthInstructions = {
      brief: 'Keep the summary very concise and short.',
      standard: 'Provide a balanced, informative summary.',
      detailed: 'Provide a highly detailed and comprehensive summary.',
    };

    return `You are a Principal AI Web Analyst.
Your task is to analyze the provided web page content and extract structured insights.
${lengthInstructions[length]}
Always respond with valid JSON matching the exact schema provided. Do not include markdown formatting like \`\`\`json.

Schema:
{
  "tldr": "3 sentence TL;DR",
  "keyTakeaways": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "importantFacts": ["fact 1", "fact 2"],
  "actionItems": ["action 1", "action 2"],
  "technologies": ["tech 1", "tech 2"],
  "tags": ["tag 1", "tag 2"],
  "usefulLinks": ["link 1 (if found)"],
  "aiSuggestions": ["suggestion 1", "suggestion 2"],
  "metadata": {
    "category": "e.g. Technology, News, Documentation",
    "language": "e.g. English",
    "complexity": "Easy, Intermediate, Advanced, or Expert",
    "sentiment": "Positive, Negative, or Neutral"
  }
}`;
  }

  private static getTranslatePrompt(targetLanguage: string, length: Settings['summaryLength']): string {
    const lengthInstructions = {
      brief: 'Keep the summary very concise and short.',
      standard: 'Provide a balanced, informative summary.',
      detailed: 'Provide a highly detailed and comprehensive summary.',
    };

    return `You are a multilingual AI Web Analyst.
Your task is to analyze the provided web page content. The content may be in any language.
1. Detect the original language of the content.
2. Translate and summarize the content into ${targetLanguage}.
${lengthInstructions[length]}
Always respond with valid JSON matching the exact schema. Do not include markdown formatting.

Schema:
{
  "tldr": "3 sentence TL;DR in ${targetLanguage}",
  "keyTakeaways": ["point 1 in ${targetLanguage}", "point 2"],
  "importantFacts": ["fact 1 in ${targetLanguage}"],
  "actionItems": ["action 1 in ${targetLanguage}"],
  "technologies": ["tech 1", "tech 2"],
  "tags": ["tag 1", "tag 2"],
  "usefulLinks": ["link 1 (if found)"],
  "aiSuggestions": ["suggestion 1 in ${targetLanguage}"],
  "metadata": {
    "category": "e.g. Technology, News, Documentation",
    "language": "detected source language name (e.g. Japanese, French)",
    "targetLanguage": "${targetLanguage}",
    "complexity": "Easy, Intermediate, Advanced, or Expert",
    "sentiment": "Positive, Negative, or Neutral"
  }
}`;
  }

  private static getComparePrompt(count: number): string {
    return `You are an AI Web Analyst specializing in comparative analysis.
You will be given content from ${count} web pages. For each page, analyze it individually AND then provide a comparative overview.
Always respond with valid JSON. Do not include markdown formatting.

Schema:
{
  "pages": [
    {
      "title": "Page title",
      "url": "page URL",
      "tldr": "2 sentence summary",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  ],
  "comparison": {
    "similarities": ["similarity 1", "similarity 2"],
    "differences": ["difference 1", "difference 2"],
    "recommendation": "Which one to choose and why, in 2-3 sentences"
  }
}`;
  }

  private static getJobPrompt(): string {
    return `You are an Expert Technical Recruiter and Career Coach.
Analyze the provided job description and extract structured insights.
Always respond with valid JSON matching exactly this schema:
{
  "company": "Company Name",
  "role": "Job Title",
  "location": "Location or Remote",
  "salary": "Salary info if found, else 'Not specified'",
  "experience": "Years of experience required",
  "employmentType": "Full-time, Contract, etc",
  "tldr": "2 sentence summary of the role",
  "requiredSkills": ["skill 1", "skill 2"],
  "preferredSkills": ["skill 1", "skill 2"],
  "responsibilities": ["task 1", "task 2"],
  "resumeKeywords": ["ATS keyword 1", "ATS keyword 2"],
  "interviewTopics": ["topic 1", "topic 2"],
  "difficultyScore": 85
}`;
  }

  // ─── Parse Summary Response ─────────────────────────────────

  private static parseSummaryResponse(resultText: string, content: string, title: string, url: string): Summary {
    // Sometimes Gemini wraps JSON in markdown blocks even with responseMimeType
    const cleanJson = resultText.replace(/^```json/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(cleanJson);
    const wordCount = content.split(/\s+/).length;

    return {
      id: crypto.randomUUID(),
      metadata: {
        title,
        url,
        category: parsed.metadata?.category || 'Unknown',
        language: parsed.metadata?.language || 'Unknown',
        readingTime: `${calculateReadingTime(wordCount)} min`,
        complexity: parsed.metadata?.complexity || 'Unknown',
        sentiment: parsed.metadata?.sentiment || 'Neutral',
      },
      tldr: parsed.tldr || 'No TL;DR generated.',
      keyTakeaways: parsed.keyTakeaways || [],
      importantFacts: parsed.importantFacts || [],
      actionItems: parsed.actionItems || [],
      technologies: parsed.technologies || [],
      tags: parsed.tags || [],
      usefulLinks: parsed.usefulLinks || [],
      aiSuggestions: parsed.aiSuggestions || [],
      readingInsights: {
        wordCount,
        charCount: content.length,
        readingTimeMinutes: calculateReadingTime(wordCount),
        difficulty: parsed.metadata?.complexity || 'Intermediate',
        language: parsed.metadata?.language || 'English',
      },
      rawMarkdown: '',
      createdAt: Date.now(),
      source: 'current-page',
    };
  }

  // ─── Public Methods ─────────────────────────────────────────

  public static async summarize(
    content: string,
    title: string,
    url: string,
    settings: Settings
  ): Promise<Summary> {
    const truncated = content.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const prompt = this.getSummarizePrompt(settings.summaryLength);
    const userContent = `Title: ${title}\nURL: ${url}\nContent:\n${truncated}`;

    try {
      const resultText = await this.callAPI(prompt, userContent, settings);
      return this.parseSummaryResponse(resultText, content, title, url);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('AI returned an invalid JSON response.');
      }
      throw e;
    }
  }

  public static async translateAndSummarize(
    content: string,
    title: string,
    url: string,
    targetLanguage: string,
    settings: Settings
  ): Promise<Summary> {
    const truncated = content.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const prompt = this.getTranslatePrompt(targetLanguage, settings.summaryLength);
    const userContent = `Title: ${title}\nURL: ${url}\nContent:\n${truncated}`;

    try {
      const resultText = await this.callAPI(prompt, userContent, settings);
      const summary = this.parseSummaryResponse(resultText, content, title, url);
      // Override the language field with the detected source language
      const cleanJson = resultText.replace(/^```json/m, '').replace(/```$/m, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.metadata?.targetLanguage) {
        summary.metadata.language = `${parsed.metadata.language} → ${parsed.metadata.targetLanguage}`;
      }
      return summary;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('AI returned an invalid JSON response.');
      }
      throw e;
    }
  }

  public static async comparePages(
    pages: { content: string; title: string; url: string }[],
    settings: Settings
  ): Promise<CompareResult> {
    const prompt = this.getComparePrompt(pages.length);

    const userContent = pages
      .map(
        (p, i) =>
          `--- PAGE ${i + 1} ---\nTitle: ${p.title}\nURL: ${p.url}\nContent:\n${p.content.slice(0, Math.floor(AI_CONFIG.MAX_CONTENT_LENGTH / pages.length))}\n`
      )
      .join('\n');

    try {
      const resultText = await this.callAPI(prompt, userContent, settings);
      const cleanJson = resultText.replace(/^```json/m, '').replace(/```$/m, '').trim();
      return JSON.parse(cleanJson) as CompareResult;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('AI returned an invalid JSON response.');
      }
      throw e;
    }
  }

  public static async analyzeJob(
    content: string,
    title: string,
    url: string,
    settings: Settings
  ): Promise<any> {
    const truncated = content.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const prompt = this.getJobPrompt();
    const userContent = `Title: ${title}\nURL: ${url}\nContent:\n${truncated}`;

    try {
      const resultText = await this.callAPI(prompt, userContent, settings);
      const cleanJson = resultText.replace(/^```json/m, '').replace(/```$/m, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('AI returned an invalid JSON response.');
      }
      throw e;
    }
  }
}

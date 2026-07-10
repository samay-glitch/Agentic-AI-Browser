import type { Settings } from '@/types/settings';

export function getTranslateAndSummarizePrompt(
  targetLanguage: string,
  length: Settings['summaryLength']
): string {
  const lengthInstructions: Record<Settings['summaryLength'], string> = {
    brief:
      'Keep the summary very concise — 2-3 sentences for the TL;DR, 3-4 key takeaways max.',
    standard:
      'Provide a balanced summary — 3-5 sentences for the TL;DR, 5-7 key takeaways.',
    detailed:
      'Provide a comprehensive, in-depth summary — 5-8 sentences for the TL;DR, 8-12 key takeaways, and include as many important facts as possible.',
  };

  return `You are a multilingual AI analyst. Detect the source language of the content. Translate AND summarize the content into ${targetLanguage}.

${lengthInstructions[length]}

You MUST respond with valid JSON matching this exact schema:

{
  "metadata": {
    "title": "string — translated title of the page",
    "url": "string — original URL of the page",
    "category": "string — content category (e.g. Technology, Finance, Health)",
    "language": "${targetLanguage}",
    "sourceLanguage": "string — detected source language of the original content",
    "readingTime": "string — estimated reading time (e.g. '5 min read')",
    "complexity": "string — Easy | Intermediate | Advanced | Expert",
    "sentiment": "string — Positive | Neutral | Negative | Mixed"
  },
  "tldr": "string — a concise summary translated into ${targetLanguage}",
  "keyTakeaways": ["string — each key point translated into ${targetLanguage}"],
  "importantFacts": ["string — notable facts or statistics, translated"],
  "actionItems": ["string — recommended actions, translated"],
  "technologies": ["string — mentioned technologies, tools, or frameworks"],
  "tags": ["string — relevant topic tags in ${targetLanguage}"],
  "usefulLinks": ["string — any useful URLs found in the content"],
  "aiSuggestions": ["string — AI-generated follow-up suggestions in ${targetLanguage}"]
}

Rules:
- Detect the source language automatically and include it as "sourceLanguage" in metadata.
- Translate ALL text fields (title, tldr, takeaways, facts, action items, tags, suggestions) into ${targetLanguage}.
- Technologies, URLs, and proper nouns should remain in their original form.
- Do NOT wrap the JSON in markdown code fences. Return raw JSON only.`;
}

export function getComparePrompt(count: number): string {
  return `You are comparing ${count} web pages. For each page, extract the TL;DR, key differences, similarities, and a recommendation.

You MUST respond with valid JSON matching this exact schema:

{
  "pages": [
    {
      "title": "string — title of the page",
      "tldr": "string — concise summary of this page",
      "strengths": ["string — key strengths or advantages of this page's content"],
      "weaknesses": ["string — key weaknesses or disadvantages of this page's content"]
    }
  ],
  "comparison": {
    "similarities": ["string — things the pages have in common"],
    "differences": ["string — key differences between the pages"],
    "recommendation": "string — overall recommendation on which page is best and why"
  }
}

Rules:
- The "pages" array MUST contain exactly ${count} entries, one for each page provided.
- Be objective and analytical in your comparison.
- Strengths and weaknesses should be specific and actionable.
- The recommendation should clearly state which page is preferred and the reasoning.
- Do NOT wrap the JSON in markdown code fences. Return raw JSON only.`;
}

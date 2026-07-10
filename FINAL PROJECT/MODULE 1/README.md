# Agentic AI Browser Assistant 🤖✨

An intelligent, AI-powered browser extension that acts as your personal auto-fill assistant. It securely stores your personal, professional, and educational profile and intelligently fills complex web forms, including Google Forms and single-page applications. 

Powered by **React**, **Vite**, **Tailwind CSS v4**, and **Gemini API**.

## 🚀 Features

- **🧠 Intelligent Auto-Fill**: Uses heuristic field-matching to understand form inputs across the web, automatically filling names, emails, GitHub links, and more.
- **✨ AI Long-Form Generation**: Encounter a tricky question like *"Why do you want to work here?"*? The built-in AI will read the context of the question and generate a tailored, professional response strictly based on your saved profile.
- **⚡ Modern Architecture**: Built on Manifest V3, utilizing `MutationObserver` to support dynamically rendered forms in React, Vue, and Angular SPAs.
- **🔒 Privacy First**: Your profile and Gemini API keys are stored entirely locally on your device via `chrome.storage.local`.
- **🎨 Premium UI/UX**: Features a beautiful, dark-mode-first interface built with Tailwind CSS v4 and animated with Framer Motion. Includes a Floating Action Button (FAB) injected via isolated Shadow DOM.

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite + CRXJS (Manifest V3)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **State Management**: Zustand (with persistent chrome storage)
- **Validation**: Zod
- **AI**: Gemini API (`gemini-1.5-flash`)

## 📦 Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/agentic-ai-browser-assistant.git
   cd agentic-ai-browser-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```
   *(Note: You can also use `npm run dev` for HMR development, but you may need to reload the extension occasionally).*

4. Load into Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** in the top right corner.
   - Click **Load unpacked** and select the `dist` folder generated in step 3.

## ⚙️ Configuration

1. Click the extension icon in your toolbar to open the **Dashboard**.
2. Click **Complete Profile** (or the Settings icon) to open the Options page.
3. Fill out your details in the **Profile** tab.
4. Navigate to the **Settings** tab and securely enter your Gemini API key (required for the AI Generation feature).
5. Hit **Save**. You're ready to go!

## 🧑‍💻 Architecture Highlights

- **Shadow DOM Injection**: The on-page Floating Action Button and Inline Menu are injected into a Shadow DOM via the content script. This guarantees that host website CSS doesn't break the extension UI, and the extension's Tailwind classes don't leak into the host page.
- **Native Setter Bypass**: React and Angular override native input setters (`input.value = "text"`). The extension's `AutoFiller` engine bypasses this using `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` to trigger synthetic events correctly.

## 🎓 Academic Submission Note
This project was designed and built as a scalable, production-grade application for a portfolio submission. It strictly adheres to modern TypeScript paradigms and React component best practices.

---
*Built with ❤️ for the future of web browsing.*

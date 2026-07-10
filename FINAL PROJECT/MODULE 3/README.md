# 🌐 Agentic AI Browser Extension

Welcome to the **Agentic AI Browser** project repository! This project transforms your standard web browser into a highly intelligent, autonomous assistant. By seamlessly integrating the power of the Google Gemini API directly into the browser, it reads, understands, and interacts with web pages on your behalf.

## ✨ Core Features

* **Instant Page Summarisation**: Instantly distil massive Wikipedia articles, long documentation, or dense blogs into brief, standard, or detailed summaries using the latest Google Gemini models.
* **Side-by-Side URL Comparison**: Drop in up to 5 different URLs (like product pages or research articles) and have the AI analyse them simultaneously to provide strengths, weaknesses, and a final recommendation.
* **Smart History & Persistence**: Your summaries and comparisons are saved locally in the browser so you can revisit them anytime. State is preserved even if you close the popup.
* **Dynamic Model Selection**: Connects directly to the Google `v1beta` API to fetch the exact AI models available to your account, allowing you to seamlessly swap to high-quota models like `gemini-1.5-flash-8b`.
* **Private & Secure**: Operates entirely within your browser's local storage and communicates directly with the Gemini REST API. No intermediate servers are used.

## 🚀 How to Install & Use (Free)

You can run this extension locally in your browser for free by loading it as an "Unpacked Extension" in Chrome, Brave, or Edge.

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/samay-glitch/Agentic-AI-Browser.git
   ```
2. **Locate the Build Folder**: 
   Navigate into the `FINAL PROJECT/MODULE 3/dist` directory. This is the production-ready build of the extension.
3. **Enable Developer Mode**:
   Open Google Chrome and navigate to `chrome://extensions/`. Turn on the **Developer mode** toggle in the top right corner.
4. **Load the Extension**:
   Click the **Load unpacked** button and select the `dist` folder. The extension is now installed!
5. **Add your API Key**:
   Click the extension icon, navigate to **Settings**, and paste your Google Gemini API Key. Click **Fetch Models** to select your preferred AI, and you are ready to go!

## 🛠️ Tech Stack
* **Framework:** React + TypeScript + Vite
* **Styling:** TailwindCSS + Lucide Icons
* **Browser API:** Manifest V3 (Service Workers, Offscreen Documents, Local Storage)
* **AI Provider:** Google Gemini REST API

## 📂 Repository Structure
This repository contains multiple modules representing the progressive evolution of the Agentic AI Browser:
* `FINAL PROJECT/MODULE 1/`: Initial AI prototypes and form auto-fill capabilities.
* `FINAL PROJECT/MODULE 3/`: The fully polished, production-ready extension featuring dynamic model fetching, multi-page compare, and robust state management. 

---
*Built as a state-of-the-art demonstration of Agentic AI in the browser.*

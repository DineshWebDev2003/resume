# VORTEX AI — Next-Gen Voice & Conversational Intelligence Studio

Single-Page Voice AI Web Application with real-time Speech-to-Text (STT), Neural Text-to-Speech (TTS), Multi-Session Chat history, and instant Cloudflare Pages deployment.

## 🌐 Live Production URL
👉 **[https://vortex-voice-ai.pages.dev](https://vortex-voice-ai.pages.dev)**

---

## 🚀 Key Features

1. **🎙️ Voice Input (Speech-to-Text)**:
   - Web Speech API integration (`webkitSpeechRecognition` / `SpeechRecognition`).
   - Seamless Bilingual voice recognition: **Tamil (ta-IN)** and **English (en-US / en-IN)**.
   - Real-time interim transcription banner with live text preview.
   - Hands-Free Mode toggle (speaks -> auto-sends -> AI voices back).

2. **🔊 Voice Output (Neural Text-to-Speech)**:
   - Web Speech Synthesis API with custom pitch, speed rate (0.7x - 1.5x), and browser voice selection.
   - Auto-read toggle (turns on/off voice readout for AI replies).
   - Dynamic animated audio visualizer waves while AI is speaking.
   - Individual message "Read Aloud" (🔊) and "Copy" (📋) action buttons.

3. **💬 New Chat & Session Memory**:
   - One-click `+ New Chat` button to start a fresh conversation anytime.
   - Persistent chat session drawer saved in browser `localStorage`.
   - Ability to switch between past conversations or delete individual chats.
   - Pre-configured quick prompt suggestion pills (Tamil Demo, ATS Resume Guide, Mock Interview, Cloudflare Architecture).

4. **⚡ Zero-Build Cloudflare Pages Ready**:
   - Single standalone HTML5 file with Tailwind CSS, Google Fonts, and Lucide-style SVG icons.
   - Configured `_headers` for secure headers and microphone permissions.

---

## 🛠️ Deploy to Cloudflare Pages

To deploy any future updates to Cloudflare Pages:
```bash
cd c:\workspace\resume\voice-ai-landing
..\cloudflare-backend\node_modules\.bin\wrangler pages deploy . --project-name vortex-voice-ai --commit-dirty=true
```


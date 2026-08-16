# 🧠 CrackSkull AI

<div align="center">

### 🚀 Multilingual AI-Powered Exam Preparation Copilot, Voice Tutor & Academic Agent System

An intelligent, production-ready web application designed to help students prepare for semester exams, viva, placements, previous-year questions, notes, PDFs, mock quizzes, revision, and focus planning using Gemini-powered AI agents with multilingual text and speech support.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Express](https://img.shields.io/badge/Node.js-Express-lightgrey?style=for-the-badge&logo=express)
![Gemini AI](https://img.shields.io/badge/Google--Gemini-AI-orange?style=for-the-badge&logo=google)
![Voice AI](https://img.shields.io/badge/Voice-Multilingual-success?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)

</div>

---

# 📌 Project Overview

**CrackSkull AI** is an advanced academic productivity and exam-preparation platform built for college and university students. It combines a multilingual AI tutor, voice assistant, AI study planner, previous-year-question radar, PDF learning studio, mock quiz generator, viva simulator, flashcards, focus timer, exam calendar, academic analytics, and student profile tracking into one full-stack application.

The assistant supports multiple specialized AI agents and multilingual learning workflows, making it useful for students who want explanations, exam answers, coding help, revision notes, interview preparation, or spoken guidance in their preferred language.

---

# ✨ Key Features

- 🌐 **Multilingual AI Tutor**: Supports Auto Detect, English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Urdu, Spanish, French, and Arabic.
- 🎙️ **Multilingual Voice Assistant**: Browser speech recognition and text-to-speech for asking questions by voice and listening to AI responses.
- 🤖 **12 Specialized AI Agents**: Tutor, Exam Mode, Doubt Solver, PYQ Agent, Study Planner, Beginner Mode, Coding Mentor, Document Q&A, Viva Examiner, Revision Coach, Interview Agent, and Study Wellness Agent.
- 📚 **AI Tutor Copilot**: Step-by-step concept explanations, exam-focused answers, diagrams, tables, examples, and follow-up study actions.
- 🧪 **AI Quiz & Mock Test Generator**: Creates subject-wise quizzes with explanations, marks, difficulty levels, and performance tracking.
- 📡 **Exam Radar / PYQ Analyzer**: Identifies high-priority topics, recurring question patterns, marks weightage, and likely exam questions.
- 📄 **PDF Learning Studio**: Analyzes academic documents and generates summaries, key formulas, core concepts, flashcards, and predicted questions.
- 🎓 **AI Viva Simulator**: Generates viva questions, evaluates student answers, gives scores, and suggests improvements.
- 🗂️ **Spaced Flashcards**: Saves AI-generated answers into flashcards for long-term retention and revision.
- ⏱️ **Focus Pomodoro Timer**: Helps students structure deep work sessions with study-friendly timing.
- 🗓️ **Exam Calendar & Study Plan**: Tracks exams, daily tasks, weekly roadmap, and Crack Mode sprint preparation.
- 📊 **Academic Analytics**: Tracks mastery, weak topics, quiz attempts, XP, streaks, and Crack Score.
- 🛠️ **Admin Dashboard**: Includes administrative and operational views for managing the learning platform.

---

# 🤖 AI Agents & Learning Engine

| Agent | Purpose |
|-------|---------|
| Tutor Agent | Deep conceptual explanations with examples and structured breakdowns |
| Exam Mode Agent | High-scoring 2-mark, 5-mark, and 10-mark answer formatting |
| Doubt Solver Agent | Finds the exact confusion and resolves it with minimal examples |
| PYQ Agent | Predicts previous-year-question patterns and model answer skeletons |
| Study Planner Agent | Builds time-boxed plans for weak topics and upcoming exams |
| Beginner Agent | Explains difficult concepts with simple analogies and low jargon |
| Coding Mentor Agent | Provides code, Big-O analysis, edge cases, and testing guidance |
| Document Q&A Agent | Answers based on uploaded notes, PDFs, and document excerpts |
| Viva Examiner Agent | Asks oral questions and evaluates technical depth |
| Revision Coach Agent | Creates fast summaries, formula sheets, and memory anchors |
| Interview Agent | Prepares students for placement and technical interviews |
| Wellness Agent | Provides practical focus resets and exam-stress study routines |

---

# 🛠️ Technology Stack

## Frontend

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons & UI**: Lucide React Icons
- **Charts**: Recharts
- **Animations**: Motion, Canvas Confetti
- **Voice**: Browser Web Speech API

## Backend & API

- **Runtime**: Node.js
- **Server Framework**: Express.js
- **AI Engine**: `@google/genai`
- **AI Provider**: Google Gemini API
- **Development Server**: Express + Vite middleware
- **Production Build**: Vite frontend + bundled Express server

## Data & State

- **Client State**: React Context
- **Persistence**: Local browser storage service
- **Academic Data**: Subjects, documents, flashcards, quizzes, attempts, calendar events, study plans, and analytics

---

# 📂 Project Structure

```text
crack-skull-ai/
│
├── server.ts                         # Express + Vite server and Gemini API endpoints
├── metadata.json                     # AI Studio app metadata
├── package.json                      # Dependencies and npm scripts
├── package-lock.json                 # npm dependency lockfile
├── bun.lock                          # Bun dependency lockfile
├── tsconfig.json                     # TypeScript compiler configuration
├── vite.config.ts                    # Vite configuration
├── README.md                         # Project documentation
│
└── src/
    ├── App.tsx                       # Main app layout and view router
    ├── main.tsx                      # React entry point
    ├── index.css                     # Tailwind and global styles
    │
    ├── components/
    │   ├── ai/
    │   │   └── AITutorView.tsx       # Multilingual AI agents chat interface
    │   ├── common/
    │   │   ├── VoiceAssistantModal.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   ├── GlobalSearchModal.tsx
    │   │   └── SettingsModal.tsx
    │   ├── dashboard/                # Command dashboard and Crack Score overview
    │   ├── study/                    # Adaptive study plan and Crack Mode workflow
    │   ├── exam/                     # Exam Radar and PYQ analysis
    │   ├── documents/                # PDF Learning Studio
    │   ├── quiz/                     # AI quiz and mock test view
    │   ├── viva/                     # AI viva simulator
    │   ├── flashcards/               # Spaced flashcards
    │   ├── focus/                    # Pomodoro focus timer
    │   ├── knowledge/                # Knowledge map
    │   ├── library/                  # Digital library
    │   ├── analytics/                # Academic analytics
    │   ├── calendar/                 # Exam calendar
    │   ├── profile/                  # Student profile
    │   └── admin/                    # Admin dashboard
    │
    ├── context/
    │   └── AppContext.tsx            # Global app state and actions
    │
    ├── services/
    │   ├── aiService.ts              # Frontend AI API client and TTS helper
    │   ├── languageService.ts        # Multilingual assistant language metadata
    │   ├── storageService.ts         # Local persistence and score calculation
    │   └── demoData.ts               # Demo academic data
    │
    └── types/
        └── index.ts                  # Shared TypeScript interfaces and types
```

---

# 🚀 Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/shaikmahammadshajid-crypto/crack-skull-ai.git
```

## 2. Navigate to Directory

```bash
cd crack-skull-ai
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Set Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

You can also use the included example file:

```bash
cp .env.example .env.local
```

## 5. Run Development Server

```bash
npm run dev
```

The application will launch on:

```text
http://localhost:3000
```

## 6. Build for Production

```bash
npm run build
npm start
```

---

# 📊 AI Study Workflow

```text
Student Selects Subject / Opens AI Agent
                 │
                 ▼
Chooses Mode + Preferred Language
                 │
                 ▼
Asks by Text or Voice
                 │
                 ▼
Express API Sends Context to Gemini
                 │
                 ▼
Multilingual AI Response Generated
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 Listen with TTS      Save as Flashcard
       │                   │
       ▼                   ▼
Generate Quiz       Track Progress
       │                   │
       └─────────┬─────────┘
                 ▼
         Improve Crack Score
```

---

# 🔒 Security & Privacy Features

- **Server-Side AI Proxy**: Gemini API keys stay on the Express backend and are not exposed in frontend code.
- **Offline Fallbacks**: The app provides fallback academic responses and demo data when the API key is missing.
- **Local Study Persistence**: Student progress, flashcards, quizzes, and preferences are stored locally through the storage service.
- **No Hardcoded Secrets**: API keys are loaded from environment variables.
- **Typed Data Models**: Shared TypeScript interfaces reduce unsafe data handling across the app.

---

# 📷 Key Application Views

- 🏠 **Command Center**: Crack Score, progress overview, tasks, study analytics, and shortcuts.
- 🤖 **AI Agents Copilot**: Multilingual chat interface with 12 academic agents.
- 🎙️ **Voice Assistant**: Speech-based academic assistant with multilingual recognition and voice output.
- 📅 **Adaptive Study Plan**: Daily missions, weekly roadmap, weak-topic targeting, and Crack Mode.
- 📡 **Exam Radar**: Previous-year-question topic prediction and marks-weightage strategy.
- 📄 **PDF Learning Studio**: Document summaries, formulas, concept extraction, and predicted questions.
- 🧪 **AI Quiz & Mock Test**: Dynamic quiz generation and attempt tracking.
- 🎓 **AI Viva Simulator**: University/project viva preparation with scoring and feedback.
- 🗂️ **Spaced Flashcards**: AI-assisted revision cards and mastery tracking.
- ⏱️ **Focus Pomodoro**: Study timer for distraction-free preparation.
- 📚 **Digital Library**: Saved learning resources and bookmarks.
- 📊 **Academic Analytics**: Subject mastery, weak topics, accuracy, streaks, and XP.

---

# 🌐 Live Demo & Repository

- 💻 **GitHub Repository**: [https://github.com/shaikmahammadshajid-crypto/crack-skull-ai](https://github.com/shaikmahammadshajid-crypto/crack-skull-ai)
- 🧪 **Local Development URL**: `http://localhost:3000`
- 🚀 **Render Deployment**: This repository includes `render.yaml` for Blueprint deployment. Connect this GitHub repo in Render, set `GEMINI_API_KEY`, and Render will build with `npm install && npm run build` and start with `npm start`.

---

# 🚀 Future Enhancements

- Cloud database sync for student progress and multi-device login
- Real PDF upload parsing with page-level citations
- Speech-to-speech tutoring with streaming AI responses
- More Indian regional language UI translations
- Advanced spaced-repetition algorithm
- Teacher/admin portal for classroom analytics
- Deployment pipeline for Vercel, Render, Railway, or Firebase Hosting
- RAG-based document search over uploaded notes and textbooks

---

# 👨‍💻 Author

**Shaik Mahammad Shajid**  
B.Tech Computer Science & Engineering (Data Science)  
Presidency University  
GitHub: [@shaikmahammadshajid-crypto](https://github.com/shaikmahammadshajid-crypto)

---

# 📜 License

This project is developed for educational, academic productivity, and AI learning research purposes.

---

<div align="center">

### ⭐ If you found this project helpful, please consider giving it a Star on GitHub! ⭐

</div>

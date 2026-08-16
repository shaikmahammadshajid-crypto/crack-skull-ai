# CrackSkull AI

CrackSkull AI is a multilingual exam-preparation copilot for students. It combines AI tutoring, voice assistance, study planning, previous-year-question analysis, mock quizzes, viva practice, flashcards, PDF learning tools, focus sessions, and academic analytics in one React + Express app.

## Key Features

- Multilingual AI tutor with Auto Detect plus English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Urdu, Spanish, French, and Arabic options.
- Multilingual speech recognition and text-to-speech support through the browser Web Speech APIs.
- 12 AI agents: Tutor, Exam Mode, Doubt Solver, PYQ Agent, Study Planner, Beginner, Coding Mentor, Document Q&A, Viva Examiner, Revision Coach, Interview Agent, and Study Wellness Agent.
- Voice assistant modal for speaking or typing academic questions.
- AI quiz and mock test generation.
- Exam Radar for previous-year-question and high-probability topic analysis.
- PDF Learning Studio for document summaries, formulas, concepts, predicted questions, flashcards, and quick quizzes.
- Viva simulator for project, technical, and university oral practice.
- Adaptive study plan, Crack Mode sprint planning, focus timer, flashcards, calendar, library, knowledge map, and academic analytics.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express
- Google Gemini via `@google/genai`

## Run Locally

Prerequisites:

- Node.js 20 or newer
- Gemini API key

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env.local
```

Set your Gemini key in `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev      # Start Express + Vite development server
npm run lint     # Type-check the project
npm run build    # Build frontend and production server
npm run start    # Run the production build
npm run clean    # Remove build output
```

## Notes

Speech recognition and speech output depend on browser and operating-system language support. If a browser does not support speech recognition for a selected language, the assistant still supports typed multilingual chat.

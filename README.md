# FutureMe — AI-Powered Personal Reflection Engine

FutureMe is a premium, high-fidelity web application built for personal reflection and guidance. Users input their current goals, struggles, and desired guidance tone, and receive an emotional, highly personalized, and actionable letter from their future self, along with an interactive, contextual conversation portal to ask follow-up questions.

This project is built under **Nitish’s Founder Labs** with a premium Apple-style dark glassmorphism design.

---

## Technical Stack & Highlights

- **Frontend**: Single Page Application using clean semantic HTML5, high-performance vanilla JavaScript, and modern responsive CSS with variable-driven styling, backdrop blurs, radial glows, and micro-animations.
- **Backend**: Node.js + Express server hosting both static files and secure API routes.
- **AI Engine**: Google Gemini API via the official `@google/generative-ai` SDK, leveraging `gemini-1.5-flash` for super-fast response times.
- **Unified Architecture**: The Express server hosts the frontend static files on port `5000`, eliminating complex multi-origin CORS configurations and simplifying the setup for live demos down to a single terminal command.

---

## Project Structure

```text
futureme/
├── backend/
│   ├── public/              # Static frontend assets served by Express
│   │   ├── index.html       # Clean Apple-style premium interface
│   │   ├── style.css        # Premium glassmorphic styling system
│   │   └── script.js        # Form validation, API calls, and chat state engine
│   ├── server.js            # Node.js + Express backend server
│   ├── package.json         # Backend dependencies & project scripts
│   ├── .env                 # Port & Gemini API credentials (local, git-ignored)
│   └── .env.example         # Template for environment configuration
└── README.md                # Project documentation
```

---

## Installation & Setup

Follow these simple steps to run FutureMe locally:

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) installed on your system. 

### 2. Install Dependencies
Open a terminal in the `backend` directory and install the necessary npm packages:
```bash
cd backend
npm install
```

### 3. Configure Gemini API Key
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. In the `backend` directory, rename `.env.example` to `.env` or create a new `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and replace `your_gemini_api_key_here` with your actual API key:
   ```env
   GEMINI_API_KEY=...your_actual_key_here
   PORT=5000
   ```

### 4. Run the Application
Start the unified server in development/start mode:
```bash
npm start
```
You should see:
```text
🚀 FutureMe Backend Server running on Port 5000
🔗 Local Access: http://localhost:5000
```

### 5. Access the Web App
Open your browser and navigate to:
```text
http://localhost:5000
```
Fill out the details and begin speaking with your future self!

---

## API Routes Documentation

The backend exposes two high-level endpoints:

### 1. POST `/api/generate-futureme`
Generates the core FutureMe reflection report based on the user's current situation.
- **Request Body**:
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```
- **Response Schema** (AI outputs strict JSON matching this structure):
  ```json
  {
    "success": true,
    "data": {
      "message": "A powerful 120-180 word message from the future self.",
      "futureIdentity": "A concise description of who the user is becoming.",
      "nextMoves": ["Action 1", "Action 2", "Action 3"],
      "habit": "One small daily habit they should start today.",
      "warning": "One mistake their future self warns them about.",
      "mantra": "A short memorable line they can repeat daily."
    }
  }
  ```

### 2. POST `/api/chat-futureme`
Handles contextual follow-up questions from the user in an ongoing conversation.
- **Request Body**:
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      { "role": "user", "message": "Will I actually make it?" },
      { "role": "futureme", "message": "Only if your daily actions stop negotiating..." }
    ],
    "question": "What should I focus on this week?"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "reply": "..."
  }
  ```

---

## Key Custom Features Built for Demos

- **Adaptive Tone Behavior**: The prompt system directs Gemini to alter its personality dramatically based on the selected tone card (Motivational is inspiring; Brutally Honest is direct and strict; Calm Mentor is wise and grounded; CEO Mode is tactical and execution-driven).
- **Safety JSON Cleaner**: If the AI model accidentally surrounds its output in markdown backticks (e.g. \`\`\`json ... \`\`\`), the server automatically sanitizes the string before parsing, preventing runtime JSON errors.
- **Anti-Spam & Rate Limiting**: The generate and send buttons dynamically disable themselves and show elegant pulsing loading states during requests, preventing double clicks and connection drops.
- **Self-contained Premium SVG Icons**: Every card and action contains optimized, self-contained SVG paths inside the HTML code. This guarantees the UI loads correctly and looks crisp on retina displays even if the system is completely offline.

---
Created with ❤️ for Nitish’s Founder Labs.

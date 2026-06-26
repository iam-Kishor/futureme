const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files with cache control to prevent browser caching issues
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Verify API Key
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI features will fail until it is set.");
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Clean and parse JSON returned from Gemini (in case of markdown wrappers)
function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  
  // Remove markdown JSON code blocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Helper function to handle automatic model fallback on 503/429 errors
async function generateContentWithFallback(genAI, systemInstruction, userPrompt, generationConfig = {}) {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash", "gemini-flash-latest"];
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Attempting content generation with model: ${modelName}`);
      const config = {
        model: modelName,
        systemInstruction: systemInstruction
      };
      if (Object.keys(generationConfig).length > 0) {
        config.generationConfig = generationConfig;
      }
      
      const model = genAI.getGenerativeModel(config);
      const result = await model.generateContent(userPrompt);
      return result;
    } catch (err) {
      console.warn(`Model ${modelName} failed:`, err.message || err);
      lastError = err;
      // Continue to next model in the list
    }
  }

  // If all models failed, throw the last error
  throw lastError || new Error("All generative models failed to respond.");
}

/**
 * Route 1: Generate FutureMe reflection message and details
 * POST /api/generate-futureme
 */
app.post('/api/generate-NextSelf', async (req, res) => {
  try {
    const { name, age, goal, struggle, oneYearVision, tone } = req.body;

    // Basic Validation
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, age, goal, struggle, oneYearVision, tone) are required."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Gemini API Key is not configured on the server. Please set GEMINI_API_KEY in your .env file."
      });
    }

    // Tone definitions for system context behavior
    let toneDescription = "";
    switch(tone) {
      case 'Motivational':
        toneDescription = "warm, inspiring, supportive, encouraging, and highly empowering.";
        break;
      case 'Brutally Honest':
        toneDescription = "direct, sharp, uncompromising, realistic, and with absolutely no excuses.";
        break;
      case 'Calm Mentor':
        toneDescription = "peaceful, wise, grounded, patient, philosophical, and deeply reflecting.";
        break;
      case 'CEO Mode':
        toneDescription = "strategic, focused, high-execution, metric-oriented, and hyper-logical.";
        break;
      default:
        toneDescription = "balanced, wise, and personal.";
    }

    // System instruction prompt (static and secure from prompt injection)
    const systemInstruction = `You are NextSelf, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific, deeply personalized to the user's struggle and goal. Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

    const userPrompt = `Tone selected by user: ${tone} (${toneDescription})

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}`;

    const result = await generateContentWithFallback(
      genAI,
      systemInstruction,
      userPrompt,
      { responseMimeType: "application/json" }
    );
    const responseText = result.response.text();
    
    let parsedData;
    try {
      parsedData = cleanAndParseJSON(responseText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON output. Raw output was:", responseText);
      throw new Error("Invalid format returned by AI. Please try again.");
    }

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("Error in /api/generate-futureme:", error);
    res.status(500).json({
      success: false,
      error: error.message || "FutureMe could not respond right now. Try again."
    });
  }
});

/**
 * Route 2: Chat with FutureMe (Follow-up)
 * POST /api/chat-futureme
 */
app.post('/api/chat-NextSelf', async (req, res) => {
  try {
    const { userProfile, chatHistory, question } = req.body;

    // Validation
    if (!userProfile || !question) {
      return res.status(400).json({
        success: false,
        error: "Missing user profile or follow-up question."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Gemini API Key is not configured on the server."
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;

    let toneDescription = "";
    switch(tone) {
      case 'Motivational':
        toneDescription = "warm, inspiring, supportive, encouraging, and highly empowering.";
        break;
      case 'Brutally Honest':
        toneDescription = "direct, sharp, uncompromising, realistic, and with absolutely no excuses.";
        break;
      case 'Calm Mentor':
        toneDescription = "peaceful, wise, grounded, patient, philosophical, and deeply reflecting.";
        break;
      case 'CEO Mode':
        toneDescription = "strategic, focused, high-execution, metric-oriented, and hyper-logical.";
        break;
      default:
        toneDescription = "balanced, wise, and personal.";
    }

    // Format previous conversation for Gemini
    let formattedHistory = "";
    if (chatHistory && chatHistory.length > 0) {
      formattedHistory = chatHistory.map(chat => {
        const sender = chat.role === 'user' ? name : 'NextSelf';
        return `${sender}: ${chat.message}`;
      }).join('\n');
    } else {
      formattedHistory = "(No previous conversation history)";
    }

    const systemInstruction = `You are NextSelf, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

Reply in 2-5 short paragraphs. Give at least one clear, actionable advice. Speak directly to them as their future self.`;

    const userPrompt = `User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone: ${tone} (${toneDescription})

Recent chat history:
${formattedHistory}

Current question:
${question}`;

    const result = await generateContentWithFallback(
      genAI,
      systemInstruction,
      userPrompt
    );
    const replyText = result.response.text().trim();

    res.json({
      success: true,
      reply: replyText
    });

  } catch (error) {
    console.error("Error in /api/chat-NextSelf:", error);
    res.status(500).json({
      success: false,
      error: error.message || "NextSelf could not respond right now. Try again."
    });
  }
});

// Fallback to index.html for single page app routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 FutureMe Backend Server running on Port ${PORT}`);
  console.log(`🔗 Local Access: http://localhost:${PORT}`);
  console.log(`==================================================`);
});

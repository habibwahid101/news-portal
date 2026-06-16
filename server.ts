import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// LAZY-INITIALIZATION OF GEMINI SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required server-side.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. HEALTH CHECK ENDPOINT
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. GEMINI AI: WRITER / TRANSLATOR / HELPER ENDPOINT
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { prompt, type } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const ai = getGeminiClient();
    let finalPrompt = prompt;

    if (type === "summarize") {
      finalPrompt = `Please write a highly professional, engaging first-paragraph excerpt in Bengali (সর্বোচ্চ ১৫-২০ শব্দ) for this news: "${prompt}"`;
    } else if (type === "tags") {
      finalPrompt = `Extract 3 to 5 key Bengali tags/keywords for this article, formatted as a JSON array of strings only. Article: "${prompt}"`;
    } else if (type === "rewrite") {
      finalPrompt = `Rewrite, proofread, and beautify the following Bengali text to make it read like an elite investigative journalist's Jatiya Saptahik column. Preserve the original narrative but increase the editorial tone: "${prompt}"`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: finalPrompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI API Error:", error.message || error);
    res.status(500).json({ error: error.message || "Failed to make AI call" });
  }
});

// VITE MIDDLEWARE CONFIGURATION FOR HOT DEV & BUILD COMPATIBILITY
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production assets from dist/ directory.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening on http://localhost:${PORT}`);
  });
}

startServer();
export default app;

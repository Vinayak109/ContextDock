import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import AdmZip from "adm-zip";
import Razorpay from "razorpay";
import crypto from "crypto";

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/extension.zip", (req, res) => {
    try {
      const zip = new AdmZip();
      
      const extensionPath = path.join(process.cwd(), "extension");
      zip.addLocalFolder(extensionPath);
      
      const zipBuffer = zip.toBuffer();
      
      res.set("Content-Disposition", 'attachment; filename="ContextDock Chrome Extension.zip"');
      res.set("Content-Type", "application/zip");
      res.send(zipBuffer);
    } catch (error) {
      console.error("Error creating zip:", error);
      res.status(500).send("Failed to generate extension zip");
    }
  });

  app.post("/api/analyze-workspaces", async (req, res) => {
    try {
      const { workspaces } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `
You are ContextDock's AI Assistant. The user works across many browser tabs and projects.
Here is the user's current list of saved workspaces:
${JSON.stringify(workspaces, null, 2)}

Analyze these workspaces. Identify overarching themes, potential duplicate tasks, and suggest which dormant workspaces should be archived or merged. Also, suggest what the user should prioritize today based on their active purposes. Keep your answer conversational, helpful, and concise (under 150 words). Focus on applying "judgment" to help reduce mental clutter.
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          },
        });
        res.json({ result: response.text });
      } catch (aiError: any) {
        console.error("Primary AI Error:", aiError.message);
        // Fallback to gemini-2.5-flash if 3.1-pro is quota exceeded or unavailable
        console.log("Falling back to gemini-2.5-flash...");
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        res.json({ result: fallbackResponse.text });
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      const message = error?.message || "An unknown error occurred.";
      if (message.includes("429") || message.includes("Quota exceeded")) {
        res.status(429).json({ error: "The AI analyst is currently experiencing high demand. Please try again in a minute." });
      } else {
        res.status(500).json({ error: "Failed to analyze workspaces. Please try again later." });
      }
    }
  });

  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      if (!amount || amount < 100) {
        return res.status(400).json({ error: "Amount must be at least 100 paise" });
      }

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ error: "Razorpay credentials not configured" });
      }

      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      };

      const order = await instance.orders.create(options);
      res.json({ 
        order_id: order.id, 
        amount: order.amount, 
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } catch (error: any) {
      console.error("Razorpay Create Order Error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/verify-payment", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment fields" });
      }

      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_secret) {
        return res.status(500).json({ error: "Razorpay credentials not configured" });
      }

      const generated_signature = crypto
        .createHmac("sha256", key_secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        // Payment is verified
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ error: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Razorpay Verify Error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

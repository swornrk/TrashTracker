import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectWasteBody, DetectWasteResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const detectionPrompt = `You are a waste-sorting assistant for Kathmandu Valley, Nepal.
Look closely at the uploaded image and classify the primary waste item.
Return only a JSON object with exactly these keys:
{
  "detectedItem": "specific item name",
  "category": "Organic" | "Recyclable" | "Hazardous",
  "confidencePercent": number from 0 to 100,
  "marketValueNpr": "NPR range per kg, or NPR 0/kg when it has no normal resale value",
  "segregationAdvice": "short, practical advice for sorting, preparing, and disposing of this item in Kathmandu"
}
Use realistic local market-value ranges in Nepalese rupees. If the image is unclear, identify the safest likely category and lower the confidence. Never include markdown, code fences, or extra keys.`;

router.post("/waste-detection", async (req, res) => {
  const parsedBody = DetectWasteBody.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({ error: "Please provide a valid waste image." });
    return;
  }

  const { imageBase64, mimeType } = parsedBody.data;
  if (!mimeType.toLowerCase().startsWith("image/")) {
    res.status(400).json({ error: "Only image uploads are supported." });
    return;
  }

  if (imageBase64.length > 9_000_000) {
    res.status(413).json({ error: "Please upload an image smaller than 7 MB." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not configured");
    res.status(503).json({ error: "The AI scanner is not configured yet." });
    return;
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const response = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      detectionPrompt,
    ]);

    const rawText = response.response.text().trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const result = DetectWasteResponse.parse(JSON.parse(cleanJson));

    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Gemini waste detection failed");
    const providerStatus =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : null;

    if (providerStatus === 403) {
      res.status(502).json({
        error:
          "Gemini denied access for this project. Enable the Gemini API for the project that owns GEMINI_API_KEY, or replace the secret with a permitted project key.",
      });
      return;
    }

    res.status(502).json({
      error: "Gemini could not analyze this image. Please try a clearer photo.",
    });
  }
});

export default router;
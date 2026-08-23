require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { extractLessonInfo, generateWorksheets } = require("./src/services/gemini");

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.post("/api/extract", async (req, res) => {
  try {
    let { imageBase64, imageMimeType = "image/jpeg", audioBase64, audioMimeType = "audio/mp4" } = req.body;

    if (!imageBase64 && !audioBase64) {
      return res.status(400).json({ error: "Either image or audio data is required." });
    }

    // Robustly strip any data URI prefix for image
    if (imageBase64 && imageBase64.includes("base64,")) {
      imageBase64 = imageBase64.split("base64,")[1];
    }
    
    // Robustly strip any data URI prefix for audio
    if (audioBase64 && audioBase64.includes("base64,")) {
      audioBase64 = audioBase64.split("base64,")[1];
    }

    console.log(`Extracting lesson info from ${audioBase64 ? 'audio' : 'image'}...`);
    let lessonInfo;
    try {
      lessonInfo = await extractLessonInfo(imageBase64, imageMimeType, audioBase64, audioMimeType);
    } catch (err) {
      console.error("Extraction error:", err);
      return res.status(500).json({ error: `Extraction error: ${err.message}` });
    }

    // Validate extraction results
    if (
      !lessonInfo ||
      !lessonInfo.subject ||
      !lessonInfo.topic ||
      lessonInfo.topic.toLowerCase() === "unknown" ||
      !lessonInfo.key_concepts ||
      lessonInfo.key_concepts.length === 0
    ) {
      return res.status(422).json({
        error: "Could not clearly identify the subject or concepts from the image. Please try a clearer photo.",
      });
    }

    console.log("Extraction successful:", lessonInfo.subject, "-", lessonInfo.topic);
    res.json({ lessonInfo });
  } catch (error) {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "An unexpected error occurred during extraction." });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const { lessonInfo, language = "English" } = req.body;

    if (!lessonInfo || !lessonInfo.subject) {
      return res.status(400).json({ error: "Lesson info is required." });
    }

    console.log(`Generating worksheets in ${language} for ${lessonInfo.subject}...`);
    let worksheetsData;
    try {
      worksheetsData = await generateWorksheets(lessonInfo, language);
    } catch (err) {
      console.error("Generation error:", err);
      return res.status(500).json({ error: `Generation error: ${err.message}` });
    }

    if (!worksheetsData || !worksheetsData.worksheets) {
      return res.status(500).json({ error: "Generated worksheets were invalid." });
    }

    console.log("Worksheets generated successfully.");
    res.json({ worksheets: worksheetsData.worksheets });
  } catch (error) {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "An unexpected error occurred during generation." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

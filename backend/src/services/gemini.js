const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

async function extractLessonInfo(base64Image, imageMimeType, base64Audio, audioMimeType) {
  const prompt = "You are an expert teaching assistant. Analyze the provided classroom lesson input (either an image of a board, or an audio recording of the teacher). First, identify the academic subject and the language the lesson is taught in. Then, extract the main topic, key concepts being taught, and any important examples. Keep the descriptions concise.";
  
  const schema = {
    type: "object",
    properties: {
      subject: { type: "string", description: "The detected academic subject." },
      source_language: { type: "string", description: "The language the lesson is taught in." },
      topic: { type: "string", description: "The main topic of the lesson." },
      key_concepts: { type: "array", items: { type: "string" }, description: "List of core concepts taught in the lesson." },
      example_problems: { type: "array", items: { type: "string" }, description: "List of any examples, problems, diagrams, or observations." }
    },
    required: ["subject", "topic", "key_concepts", "example_problems"]
  };

  const parts = [{ text: prompt }];

  if (base64Image) {
    parts.unshift({
      inlineData: {
        data: base64Image,
        mimeType: imageMimeType || "image/jpeg"
      }
    });
  }

  if (base64Audio) {
    parts.unshift({
      inlineData: {
        data: base64Audio,
        mimeType: audioMimeType || "audio/mp4" // Expo AV usually records m4a/mp4 on iOS/Android
      }
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts: parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const responseText = result.response.text();
  return JSON.parse(responseText);
}

async function generateWorksheets(lessonInfo, language = "English") {
  const prompt = `You are an expert curriculum designer for a single-teacher, multigrade classroom. Based on the following ${lessonInfo.subject} lesson information, create 3 differentiated practice worksheets.

Subject: ${lessonInfo.subject}
Topic: ${lessonInfo.topic}
Key Concepts: ${JSON.stringify(lessonInfo.key_concepts)}
Lesson Content: ${JSON.stringify(lessonInfo.example_problems)}

Language Requirement: You MUST generate the worksheet content entirely in ${language}.

Requirements for the 3 worksheets:
1. Early Primary (Grades 1-2): Simple problems, matching, or fill-in-the-blank.
2. Mid Primary (Grades 3-4): Short, direct practice questions of moderate difficulty. Adapt the question style to the subject (e.g., equations for Math, definitions for Science, short answers for History).
3. Late Primary (Grade 5): More advanced practice. Require students to explain their reasoning or apply the concepts practically based on the subject.

Format the content clearly using plain text or simple markdown formatting within the JSON fields.`;

  const schema = {
    type: "object",
    properties: {
      worksheets: {
        type: "array",
        description: "An array containing exactly 3 worksheets.",
        items: {
          type: "object",
          properties: {
            grade_level: {
              type: "string",
              enum: ["Grades 1-2", "Grades 3-4", "Grade 5"]
            },
            content: {
              type: "string",
              description: `The actual text content of the worksheet, including instructions and problems, in ${language}.`
            }
          },
          required: ["grade_level", "content"]
        }
      }
    },
    required: ["worksheets"]
  };

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const responseText = result.response.text();
  return JSON.parse(responseText);
}

module.exports = {
  extractLessonInfo,
  generateWorksheets
};

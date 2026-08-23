const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

async function run() {
  const schema = {
    type: "object",
    properties: {
      worksheets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            grade_level: {
              type: "string",
              enum: ["Grades 1-2", "Grades 3-4", "Grade 5"]
            },
            content: {
              type: "string",
            }
          },
          required: ["grade_level", "content"]
        }
      }
    },
    required: ["worksheets"]
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Make worksheets for math." }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    console.log(result.response.text());
  } catch(e) {
    console.error("Test failed:", e.message);
  }
}
run();

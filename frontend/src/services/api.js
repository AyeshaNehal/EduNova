// If testing on a physical Android device, replace localhost with your computer's local IP address (e.g., 192.168.x.x)
// If testing on Android emulator, use 10.0.2.2 instead of localhost.
const BASE_URL = "http://localhost:3000";

export const extractLesson = async (base64Image, base64Audio) => {
  try {
    const payload = {};
    if (base64Image) payload.imageBase64 = base64Image;
    if (base64Audio) payload.audioBase64 = base64Audio;

    const response = await fetch(`${BASE_URL}/api/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      let errMsg = data.error || "Something went wrong during extraction.";
      if (typeof errMsg === 'string' && (errMsg.includes("429") || errMsg.includes("Quota exceeded"))) {
        errMsg = "Whoops! The AI service is currently processing too many requests. Please wait a minute and try again.";
      }
      throw new Error(errMsg);
    }

    return data.lessonInfo;
  } catch (error) {
    console.error("Extraction API Error:", error);
    throw error;
  }
};

export const generateWorksheetsFromInfo = async (lessonInfo, language = "English") => {
  try {
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lessonInfo, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errMsg = data.error || "Something went wrong during generation.";
      if (typeof errMsg === 'string' && (errMsg.includes("429") || errMsg.includes("Quota exceeded"))) {
        errMsg = "Whoops! The AI service is currently processing too many requests. Please wait a minute and try again.";
      }
      throw new Error(errMsg);
    }

    return data.worksheets;
  } catch (error) {
    console.error("Generation API Error:", error);
    throw error;
  }
};

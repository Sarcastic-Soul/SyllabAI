"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function askStudyBuddy(
  question: string,
  courseTopic: string,
  courseStructure: string,
) {
  try {
    const prompt = `
            You are "Study Buddy", a friendly, encouraging AI voice tutor helping a student learn about ${courseTopic}.
            You act as their ultimate "Doubt Clearer".

            Here is the structure of the course they are taking:
            ${courseStructure}

            Student asks: "${question}"

            Reply directly to the student. Keep your answers brief, highly conversational, and easy to understand when spoken out loud.
            DO NOT use Markdown formatting (like **, *, #) because your text will be read directly by a Text-to-Speech engine.
        `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error asking study buddy:", error);
    throw new Error("Failed to get response");
  }
}

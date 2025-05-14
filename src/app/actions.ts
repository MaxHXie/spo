"use server";

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generate(userMessage: string, systemPrompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function improveSystemPrompt(
  userMessage: string,
  systemPrompt: string,
  output: string,
  feedback: string
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const promptForImprovement = `
You are an expert in designing effective system prompts for LLMs. You will analyze the following interaction and suggest an improved system prompt.

ORIGINAL USER MESSAGE:
"""
${userMessage}
"""

ORIGINAL SYSTEM PROMPT:
"""
${systemPrompt}
"""

ORIGINAL OUTPUT:
"""
${output}
"""

USER FEEDBACK ON WHY THIS OUTPUT IS NOT SATISFACTORY:
"""
${feedback}
"""

Based on the user's feedback, please provide an improved system prompt that would generate a better response to the original user message. 
Return ONLY the improved system prompt text, without any explanations, additional context, or quotation marks.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: promptForImprovement,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || systemPrompt;
  } catch (error) {
    console.error("Error calling OpenAI for prompt improvement:", error);
    throw new Error(
      `Failed to improve prompt: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

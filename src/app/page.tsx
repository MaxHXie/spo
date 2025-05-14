"use client";

import { useState, useEffect, useRef } from "react";
import { generate, improveSystemPrompt } from "./actions";

export default function Home() {
  const [userMessage, setUserMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant..."
  );
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const userMessageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the textarea when the component mounts
    if (userMessageRef.current) {
      userMessageRef.current.focus();
    }
  }, []);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(300, textarea.scrollHeight)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new line
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isProcessing &&
      !isImprovingPrompt &&
      userMessage.trim()
    ) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!userMessage.trim()) return;

    setIsProcessing(true);
    setOutput("");
    setError("");
    setFeedback(null);

    try {
      const result = await generate(userMessage, systemPrompt);
      setOutput(result);
    } catch (err) {
      console.error("Error generating response:", err);
      setError(
        `Failed to generate response: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsProcessing(false);
      // Focus back on the textarea after processing
      if (userMessageRef.current) {
        userMessageRef.current.focus();
      }
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    if (type === "down") {
      setShowFeedbackDialog(true);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      setShowFeedbackDialog(false);
      return;
    }

    setShowFeedbackDialog(false);
    setIsImprovingPrompt(true);

    try {
      // Call the server action to improve the system prompt
      const improvedPrompt = await improveSystemPrompt(
        userMessage,
        systemPrompt,
        output,
        feedbackText
      );

      // Update the system prompt with the improved version
      setSystemPrompt(improvedPrompt);
    } catch (err) {
      console.error("Error improving prompt:", err);
      // Optionally show an error notification here
    } finally {
      setIsImprovingPrompt(false);
      setFeedbackText("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <main className="max-w-4xl mx-auto space-y-8 pt-10">
        {/* User Message Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <label
            htmlFor="userMessage"
            className="block text-lg font-medium mb-2"
          >
            User Message
          </label>
          <div className="flex gap-3">
            <textarea
              id="userMessage"
              value={userMessage}
              onChange={(e) => {
                setUserMessage(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              placeholder="Enter your message here..."
              rows={2}
              className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 resize-y min-h-[80px]"
              ref={userMessageRef}
              onKeyDown={handleKeyDown}
            ></textarea>
            <button
              onClick={handleSubmit}
              disabled={
                isProcessing || !userMessage.trim() || isImprovingPrompt
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit self-start"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Flow Connection - Top */}
        <div className="relative h-12 flex justify-center">
          <div className="absolute w-0.5 h-full bg-gray-300 dark:bg-gray-600"></div>
          <div
            className={`absolute top-1/2 w-3 h-3 rounded-full transform -translate-y-1/2 transition-colors ${
              isProcessing ? "bg-blue-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
        </div>

        {/* System Prompt Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="systemPrompt" className="block text-lg font-medium">
              System Prompt
            </label>
            {isImprovingPrompt && (
              <div className="text-sm text-blue-500 flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Improving prompt...
              </div>
            )}
          </div>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            disabled={isImprovingPrompt}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 ${
              isImprovingPrompt ? "opacity-70" : ""
            }`}
          ></textarea>
        </div>

        {/* Flow Connection - Bottom */}
        <div className="relative h-12 flex justify-center">
          <div className="absolute w-0.5 h-full bg-gray-300 dark:bg-gray-600"></div>
          <div
            className={`absolute top-1/2 w-3 h-3 rounded-full transform -translate-y-1/2 transition-colors ${
              isProcessing ? "bg-blue-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
        </div>

        {/* Output Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium">Output</h2>
              {output && !isProcessing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback("up")}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Good response"
                    aria-label="Thumbs up"
                    disabled={isImprovingPrompt}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill={feedback === "up" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`${
                        feedback === "up" ? "text-green-500" : "text-gray-500"
                      }`}
                    >
                      <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleFeedback("down")}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Bad response"
                    aria-label="Thumbs down"
                    disabled={isImprovingPrompt}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill={feedback === "down" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`${
                        feedback === "down" ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {isProcessing && (
              <div className="text-sm text-blue-500 flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </div>
            )}
          </div>
          <div
            className={`w-full min-h-[150px] p-4 bg-gray-50 dark:bg-gray-700 rounded-md font-mono text-sm overflow-auto ${
              output || error
                ? "border border-gray-200 dark:border-gray-600"
                : ""
            }`}
          >
            {error ? (
              <pre className="whitespace-pre-wrap text-red-500">{error}</pre>
            ) : output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <p className="text-gray-400 dark:text-gray-500">
                The LLM output will appear here after you submit a message...
              </p>
            )}
          </div>
        </div>

        {/* Feedback Dialog */}
        {showFeedbackDialog && (
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full m-4">
              <h3 className="text-lg font-semibold mb-4">
                What was wrong with the response?
              </h3>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Please tell us why the response wasn't helpful..."
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 min-h-[120px] mb-4"
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFeedbackDialog(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={!feedbackText.trim()}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

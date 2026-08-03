"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Bot,
  VolumeX,
  ArrowLeft,
  MousePointer2,
  Hand,
  Trash2,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { askStudyBuddy, getConversationHistory, clearConversationHistory } from "@/lib/actions/studybuddy.actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StudyBuddyProps {
  courseTopic: string;
  courseStructure: string;
  courseId: string;
}

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

export default function StudyBuddyInteractive({
  courseId,
  courseTopic,
  courseStructure,
}: StudyBuddyProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Interaction and Data State
  const [interactionMode, setInteractionMode] = useState<"toggle" | "ptt">(
    "ptt",
  );
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi there! I'm your Study Buddy. Hold the Spacebar or the microphone button and ask me anything about this course.",
    },
  ]);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const recognitionRef = useRef<any>(null);
  const isHoldingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FIX: Storing utterances here prevents the Chrome Garbage Collection bug from randomly stopping audio!
  const currentUtterances = useRef<SpeechSynthesisUtterance[]>([]);

  // Load Conversation History
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getConversationHistory(courseId);
        if (history && history.length > 0) {
          setConversation(
            history.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "ai",
              text: msg.content,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
      }
    };
    loadHistory();
  }, [courseId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, transcript, isProcessing]);

  // Initialize Speech APIs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition || !window.speechSynthesis) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // Bind native hardware state to our React state
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        // FIX: Ignore expected STT statuses to stop Next.js overlay crashes
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech Recognition Warning:", event.error);
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  const handleClearHistory = async () => {
    try {
      await clearConversationHistory(courseId);
      setConversation([
        {
          id: "welcome",
          role: "ai",
          text: "Hi there! I'm your Study Buddy. Hold the Spacebar or the microphone button and ask me anything about this course.",
        },
      ]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // --- Core Actions ---
  const startListening = () => {
    if (isListening || isProcessing) return;

    // Stop any current audio immediately
    stopAudio();

    setTranscript("");

    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      // FIX: Silently ignore InvalidStateError if it starts too fast
      setIsListening(true);
    }
  };

  const stopAndSend = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // Silently catch native stop errors
    }

    setIsListening(false);

    if (transcript.trim().length > 0) {
      handleAskBuddy(transcript.trim());
    }
  };

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtterances.current = []; // Clear the reference array
      setIsSpeaking(false);
    }
  };

  const handleAskBuddy = async (question: string) => {
    setIsProcessing(true);
    setTranscript(""); // Clear live transcript from screen

    // Append User Message
    setConversation((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: question },
    ]);

    try {
      const answer = await askStudyBuddy(
        question,
        courseTopic,
        courseStructure,
        courseId,
      );

      // Append AI Message
      const aiResponseText = typeof answer === "string" ? answer : answer.answer;
      setConversation((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", text: aiResponseText },
      ]);
      speakResponse(aiResponseText);
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "Sorry, I had trouble processing that. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return;

    // Clear any audio that might be hanging
    window.speechSynthesis.cancel();
    currentUtterances.current = []; // Clear old references

    // Delay slightly to bypass the Safari/Chrome race condition bug
    setTimeout(() => {
      // Break the long response into smaller sentences to stop the engine from choking
      const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];

      chunks.forEach((chunk, index) => {
        if (!chunk.trim()) return;

        const utterance = new SpeechSynthesisUtterance(chunk.trim());

        // Save utterance to our ref so Chrome's Garbage Collector doesn't delete it
        currentUtterances.current.push(utterance);

        utterance.lang = "en-US";

        // Fallback robust voice selection
        const preferredVoice =
          availableVoices.find(
            (v) =>
              v.lang.includes("en") &&
              (v.name.includes("Google") || v.name.includes("Natural")),
          ) ||
          availableVoices.find((v) => v.lang.includes("en")) ||
          availableVoices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;

        // Manage animation state for the first chunk
        if (index === 0) {
          utterance.onstart = () => setIsSpeaking(true);
        }

        // Catch the 'end' event on the final chunk
        if (index === chunks.length - 1) {
          utterance.onend = () => setIsSpeaking(false);
        }

        // FIX: Supress "interrupted" or "canceled" errors. These happen gracefully when the user hits 'Stop'.
        // Changing console.error to console.warn completely stops Next.js from throwing dev crashes.
        utterance.onerror = (e) => {
          if (e.error !== "interrupted" && e.error !== "canceled") {
            console.warn("TTS Hardware Warning:", e.error);
          }
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      });
    }, 50);
  };

  // --- Interaction Handlers ---

  // 1. Keyboard Spacebar (Push to Talk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        interactionMode === "ptt" &&
        !e.repeat &&
        e.target === document.body
      ) {
        e.preventDefault();
        isHoldingRef.current = true;
        startListening();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && interactionMode === "ptt") {
        e.preventDefault();
        isHoldingRef.current = false;
        stopAndSend();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [interactionMode, isListening, transcript, isProcessing]);

  // 2. Mouse/Touch Button Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (interactionMode === "ptt") {
      isHoldingRef.current = true;
      startListening();
    } else {
      if (isListening) stopAndSend();
      else startListening();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (interactionMode === "ptt" && isHoldingRef.current) {
      isHoldingRef.current = false;
      stopAndSend();
    }
  };

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 border-2 border-destructive/20 rounded-2xl bg-destructive/5 text-center space-y-4">
        <h3 className="text-2xl font-bold">Voice Features Unavailable</h3>
        <p className="text-muted-foreground">
          Your browser does not support the Web Speech API. Please use Google
          Chrome or Microsoft Edge.
        </p>
        <Link href={`/courses/${courseId}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 h-[90vh] flex flex-col">
      {/* Top Navigation & Settings (Fixed Header) */}
      <div className="flex items-center justify-between pb-4 border-b shrink-0">
        <Link href={`/courses/${courseId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />{" "}
            <span className="hidden sm:inline">Back to Course</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {/* Clear History Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Clear Conversation History"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Mode Toggle Switch */}
          <div className="flex items-center bg-secondary/50 p-1 rounded-lg">
            <button
              onClick={() => setInteractionMode("ptt")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
              interactionMode === "ptt"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Hand className="w-3.5 h-3.5" /> Hold to Talk
          </button>
          <button
            onClick={() => setInteractionMode("toggle")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
              interactionMode === "toggle"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MousePointer2 className="w-3.5 h-3.5" /> Tap to Talk
          </button>
        </div>
        </div>
      </div>

      {/* Avatar Area (Fixed Header) */}
      <div className="flex items-center justify-center py-6 shrink-0">
        <div className="relative flex items-center justify-center">
          {isSpeaking && (
            <>
              <div className="absolute w-28 h-28 bg-orange-500/20 rounded-full animate-ping" />
              <div className="absolute w-24 h-24 bg-orange-500/30 rounded-full animate-pulse" />
            </>
          )}
          {isListening && (
            <div className="absolute w-24 h-24 bg-orange-500/20 rounded-full animate-pulse" />
          )}
          <div
            className={cn(
              "relative z-10 p-4 rounded-full transition-all duration-500 shadow-lg",
              isSpeaking
                ? "bg-orange-500 shadow-orange-500/50 scale-110"
                : isListening
                  ? "bg-orange-500 shadow-orange-500/50 scale-105"
                  : "bg-secondary",
            )}
          >
            <Bot
              className={cn(
                "w-10 h-10",
                isSpeaking || isListening
                  ? "text-white"
                  : "text-muted-foreground",
              )}
            />
          </div>
        </div>
      </div>

      {/* Chat History Area (Scrollable Middle) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 mb-4 scrollbar-thin">
        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
            )}
          >
            <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
              {msg.role === "user" ? "You" : "Study Buddy"}
            </span>
            <div
              className={cn(
                "px-4 py-3 rounded-2xl text-sm md:text-base shadow-sm",
                msg.role === "user"
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-br-none"
                  : "bg-secondary text-foreground rounded-bl-none",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Live Transcript Bubble */}
        {isListening && transcript && (
          <div className="flex flex-col max-w-[85%] ml-auto items-end opacity-70">
            <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
              You
            </span>
            <div className="px-4 py-3 rounded-2xl text-sm md:text-base bg-orange-500/10 text-orange-600 border border-orange-500/20 border-dashed rounded-br-none shadow-sm">
              {transcript} <span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        {/* Loading Bubble */}
        {isProcessing && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
              Study Buddy
            </span>
            <div className="px-4 py-3 rounded-2xl bg-secondary text-muted-foreground flex items-center gap-2 rounded-bl-none shadow-sm">
              <Spinner className="w-4 h-4" /> Thinking...
            </div>
          </div>
        )}

        {/* Invisible div to scroll to bottom automatically */}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls Area (Fixed at Bottom) */}
      <div className="shrink-0 flex flex-col items-center justify-center pt-2 border-t">
        <p className="text-xs text-muted-foreground font-medium mb-3">
          {interactionMode === "ptt"
            ? "Hold space or button to Speak"
            : "Tap button to Start/Stop"}
        </p>

        <div className="flex items-center gap-4 relative w-full justify-center">
          <Button
            size="lg"
            variant={isListening ? "default" : "secondary"}
            className={cn(
              "w-20 h-20 rounded-full shadow-lg transition-all select-none touch-none",
              isListening
                ? "bg-orange-500 hover:bg-orange-600 animate-pulse shadow-orange-500/40 text-white"
                : "hover:scale-105",
            )}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp} // Safety net if they drag off the button
            disabled={isProcessing}
          >
            <Mic className="w-8 h-8" />
          </Button>

          {isSpeaking && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 w-10 h-10 rounded-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={stopAudio}
              title="Stop Speaking"
            >
              <VolumeX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

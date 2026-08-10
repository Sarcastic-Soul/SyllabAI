"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  Bot,
  VolumeX,
  Volume2,
  ArrowLeft,
  Trash2,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  askStudyBuddy,
  getConversationHistory,
  clearConversationHistory,
} from "@/lib/actions/studybuddy.actions";
import Link from "next/link";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

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
  const [isSttSupported, setIsSttSupported] = useState(false);
  const [isTtsSupported, setIsTtsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [conversation, setConversation] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi there! I'm your Study Buddy. Ask me anything about this course.",
    },
  ]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
            }))
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
  }, [conversation, isProcessing, isListening]);

  // Initialize & Detect Speech Capabilities
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. STT Detection
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            setIsListening(true);
            setSpeechError(null);
          };

          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            setInputValue(currentTranscript);
          };

          recognition.onerror = (event: any) => {
            setIsListening(false);
            if (event.error === "network") {
              setSpeechError("Voice recognition network error. You can type your message below.");
            } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              setSpeechError("Microphone access denied or unsupported.");
            } else if (event.error !== "no-speech" && event.error !== "aborted") {
              setSpeechError(`Voice error: ${event.error}`);
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
          setIsSttSupported(true);
        } catch (e) {
          setIsSttSupported(false);
        }
      } else {
        setIsSttSupported(false);
      }

      // 2. TTS Detection
      if (window.speechSynthesis) {
        const updateVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
          setIsTtsSupported(voices.length > 0);
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
      } else {
        setIsTtsSupported(false);
      }
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
    };
  }, []);

  const handleClearHistory = async () => {
    try {
      await clearConversationHistory(courseId);
      stopAudio();
      setConversation([
        {
          id: "welcome",
          role: "ai",
          text: "Hi there! I'm your Study Buddy. Ask me anything about this course.",
        },
      ]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const toggleListening = () => {
    if (!isSttSupported) return;
    setSpeechError(null);
    stopAudio();

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setIsListening(true);
      }
    }
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtterances.current = [];
      setSpeakingMessageId(null);
    }
  };

  const stripMarkdownAndEmojis = (rawText: string): string => {
    return rawText
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_~#>-]/g, " ")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const speakMessage = (messageId: string, text: string) => {
    if (!isTtsSupported || typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMessageId === messageId) {
      stopAudio();
      return;
    }

    stopAudio();

    const cleanText = stripMarkdownAndEmojis(text);
    if (!cleanText) return;

    setTimeout(() => {
      const chunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
      setSpeakingMessageId(messageId);

      chunks.forEach((chunk, index) => {
        const trimmedChunk = chunk.trim();
        if (!trimmedChunk) return;

        const utterance = new SpeechSynthesisUtterance(trimmedChunk);
        currentUtterances.current.push(utterance);
        utterance.lang = "en-US";

        const voices = availableVoices.length > 0
          ? availableVoices
          : window.speechSynthesis.getVoices();

        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.includes("en") &&
              (v.name.includes("Google") || v.name.includes("Natural"))
          ) ||
          voices.find((v) => v.lang.includes("en")) ||
          voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.0;

        if (index === chunks.length - 1) {
          utterance.onend = () => setSpeakingMessageId(null);
        }

        utterance.onerror = (e) => {
          if (
            e.error !== "interrupted" &&
            e.error !== "canceled" &&
            e.error !== "synthesis-failed" &&
            e.error !== "synthesis-unavailable"
          ) {
            console.warn("TTS Hardware Warning:", e.error);
          }
          setSpeakingMessageId(null);
        };

        window.speechSynthesis.speak(utterance);
      });
    }, 50);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const messageText = inputValue.trim();
    if (!messageText || isProcessing) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    }

    setInputValue("");
    setSpeechError(null);
    setIsProcessing(true);
    stopAudio();

    const userMsgId = Date.now().toString();
    setConversation((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: messageText },
    ]);

    try {
      const answer = await askStudyBuddy(
        messageText,
        courseTopic,
        courseStructure,
        courseId
      );

      const aiResponseText = typeof answer === "string" ? answer : answer.answer;
      const aiMsgId = (Date.now() + 1).toString();

      setConversation((prev) => [
        ...prev,
        { id: aiMsgId, role: "ai", text: aiResponseText },
      ]);

      if (isTtsSupported) {
        speakMessage(aiMsgId, aiResponseText);
      }
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "Sorry, I ran into an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 h-[90vh] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b shrink-0">
        <Link href={`/courses/${courseId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Course</span>
          </Button>
        </Link>

        {/* Center: Bot Avatar Status Icon */}
        <div className="relative flex items-center justify-center">
          {speakingMessageId && (
            <div className="absolute w-9 h-9 bg-orange-500/30 rounded-full animate-ping" />
          )}
          {isListening && (
            <div className="absolute w-9 h-9 bg-destructive/30 rounded-full animate-pulse" />
          )}
          <div
            className={cn(
              "relative z-10 p-2 rounded-full transition-all duration-300 shadow-sm",
              speakingMessageId
                ? "bg-orange-500 text-white shadow-orange-500/50"
                : isListening
                ? "bg-destructive text-white shadow-destructive/50"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Bot className="w-5 h-5" />
          </div>
        </div>

        {/* Right: Study Buddy AI Pill & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Study Buddy AI
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Clear Conversation History"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>




      {/* Scrollable Message Container */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 mb-4 scrollbar-thin">
        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-muted-foreground">
                {msg.role === "user" ? "You" : "Study Buddy"}
              </span>

              {/* Render Read Aloud button ONLY if TTS is supported on the client */}
              {msg.role === "ai" && isTtsSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => speakMessage(msg.id, msg.text)}
                  title={
                    speakingMessageId === msg.id ? "Stop Reading" : "Read Aloud"
                  }
                >
                  {speakingMessageId === msg.id ? (
                    <VolumeX className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
            </div>

            <div
              className={cn(
                "px-4 py-3 rounded-2xl text-sm md:text-base shadow-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-orange-500 text-white rounded-br-none"
                  : "bg-secondary text-foreground rounded-bl-none border border-border/50"
              )}
            >
              {msg.role === "ai" ? (
                <MarkdownRenderer content={msg.text} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isProcessing && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
              Study Buddy
            </span>
            <div className="px-4 py-3 rounded-2xl bg-secondary text-muted-foreground flex items-center gap-2 rounded-bl-none shadow-sm border border-border/50">
              <Spinner className="w-4 h-4" /> Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Speech Error Alert Banner */}
      {speechError && (
        <div className="mb-2 p-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-xs hover:underline font-semibold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Input Controls (Fixed at Bottom) */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 flex items-center gap-2 pt-2 border-t"
      >
        <div className="relative flex-1 flex items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isListening
                ? "Listening... Speak now"
                : "Ask your Study Buddy anything..."
            }
            disabled={isProcessing}
            className={cn(
              "py-6 text-sm md:text-base rounded-xl transition-all",
              isSttSupported ? "pr-10" : "px-4",
              isListening && "border-destructive ring-1 ring-destructive/50"
            )}
          />

          {/* Render Mic Button ONLY if STT is supported on the client */}
          {isSttSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isProcessing}
              className={cn(
                "absolute right-2 h-8 w-8 rounded-lg transition-colors",
                isListening
                  ? "bg-destructive text-white hover:bg-destructive/90 animate-pulse"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title={isListening ? "Stop listening" : "Speak your message"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        <Button
          type="submit"
          disabled={!inputValue.trim() || isProcessing}
          className="h-12 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shrink-0 shadow-md transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <Spinner className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </div>
  );
}

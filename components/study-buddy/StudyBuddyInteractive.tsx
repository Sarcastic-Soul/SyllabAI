"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Microphone,
  MicrophoneSlash,
  SpeakerHigh,
  SpeakerSlash,
  ArrowLeft,
  Trash,
  PaperPlaneRight,
  WarningCircle,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
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

// Small local types for the Web Speech API (not in every TypeScript DOM lib).
interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

// Browser feature detection, read through useSyncExternalStore so the server
// render and the first client render agree.
const subscribeNever = () => () => {};
const getFalse = () => false;

let sttSupportedCache: boolean | undefined;
function getSttSupported(): boolean {
  if (sttSupportedCache === undefined) {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      sttSupportedCache = false;
    } else {
      try {
        new SpeechRecognition();
        sttSupportedCache = true;
      } catch {
        sttSupportedCache = false;
      }
    }
  }
  return sttSupportedCache;
}

const NO_VOICES: SpeechSynthesisVoice[] = [];
let voicesCache: SpeechSynthesisVoice[] | undefined;

function getVoicesSnapshot(): SpeechSynthesisVoice[] {
  if (voicesCache === undefined) {
    voicesCache = window.speechSynthesis ? window.speechSynthesis.getVoices() : NO_VOICES;
  }
  return voicesCache;
}

function getServerVoicesSnapshot(): SpeechSynthesisVoice[] {
  return NO_VOICES;
}

function subscribeToVoices(onChange: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) return () => {};
  // Voices can load between the first render and this subscription.
  const current = synth.getVoices();
  if (current.length !== voicesCache?.length) voicesCache = current;
  synth.onvoiceschanged = () => {
    voicesCache = synth.getVoices();
    onChange();
  };
  return () => {
    synth.onvoiceschanged = null;
  };
}

export default function StudyBuddyInteractive({
  courseId,
  courseTopic,
  courseStructure,
}: StudyBuddyProps) {
  const isSttSupported = useSyncExternalStore(subscribeNever, getSttSupported, getFalse);
  const availableVoices = useSyncExternalStore(
    subscribeToVoices,
    getVoicesSnapshot,
    getServerVoicesSnapshot,
  );
  const isTtsSupported = availableVoices.length > 0;
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const [conversation, setConversation] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi. Ask me anything about this course, like a term you did not get or how two ideas connect.",
    },
  ]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
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

  // Set up speech recognition
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();

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

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInputValue(currentTranscript);
        };

        recognition.onerror = (event) => {
          setIsListening(false);
          if (event.error === "network") {
            setSpeechError("Voice input could not reach the network. Type your question instead.");
          } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setSpeechError("Microphone access is blocked. Allow it in your browser settings, or type your question.");
          } else if (event.error !== "no-speech" && event.error !== "aborted") {
            setSpeechError(`Voice error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch {
        // isSttSupported already reports false when construction fails
      }
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop();
      } catch {}
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
          text: "Hi. Ask me anything about this course, like a term you did not get or how two ideas connect.",
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
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch {
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
      } catch {}
      setIsListening(false);
    }

    setInputValue("");
    setSpeechError(null);
    setIsProcessing(true);
    stopAudio();

    const userMsgId = crypto.randomUUID();
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
      const aiMsgId = crypto.randomUUID();

      setConversation((prev) => [
        ...prev,
        { id: aiMsgId, role: "ai", text: aiResponseText },
      ]);

      if (isTtsSupported) {
        speakMessage(aiMsgId, aiResponseText);
      }
    } catch {
      setConversation((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: "That did not go through. Send your question again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const status = isListening
    ? "Listening"
    : speakingMessageId
      ? "Reading aloud"
      : isProcessing
        ? "Thinking"
        : null;

  return (
    // 4rem navbar plus its 1px border
    <div className="mx-auto flex h-[calc(100dvh-4rem-1px)] w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link href={`/courses/${courseId}`} aria-label="Back to course">
            <ArrowLeft />
            <span className="hidden sm:inline">Course</span>
          </Link>
        </Button>

        <div className="min-w-0 text-center">
          <h1 className="truncate text-sm font-semibold">Study buddy</h1>
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-1.5 truncate font-mono text-xs text-muted-foreground"
          >
            {status ? (
              <>
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    isListening ? "bg-destructive" : "bg-primary",
                  )}
                />
                {status}
              </>
            ) : (
              <span className="truncate capitalize">{courseTopic}</span>
            )}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearHistory}
          className="-mr-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto py-5">
        {conversation.map((msg) => (
          <motion.div
            key={msg.id}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "flex flex-col",
              msg.role === "user"
                ? "ml-auto max-w-[85%] items-end"
                : "mr-auto max-w-full items-start sm:max-w-[90%]"
            )}
          >
            <div className="mb-1 flex min-h-6 items-center gap-1">
              <span className="font-mono text-xs text-muted-foreground">
                {msg.role === "user" ? "You" : "Study buddy"}
              </span>

              {/* Read aloud only shows when the browser supports speech */}
              {msg.role === "ai" && isTtsSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8",
                    speakingMessageId === msg.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => speakMessage(msg.id, msg.text)}
                  title={
                    speakingMessageId === msg.id ? "Stop reading" : "Read aloud"
                  }
                  aria-label={
                    speakingMessageId === msg.id ? "Stop reading" : "Read aloud"
                  }
                  aria-pressed={speakingMessageId === msg.id}
                >
                  {speakingMessageId === msg.id ? (
                    <SpeakerSlash weight="fill" />
                  ) : (
                    <SpeakerHigh />
                  )}
                </Button>
              )}
            </div>

            <div
              className={cn(
                "min-w-0 max-w-full text-[0.9375rem] leading-relaxed",
                msg.role === "user"
                  ? "rounded-lg rounded-br-sm bg-foreground px-4 py-2.5 text-background"
                  : "rounded-lg rounded-bl-sm border border-border bg-card px-4 py-3 text-foreground"
              )}
            >
              {msg.role === "ai" ? (
                <MarkdownRenderer
                  content={msg.text}
                  className="prose-sm prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0 sm:prose-base"
                />
              ) : (
                msg.text
              )}
            </div>
          </motion.div>
        ))}

        {isProcessing && (
          <div className="mr-auto flex flex-col items-start" role="status">
            <span className="mb-1 flex min-h-6 items-center font-mono text-xs text-muted-foreground">
              Study buddy
            </span>
            <div className="flex items-center gap-2 rounded-lg rounded-bl-sm border border-border bg-card px-4 py-3 text-[0.9375rem] text-muted-foreground">
              <Spinner /> Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {speechError && (
        <div
          role="alert"
          className="mb-2 flex shrink-0 items-center justify-between gap-3 rounded-md border border-warning/60 bg-warning/10 py-1 pr-1 pl-3 text-sm animate-in fade-in duration-200 motion-reduce:animate-none"
        >
          <div className="flex min-w-0 items-center gap-2">
            <WarningCircle className="size-4 shrink-0" aria-hidden />
            <span>{speechError}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSpeechError(null)}
            className="shrink-0"
          >
            Dismiss
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex shrink-0 items-center gap-2 border-t border-border pt-3 pb-4"
      >
        <div className="relative flex flex-1 items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="Your question"
            placeholder={
              isListening
                ? "Listening. Speak now."
                : "Ask about this course"
            }
            disabled={isProcessing}
            className={cn(
              "h-12 pointer-coarse:h-12",
              isSttSupported ? "pr-12" : "",
              isListening && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
            )}
          />

          {/* Mic only shows when the browser supports speech recognition */}
          {isSttSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isProcessing}
              className={cn(
                "absolute right-1 size-10 pointer-coarse:size-10",
                isListening
                  ? "bg-destructive text-primary-foreground hover:bg-destructive/90"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={isListening ? "Stop listening" : "Speak your question"}
              aria-label={isListening ? "Stop listening" : "Speak your question"}
              aria-pressed={isListening}
            >
              {isListening ? <MicrophoneSlash weight="fill" /> : <Microphone />}
            </Button>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isProcessing}
          className="size-12 pointer-coarse:size-12"
          aria-label="Send"
        >
          {isProcessing ? (
            <Spinner className="size-5" />
          ) : (
            <PaperPlaneRight weight="fill" className="size-5" />
          )}
        </Button>
      </form>
    </div>
  );
}

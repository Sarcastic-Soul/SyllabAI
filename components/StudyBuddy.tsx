"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Bot, VolumeX, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { askStudyBuddy } from "@/lib/actions/studybuddy.actions";

interface StudyBuddyProps {
  courseTopic: string;
  courseStructure: string; // We will pass a stringified list of the chapters
}

export default function StudyBuddy({
  courseTopic,
  courseStructure,
}: StudyBuddyProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition || !window.speechSynthesis) {
        setIsSupported(false);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim().length > 0) handleAskBuddy(transcript);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTranscript("");
      setAiResponse("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAskBuddy = async (question: string) => {
    setIsProcessing(true);
    try {
      const answer = await askStudyBuddy(
        question,
        courseTopic,
        courseStructure,
      );
      setAiResponse(answer);
      speakResponse(answer);
    } catch (error) {
      setAiResponse("Sorry, I had trouble processing that. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.includes("en") &&
          (v.name.includes("Google") || v.name.includes("Natural")),
      ) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) {
    return (
      <div className="p-8 border-2 border-destructive/20 rounded-2xl bg-destructive/5 text-center space-y-4 shadow-sm">
        <Bot className="w-12 h-12 text-destructive/40 mx-auto" />
        <h3 className="text-xl font-bold">Voice Features Unavailable</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your current browser does not support the native Web Speech API. To
          chat with the Study Buddy, please open this platform in{" "}
          <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 border-2 border-primary/20 rounded-2xl bg-primary/5 space-y-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Sparkles className="w-32 h-32" />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="p-4 bg-primary rounded-full shadow-lg shadow-primary/30">
          <Bot className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            Study Buddy
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-wider font-bold">
              Doubt Clearer
            </span>
          </h3>
          <p className="text-muted-foreground mt-1">
            Stuck on the syllabus? Ask your Voice Tutor out loud!
          </p>
        </div>
      </div>

      <div className="min-h-[120px] p-5 bg-background rounded-xl flex flex-col justify-end border shadow-inner relative z-10">
        {transcript && (
          <p className="text-sm font-medium text-foreground mb-3 whitespace-pre-wrap">
            <span className="text-primary font-bold">You: </span>
            {transcript}
          </p>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Spinner className="w-4 h-4" /> Buddy is thinking...
          </div>
        )}
        {aiResponse && !isProcessing && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            <span className="text-primary font-bold">Buddy: </span>
            {aiResponse}
          </p>
        )}
        {!transcript && !isProcessing && !aiResponse && (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Click the microphone, ask a question about the course, then click
            stop!
          </p>
        )}
      </div>

      <div className="flex justify-between items-center relative z-10">
        <Button
          onClick={toggleListening}
          disabled={isProcessing}
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className="w-[200px] font-bold shadow-md transition-all hover:scale-105"
        >
          {isListening ? (
            <>
              <Square className="w-5 h-5 mr-2" /> Stop & Ask
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" /> Start Listening
            </>
          )}
        </Button>
        {isSpeaking && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
          >
            <VolumeX className="w-5 h-5 mr-2" /> Stop Audio
          </Button>
        )}
      </div>
    </div>
  );
}

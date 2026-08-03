"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Sparkles, AlertCircle, Zap, CheckCircle2, Circle } from "lucide-react";

interface ProgressData {
  jobId: string;
  state: "queued" | "active" | "completed" | "failed";
  percent: number;
  step: string;
  courseId?: string;
  error?: string;
  isCached?: boolean;
}

export default function CourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressData | null>(null);

  // Topic State
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("5");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");

  // PDF State
  const [file, setFile] = useState<File | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const listenToProgress = (jobId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/generate/progress?jobId=${jobId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setProgress(data);

        if (data.state === "completed" && data.courseId) {
          es.close();
          // Short delay so user sees 100% completed status
          setTimeout(() => {
            router.push(`/courses/${data.courseId}`);
          }, 600);
        } else if (data.state === "failed") {
          es.close();
          setError(data.error || "Failed to generate course.");
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    };

    es.onerror = (err) => {
      console.warn("SSE connection error:", err);
      // Fallback: don't crash, progress loop in API will retry or close
    };
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress({
      jobId: "",
      state: "queued",
      percent: 5,
      step: "Initializing background job...",
    });

    try {
      const res = await fetch("/api/generate/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          duration: parseInt(duration),
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start course generation.");
      }

      listenToProgress(data.jobId);
    } catch (err: any) {
      setError(err.message || "Failed to generate course. Please try again.");
      setLoading(false);
      setProgress(null);
    }
  };

  const handlePDFSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setProgress({
      jobId: "",
      state: "queued",
      percent: 5,
      step: "Uploading document and queuing job...",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duration", duration);
      formData.append("difficulty", difficulty);

      const res = await fetch("/api/generate/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process PDF upload.");
      }

      listenToProgress(data.jobId);
    } catch (err: any) {
      setError(err.message || "Failed to process PDF.");
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="topic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="topic" className="text-base" disabled={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            Any Topic
          </TabsTrigger>
          <TabsTrigger value="pdf" className="text-base" disabled={loading}>
            <FileText className="w-4 h-4 mr-2" />
            From PDF Document
          </TabsTrigger>
        </TabsList>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start text-sm">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* --- REAL-TIME GENERATION PROGRESS UI --- */}
        {loading && progress && (
          <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 border border-indigo-100 rounded-2xl shadow-sm space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    Generating Course Syllabus
                  </h3>
                  <p className="text-xs text-slate-500">
                    Background job processing via Upstash Redis & BullMQ
                  </p>
                </div>
              </div>

              {progress.isCached && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                  <Zap className="w-3.5 h-3.5 mr-1 text-emerald-600 fill-emerald-600" />
                  Redis Cache Hit
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="truncate max-w-[260px]">{progress.step}</span>
                <span className="font-bold text-indigo-600">{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out shadow-inner"
                  style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
                />
              </div>
            </div>

            {/* Step Checkpoints */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                {progress.percent >= 10 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span>1. Queue & Input</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {progress.percent >= 60 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : progress.percent >= 10 ? (
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span>2. AI Syllabus</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {progress.percent >= 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : progress.percent >= 60 ? (
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span>3. DB & RAG Save</span>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 1: GENERATE FROM TOPIC --- */}
        <TabsContent value="topic">
          <form onSubmit={handleTopicSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">What do you want to learn?</Label>
              <Input
                id="topic"
                placeholder="e.g. Advanced React Patterns, Introduction to Astrophysics..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={(val) => setDifficulty(val as any)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chapters</Label>
                <Select
                  value={duration}
                  onValueChange={setDuration}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Chapters</SelectItem>
                    <SelectItem value="5">5 Chapters</SelectItem>
                    <SelectItem value="7">7 Chapters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !topic}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Job...
                </>
              ) : (
                "Generate Course"
              )}
            </Button>
          </form>
        </TabsContent>

        {/* --- TAB 2: GENERATE FROM PDF --- */}
        <TabsContent value="pdf">
          <form onSubmit={handlePDFSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="pdf-upload">Upload Course Material</Label>
              <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                <FileText className="w-8 h-8 text-muted-foreground mb-4" />
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="max-w-xs cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  disabled={loading}
                />
                <p className="mt-4 text-xs text-muted-foreground max-w-sm">
                  <strong className="text-foreground">Important:</strong> Please
                  upload text-based PDFs. Scanned images or PDFs without
                  selectable text cannot be processed by the AI.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={(val) => setDifficulty(val as any)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chapters</Label>
                <Select
                  value={duration}
                  onValueChange={setDuration}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Chapters</SelectItem>
                    <SelectItem value="5">5 Chapters</SelectItem>
                    <SelectItem value="7">7 Chapters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading & Processing...
                </>
              ) : (
                "Generate from Document"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

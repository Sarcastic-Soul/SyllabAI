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
import {
  Loader2,
  FileText,
  Sparkles,
  AlertCircle,
  Zap,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

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

  // Form State
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState("5");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");

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
      console.warn("SSE connection closed or lost:", err);
      if (es.readyState === EventSource.CLOSED) {
        es.close();
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim() && !file) {
      setError("Please provide a course title/topic or upload a document file.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress({
      jobId: "",
      state: "queued",
      percent: 5,
      step: file ? "Uploading document and queuing job..." : "Initializing background job...",
    });

    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (topic.trim()) formData.append("topic", topic.trim());
        if (description.trim()) formData.append("description", description.trim());
        formData.append("duration", duration);
        formData.append("difficulty", difficulty);

        res = await fetch("/api/generate/pdf", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/generate/topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            description: description.trim() || undefined,
            duration: parseInt(duration),
            difficulty,
          }),
        });
      }

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

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start text-sm">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* --- REAL-TIME GENERATION PROGRESS UI --- */}
      {loading && progress && (
        <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 via-card to-amber-500/5 border border-primary/20 rounded-2xl shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-primary text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  Generating Course Syllabus
                </h3>
                <p className="text-xs text-muted-foreground">
                  Serverless execution with Upstash Redis progress tracking
                </p>
              </div>
            </div>

            {progress.isCached && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                <Zap className="w-3.5 h-3.5 mr-1 text-emerald-600 fill-emerald-600" />
                Redis Cache Hit
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-foreground">
              <span className="truncate max-w-[260px]">{progress.step}</span>
              <span className="font-bold text-primary">{progress.percent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden p-0.5 border border-border">
              <div
                className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
              />
            </div>
          </div>

          {/* Step Checkpoints */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center space-x-1.5">
              {progress.percent >= 10 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
              <span>1. Queue & Input</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {progress.percent >= 60 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : progress.percent >= 10 ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
              <span>2. AI Syllabus</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {progress.percent >= 100 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : progress.percent >= 60 ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
              <span>3. DB & RAG Save</span>
            </div>
          </div>
        </div>
      )}

      {/* --- UNIFIED SINGLE FORM --- */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title / Topic */}
        <div className="space-y-2">
          <Label htmlFor="topic">Course Title / Topic</Label>
          <Input
            id="topic"
            placeholder="e.g. Advanced React Patterns, Introduction to Astrophysics..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Description (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <textarea
            id="description"
            rows={3}
            placeholder="Provide any specific focus areas, key topics, or instructions for the AI..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Reference Document Upload (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="doc-upload">Upload Reference Document (Optional)</Label>
          {file ? (
            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/30 text-sm">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                disabled={loading}
                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/30 transition-colors relative">
              <FileText className="w-7 h-7 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">
                Click to select or drag a reference document
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, TXT, Markdown (.md), CSV, and JSON files
              </p>
              <Input
                id="doc-upload"
                type="file"
                accept=".pdf,.txt,.md,.markdown,.csv,.json"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Difficulty & Chapters Grid */}
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
          disabled={loading || (!topic.trim() && !file)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Course...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" /> Generate Course
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

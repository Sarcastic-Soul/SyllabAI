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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  FileText,
  SpinnerGap,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

// Vercel rejects request bodies over 4.5 MB, so stop larger files before upload.
const MAX_FILE_MB = 4;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export default function CourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [percent, setPercent] = useState(0);

  // Form State
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState("5");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");

  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  const startProgressAnimation = () => {
    setPercent(0);
    if (animationRef.current) clearInterval(animationRef.current);

    animationRef.current = setInterval(() => {
      setPercent((prev) => {
        if (prev < 40) return prev + 4;
        if (prev < 75) return prev + 2;
        if (prev < 95) return prev + 0.8;
        return 95; // Holds at 95% until server response resolves
      });
    }, 150);
  };

  const stopProgressAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  const getStatusMessage = (val: number) => {
    if (val >= 100) return "Course ready. Opening it now.";
    if (val >= 95) return "Almost done. Saving the course.";
    if (val >= 70) return "Writing chapter outlines.";
    if (val >= 40) return "Planning the chapter list.";
    return "Reading your topic.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim() && !file) {
      setError("Add a topic or upload a file to start.");
      return;
    }

    setLoading(true);
    setError("");
    startProgressAnimation();

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
        throw new Error(data.error || "Failed to generate course.");
      }

      if (data.courseId) {
        stopProgressAnimation();
        setPercent(100);

        setTimeout(() => {
          router.refresh();
          router.push(`/courses/${data.courseId}`);
        }, 400);
        return;
      }
    } catch (err: unknown) {
      stopProgressAnimation();
      setError(
        (err instanceof Error && err.message) ||
          "Failed to generate course. Please try again.",
      );
      setLoading(false);
    }
  };

  const handleFileChange = (picked: File | null) => {
    if (picked && picked.size > MAX_FILE_BYTES) {
      setFile(null);
      setError(
        `That file is ${(picked.size / (1024 * 1024)).toFixed(1)} MB. The limit is ${MAX_FILE_MB} MB. Try a smaller file or split the PDF.`,
      );
      return;
    }
    setError("");
    setFile(picked);
  };

  return (
    <div className="w-full">
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <WarningCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      {loading && (
        <div
          role="status"
          className="mb-8 space-y-3 rounded-lg border border-border bg-card p-5 animate-in fade-in duration-200 motion-reduce:animate-none"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-base font-semibold">Building your course</h3>
            <span className="font-mono text-sm tabular-nums">
              {Math.round(percent)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {getStatusMessage(percent)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            placeholder="Binary search trees, the French Revolution, organic chemistry basics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Needed unless you upload a file below.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            What to focus on
            <span className="font-normal text-muted-foreground">optional</span>
          </Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Exam in two weeks, skip the history, more worked examples"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-upload">
            Source file
            <span className="font-normal text-muted-foreground">optional</span>
          </Label>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-foreground/20 bg-card py-2 pr-2 pl-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate font-medium">{file.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                disabled={loading}
                className="shrink-0 text-destructive hover:bg-destructive/10"
              >
                <X /> Remove
              </Button>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed border-foreground/30 bg-card px-4 py-7 text-center transition-colors duration-150 hover:border-foreground/50 hover:bg-muted/50 has-[:focus-visible]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/30">
              <UploadSimple className="mb-2 size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">
                Choose a file or drop it here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, TXT, Markdown, CSV or JSON. Up to {MAX_FILE_MB} MB.
              </p>
              <input
                id="doc-upload"
                type="file"
                accept=".pdf,.txt,.md,.markdown,.csv,.json"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                onChange={(e) => {
                  handleFileChange(e.target.files?.[0] || null);
                  // Lets the same file be picked again after an error
                  e.target.value = "";
                }}
                disabled={loading}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="difficulty-select">Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(val) => setDifficulty(val as typeof difficulty)}
              disabled={loading}
            >
              <SelectTrigger id="difficulty-select" className="w-full">
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
            <Label htmlFor="chapters-select">Length</Label>
            <Select
              value={duration}
              onValueChange={setDuration}
              disabled={loading}
            >
              <SelectTrigger id="chapters-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 chapters</SelectItem>
                <SelectItem value="5">5 chapters</SelectItem>
                <SelectItem value="7">7 chapters</SelectItem>
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
              <SpinnerGap className="animate-spin" /> Building course...
            </>
          ) : (
            <>
              Generate course <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

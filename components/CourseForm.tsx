"use client";

import { useState } from "react";
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
import {
  generateCourse,
  generateCourseFromPDF,
} from "@/lib/actions/course.actions";
import { Loader2, FileText, Sparkles, AlertCircle } from "lucide-react";

export default function CourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Topic State
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("5");
  const [difficulty, setDifficulty] = useState("Beginner");

  // PDF State
  const [file, setFile] = useState<File | null>(null);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newCourse = await generateCourse({
        topic,
        duration: parseInt(duration),
        difficulty,
      });
      router.push(`/courses/${newCourse.id}`);
    } catch (err: any) {
      setError("Failed to generate course. Please try again.");
      setLoading(false);
    }
  };

  const handlePDFSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duration", duration);
      formData.append("difficulty", difficulty);

      const newCourseId = await generateCourseFromPDF(formData);
      router.push(`/courses/${newCourseId}`);
    } catch (err: any) {
      setError(err.message || "Failed to process PDF.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="topic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="topic" className="text-base">
            <Sparkles className="w-4 h-4 mr-2" />
            Any Topic
          </TabsTrigger>
          <TabsTrigger value="pdf" className="text-base">
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

            {/* ... (Include your existing Select fields for duration and difficulty here) ... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={setDifficulty}
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
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Building
                  Course...
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
                  onValueChange={setDifficulty}
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
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Reading &
                  Building...
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

export interface TopicJobData {
  type: "topic";
  userId: string;
  topic: string;
  description?: string;
  duration: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface PdfJobData {
  type: "pdf";
  userId: string;
  topic?: string;
  description?: string;
  filename: string;
  pdfBase64: string; // Base64 encoded PDF buffer
  duration: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export type GenerationJobData = TopicJobData | PdfJobData;

export interface JobProgressState {
  jobId: string;
  state: "queued" | "active" | "completed" | "failed";
  percent: number;
  step: string;
  courseId?: string;
  error?: string;
  isCached?: boolean;
  updatedAt: number;
}

import { NextRequest } from "next/server";
import { getJobProgressState } from "@/lib/queue/progress";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_STREAM_DURATION_MS = 120000; // 2 minutes maximum SSE stream lifetime

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("Missing jobId parameter", { status: 400 });
  }

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          isClosed = true;
        }
      };

      const closeStream = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      };

      // Poll interval loop (1 second interval to save CPU/Redis resources)
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        // Safety timeout check (close stream before Vercel 300s serverless timeout)
        if (Date.now() - startTime > MAX_STREAM_DURATION_MS) {
          sendEvent({
            jobId,
            state: "failed",
            percent: 0,
            step: "Generation process timed out",
            error: "Course generation timed out after 2 minutes. Please try again.",
            updatedAt: Date.now(),
          });
          closeStream();
          return;
        }

        try {
          const state = await getJobProgressState(jobId);

          if (!state) {
            sendEvent({
              jobId,
              state: "queued",
              percent: 5,
              step: "Waiting in queue...",
              updatedAt: Date.now(),
            });
            return;
          }

          sendEvent(state);

          if (state.state === "completed" || state.state === "failed") {
            setTimeout(() => {
              closeStream();
            }, 100);
          }
        } catch (err: any) {
          sendEvent({
            jobId,
            state: "failed",
            percent: 0,
            step: "Failed to read progress",
            error: err.message || "Progress streaming failed",
            updatedAt: Date.now(),
          });
          closeStream();
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        closeStream();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

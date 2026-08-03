import { NextRequest } from "next/server";
import { getJobProgressState } from "@/lib/queue/progress";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("Missing jobId parameter", { status: 400 });
  }

  const encoder = new TextEncoder();

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

      // Poll interval loop
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
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
            isClosed = true;
            clearInterval(interval);
            setTimeout(() => {
              try {
                controller.close();
              } catch {
                // Controller may already be closed
              }
            }, 100);
          }
        } catch (err: any) {
          sendEvent({
            jobId,
            state: "failed",
            percent: 0,
            step: "Failed to read progress",
            error: err.message,
            updatedAt: Date.now(),
          });
          isClosed = true;
          clearInterval(interval);
          try {
            controller.close();
          } catch {
            // safely handle close
          }
        }
      }, 500);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(interval);
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

import type { GenerationLogStats } from "@/lib/queries/admin";

interface GenerationLogSectionProps {
  /** Null when generation_logs could not be read (for example the migration is not applied yet). */
  stats: GenerationLogStats | null;
}

// Steps that return JSON checked against a schema; invalid-output rates only apply to these.
const JSON_STEPS = new Set(["syllabus_topic", "syllabus_pdf", "quiz", "flashcards"]);

const STEP_LABELS: Record<string, string> = {
  syllabus_topic: "Syllabus from topic",
  syllabus_pdf: "Syllabus from document",
  pdf_summary: "Document summary",
  lesson: "Lesson",
  mermaid: "Diagram",
  quiz: "Quiz",
  flashcards: "Flashcards",
  study_buddy: "Study Buddy reply",
  cheat_sheet: "Cheat sheet",
  embedding: "Embedding request",
};

const numberFormat = new Intl.NumberFormat("en-US");

function formatMs(ms: number | null): string {
  if (ms === null) return "-";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}

function formatRate(part: number, total: number): string {
  if (total === 0) return "-";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function formatCost(usd: number): string {
  return usd < 0.01 && usd > 0 ? "< $0.01" : `$${usd.toFixed(2)}`;
}

export default function GenerationLogSection({ stats }: GenerationLogSectionProps) {
  const hasRows = stats !== null && stats.steps.length > 0;
  const showCost = stats?.steps.some((s) => s.estimatedCostUsd !== null) ?? false;

  return (
    <section aria-labelledby="generation-log-heading" className="space-y-4">
      <div>
        <h2 id="generation-log-heading" className="text-lg font-bold text-foreground">
          AI calls
        </h2>
        <p className="text-sm text-muted-foreground">
          {stats ? `Last ${stats.days} days, ` : ""}one row per Gemini call, read from the
          generation_logs table.
        </p>
      </div>

      {!hasRows ? (
        <div className="border border-dashed border-border rounded-lg px-4 py-8 text-sm text-muted-foreground">
          {stats === null
            ? "The generation_logs table could not be read. It is created by the latest database migration; once that is applied, calls show up here."
            : "No AI calls have been logged in this period yet."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-card border border-border rounded-lg">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2.5 font-medium">Step</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Calls</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Failed</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Tokens in</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Tokens out</th>
                  {showCost && (
                    <th scope="col" className="px-4 py-2.5 font-medium text-right">Est. cost</th>
                  )}
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">p50</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">p95</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Invalid, first reply</th>
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Invalid, after retry</th>
                </tr>
              </thead>
              <tbody>
                {stats.steps.map((s) => {
                  const isJson = JSON_STEPS.has(s.step);
                  return (
                    <tr key={s.step} className="border-b border-border last:border-b-0">
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-foreground whitespace-nowrap">
                        {STEP_LABELS[s.step] ?? s.step}
                      </th>
                      <td className="px-4 py-2.5 text-right">{numberFormat.format(s.calls)}</td>
                      <td className="px-4 py-2.5 text-right">{numberFormat.format(s.failed)}</td>
                      <td className="px-4 py-2.5 text-right">{numberFormat.format(s.inputTokens)}</td>
                      <td className="px-4 py-2.5 text-right">{numberFormat.format(s.outputTokens)}</td>
                      {showCost && (
                        <td className="px-4 py-2.5 text-right">
                          {s.estimatedCostUsd === null ? "-" : formatCost(s.estimatedCostUsd)}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right">{formatMs(s.p50Ms)}</td>
                      <td className="px-4 py-2.5 text-right">{formatMs(s.p95Ms)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {isJson ? formatRate(s.invalidBeforeRepair, s.calls) : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isJson ? formatRate(s.invalidAfterRepair, s.calls) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground max-w-prose">
            {showCost
              ? "Cost is an estimate from the prices entered in lib/ai/pricing.ts; a dash means a model used by that step has no price entered. "
              : "No cost is shown because no model prices are entered in lib/ai/pricing.ts. "}
            Invalid rates apply to the steps that return JSON. A retry is one extra call with the
            error message added to the prompt. Embedding requests report no token counts.
          </p>
        </>
      )}
    </section>
  );
}

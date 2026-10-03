import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { seedMockData } from "@/lib/actions/seed.actions";
import { Warning } from "@phosphor-icons/react/dist/ssr";

export default async function SeedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
      <p className="font-mono text-xs text-muted-foreground">Dev tool</p>
      <h1 className="mt-2 text-3xl font-bold">Add sample data</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        Adds 3 sample courses to your account: one completed, one in progress
        and one not started. It also fills in stats, the activity map and quiz
        scores.
      </p>

      <div className="mt-6 flex gap-3 rounded-lg border border-warning/60 bg-warning/10 p-4 text-sm">
        <Warning className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold">This writes real records to your database.</p>
          <p>
            The sample courses show up on your dashboard next to your own
            courses. You can delete them there.
          </p>
        </div>
      </div>

      <form action={seedMockData} className="mt-6">
        <Button size="lg" className="w-full sm:w-auto">
          Add sample data
        </Button>
      </form>
    </main>
  );
}

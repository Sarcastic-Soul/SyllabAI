import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { seedMockData } from "@/lib/actions/seed.actions";
import { Database, AlertTriangle } from "lucide-react";

export default async function SeedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Database className="w-10 h-10 text-primary" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight">Seed Mock Data</h1>
      <p className="text-lg text-muted-foreground">
        Populate your account with 3 sample courses representing different states of progress:
        completed, ongoing, and untouched. It will also generate realistic user stats, an activity heatmap, and accurate quiz percentages.
      </p>

      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 p-4 rounded-xl flex gap-3 text-left w-full mt-4">
        <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Warning: This action will permanently add records to your database.</p>
          <p>The new mock courses will appear instantly on your dashboard alongside your real generated courses.</p>
        </div>
      </div>

      <form action={seedMockData} className="w-full pt-4">
        <Button size="lg" className="w-full h-14 text-lg">
          Inject Mock Data
        </Button>
      </form>
    </div>
  );
}

import { PricingTable } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

const Subscription = () => {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-12 mt-10 mb-20">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">
            Upgrade Your Plan
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Unlock Unlimited AI Learning
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Supercharge your learning journey. Upgrade to Pro to generate
          unlimited structured courses, access advanced quizzes, and master new
          skills without limits.
        </p>
      </div>

      {/* Pricing Table Wrapper */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-4xl p-4 sm:p-8 border rounded-3xl bg-card shadow-sm">
          {/* Clerk handles the actual pricing cards and checkout logic */}
          <PricingTable />
        </div>
      </div>
    </main>
  );
};

export default Subscription;
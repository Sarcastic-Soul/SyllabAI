"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Error loading profile</h2>
      <p className="text-neutral-400 max-w-md mb-6">
        We were unable to retrieve your profile analytics. Please try refreshing.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors font-medium text-sm"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}

// Shared class strings for the public pages. Kept here so the landing page
// does not depend on app-shell components that change on their own schedule.

export const GITHUB_URL = "https://github.com/Sarcastic-Soul/SyllabAI";

export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const btnBase = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium cursor-pointer transition-colors duration-150 active:translate-y-px ${focusRing}`;

export const btnPrimary = `${btnBase} bg-primary text-primary-foreground hover:bg-[#cf3c17]`;

export const btnOutline = `${btnBase} border border-foreground/25 text-foreground hover:border-foreground/60 hover:bg-secondary`;

export const btnQuiet = `${btnBase} text-foreground hover:bg-secondary`;

export const btnSm = "h-11 px-4 text-sm sm:h-9";
export const btnLg = "h-12 px-6 text-base";

export const textLink = `underline decoration-foreground/30 underline-offset-4 hover:decoration-primary ${focusRing} rounded-sm`;

export const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

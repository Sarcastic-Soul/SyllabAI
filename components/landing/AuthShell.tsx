import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { focusRing, textLink } from "./styles";

type AuthShellProps = {
  title: string;
  intro: string;
  points: string[];
  switchText: string;
  switchLabel: string;
  switchHref: string;
  children: ReactNode;
};

/** Shared frame for the sign-in and sign-up pages. */
export default function AuthShell({
  title,
  intro,
  points,
  switchText,
  switchLabel,
  switchHref,
  children,
}: AuthShellProps) {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex flex-col border-border bg-secondary px-5 py-6 sm:px-10 lg:border-r lg:py-10">
        <Link
          href="/"
          className={`flex min-h-11 w-fit items-center gap-2 rounded-sm ${focusRing}`}
        >
          <Image src="/logo.svg" alt="" width={36} height={36} className="size-9" />
          <span className="font-display text-lg font-bold tracking-tight">
            SyllabAI
          </span>
        </Link>

        <div className="mt-8 max-w-md lg:my-auto">
          <h1 className="text-balance text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{intro}</p>
          <ul className="mt-6 hidden border-t border-foreground/20 lg:block">
            {points.map((p) => (
              <li key={p} className="border-b border-border py-3 text-[15px]">
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm text-muted-foreground lg:mt-0">
          {switchText}{" "}
          <Link href={switchHref} className={`font-medium text-foreground ${textLink}`}>
            {switchLabel}
          </Link>
        </p>
      </div>

      <div className="flex items-start justify-center px-5 py-10 sm:px-10 lg:items-center [&_.cl-cardBox]:border [&_.cl-cardBox]:border-solid [&_.cl-cardBox]:border-foreground/15 [&_.cl-cardBox]:shadow-none!">
        {children}
      </div>
    </main>
  );
}

/** Clerk appearance shared by both forms, mapped to the app's tokens. */
export const authAppearance = {
  variables: {
    colorPrimary: "#e8471f",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist), ui-sans-serif, sans-serif",
    fontSize: "16px",
  },
};

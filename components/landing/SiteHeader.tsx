import Image from "next/image";
import Link from "next/link";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { HeaderAuth } from "./AuthButtons";
import { GITHUB_URL, container, focusRing } from "./styles";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "Questions" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <Link
          href="/"
          className={`flex min-h-11 items-center gap-2 rounded-sm ${focusRing}`}
        >
          <Image
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            className="size-9"
            priority
          />
          <span className="font-display text-lg font-bold tracking-tight max-[380px]:sr-only">
            SyllabAI
          </span>
        </Link>

        <nav aria-label="Page sections" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground ${focusRing}`}
            >
              {l.label}
            </a>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground ${focusRing}`}
          >
            <SiGithub className="size-4" aria-hidden="true" />
            Source
          </a>
        </nav>

        <HeaderAuth />
      </div>
    </header>
  );
}

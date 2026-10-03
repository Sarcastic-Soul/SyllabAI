"use client";

import { Button } from "@/components/ui/button";
import { DownloadSimple, FilePdf, FileMd, CaretDown } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import type { courses, chapters as chaptersTable } from "@/lib/db/schema";

type ExportCourse = Pick<typeof courses.$inferSelect, "id" | "topic" | "difficulty">;
type ExportChapter = Pick<
    typeof chaptersTable.$inferSelect,
    "order" | "title" | "lessonText"
>;

export default function ExportCourseButtons({
    course,
    chapters,
}: {
    course: ExportCourse;
    chapters: ExportChapter[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const generateMarkdown = () => {
        let md = `# ${course.topic.toUpperCase()}\n\n`;
        md += `**Difficulty:** ${course.difficulty} | **Modules:** ${chapters.length}\n\n---\n\n`;

        chapters.forEach((c) => {
            md += `## Chapter ${c.order}: ${c.title}\n\n`;
            md += `${c.lessonText && c.lessonText !== "GENERATING" ? c.lessonText : "*Content not generated yet.*"}\n\n---\n\n`;
        });
        return md;
    };

    const handleMarkdownExport = () => {
        const md = generateMarkdown();
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${course.topic.replace(/\s+/g, "-").toLowerCase()}-course.md`;
        a.click();
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    const handlePDFExport = () => {
        // Opens the print view which automatically triggers the "Save as PDF" browser dialog
        window.open(`/courses/${course.id}/print`, "_blank");
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <DownloadSimple />
                Export
                <CaretDown
                    className={`size-3.5 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                />
            </Button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute left-0 z-50 mt-1.5 w-52 rounded-md border border-foreground/15 bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_-12px_oklch(0.21_0.015_55/0.25)] animate-in fade-in duration-150 motion-reduce:animate-none sm:right-0 sm:left-auto"
                >
                    <button
                        role="menuitem"
                        onClick={handlePDFExport}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                    >
                        <FilePdf className="size-4 text-muted-foreground" />
                        Save as PDF
                    </button>
                    <button
                        role="menuitem"
                        onClick={handleMarkdownExport}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                    >
                        <FileMd className="size-4 text-muted-foreground" />
                        Save as Markdown
                    </button>
                </div>
            )}
        </div>
    );
}

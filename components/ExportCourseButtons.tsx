"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, FileImage, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ExportCourseButtons({
    course,
    chapters,
}: {
    course: any;
    chapters: any[];
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
                className="h-10 gap-2 font-medium"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown
                    className={`w-4 h-4 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover text-popover-foreground shadow-md outline-none z-50 animate-in fade-in-80 zoom-in-95">
                    <div className="flex flex-col p-1">
                        <button
                            onClick={handlePDFExport}
                            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors"
                        >
                            <FileImage className="w-4 h-4 mr-2" />
                            Save as PDF
                        </button>
                        <button
                            onClick={handleMarkdownExport}
                            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Save as Markdown
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

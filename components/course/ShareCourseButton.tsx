"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkSimple, Check, Globe, Lock } from "@phosphor-icons/react";
import { toggleCoursePublic } from "@/lib/actions/course.actions";
import { Spinner } from "@/components/ui/spinner";

interface ShareCourseButtonProps {
    courseId: string;
    isPublic: boolean;
    shareSlug: string | null;
}

export default function ShareCourseButton({
    courseId,
    isPublic: initialIsPublic,
    shareSlug: initialSlug,
}: ShareCourseButtonProps) {
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [shareSlug, setShareSlug] = useState(initialSlug);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const result = await toggleCoursePublic(courseId);
            setIsPublic(result.isPublic);
            setShareSlug(result.shareSlug);
        } catch (error) {
            console.error("Failed to toggle sharing:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareSlug) return;
        const url = `${window.location.origin}/shared/${shareSlug}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                variant={isPublic ? "default" : "outline"}
                size="sm"
                onClick={handleToggle}
                disabled={isLoading}
                aria-pressed={isPublic}
                title={
                    isPublic
                        ? "Anyone with the link can read this course. Click to make it private."
                        : "Only you can see this course. Click to make a share link."
                }
            >
                {isLoading ? <Spinner /> : isPublic ? <Globe /> : <Lock />}
                {isPublic ? "Public" : "Private"}
            </Button>

            {isPublic && shareSlug && (
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? (
                        <>
                            <Check weight="bold" className="text-success" />
                            Copied
                        </>
                    ) : (
                        <>
                            <LinkSimple />
                            Copy link
                        </>
                    )}
                </Button>
            )}
            <span aria-live="polite" className="sr-only">
                {copied ? "Share link copied" : ""}
            </span>
        </div>
    );
}

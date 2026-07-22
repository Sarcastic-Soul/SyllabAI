"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Check, Globe, Lock } from "lucide-react";
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
        <div className="flex items-center gap-2">
            <Button
                variant={isPublic ? "default" : "outline"}
                size="sm"
                onClick={handleToggle}
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? (
                    <Spinner className="w-4 h-4" />
                ) : isPublic ? (
                    <Globe className="w-4 h-4" />
                ) : (
                    <Lock className="w-4 h-4" />
                )}
                {isPublic ? "Public" : "Private"}
            </Button>

            {isPublic && shareSlug && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-2"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-500" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <LinkIcon className="w-4 h-4" />
                            Copy Link
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}

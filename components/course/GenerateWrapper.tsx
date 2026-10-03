"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface GenerateWrapperProps {
    action: () => Promise<{ error?: string } | void>;
    defaultText: string;
    loadingText: string;
    icon?: React.ReactNode;
}

export default function GenerateWrapper({
    action,
    defaultText,
    loadingText,
    icon,
}: GenerateWrapperProps) {
    const [error, setError] = useState("");

    const handleAction = async () => {
        setError("");
        try {
            const res = await action();
            if (res && res.error) {
                setError(res.error);
            }
        } catch (e: unknown) {
            setError(
                (e instanceof Error && e.message) || "Generation failed. Try again.",
            );
        }
    };

    return (
        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <form action={handleAction}>
                <SubmitButton
                    defaultText={defaultText}
                    loadingText={loadingText}
                    icon={icon}
                />
            </form>
            {error && (
                <div
                    role="alert"
                    className="flex max-w-sm items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
                >
                    <WarningCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                    <span className="min-w-0 flex-1 leading-snug break-words">{error}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={handleAction}
                        type="button"
                    >
                        <ArrowClockwise />
                        Retry
                    </Button>
                </div>
            )}
        </div>
    );
}

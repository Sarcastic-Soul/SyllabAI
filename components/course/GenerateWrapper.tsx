"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateWrapperProps {
    action: () => Promise<any>;
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
        } catch (e: any) {
            setError(e.message || "An error occurred during generation.");
        }
    };

    return (
        <div className="flex flex-col items-end gap-2 shrink-0">
            <form action={handleAction}>
                <SubmitButton
                    defaultText={defaultText}
                    loadingText={loadingText}
                    icon={icon}
                />
            </form>
            {error && (
                <div className="flex items-center gap-3 p-3 mt-2 text-red-500 bg-red-500/10 rounded-lg border border-red-500/20 text-sm font-medium max-w-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="break-words flex-1 leading-tight">{error}</span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-red-600 shrink-0 h-8 px-2"
                        onClick={handleAction}
                        type="button"
                    >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Retry
                    </Button>
                </div>
            )}
        </div>
    );
}

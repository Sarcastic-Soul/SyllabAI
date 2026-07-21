"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SubmitButton({
    defaultText,
    loadingText,
    icon,
    variant = "default",
    size = "lg",
    className,
}: {
    defaultText: string;
    loadingText: string;
    icon?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" variant={variant} size={size} className={className} disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4" />}
            {!pending && icon}
            {pending ? loadingText : defaultText}
        </Button>
    );
}

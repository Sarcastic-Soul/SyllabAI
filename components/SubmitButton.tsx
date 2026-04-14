"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SubmitButton({
    defaultText,
    loadingText,
    icon,
}: {
    defaultText: string;
    loadingText: string;
    icon?: React.ReactNode;
}) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" size="lg" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4" />}
            {!pending && icon}
            {pending ? loadingText : defaultText}
        </Button>
    );
}

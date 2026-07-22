"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavItems from "@/components/shared/NavItems";

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            {isOpen && (
                <div className="absolute top-16 left-0 right-0 border-b bg-background shadow-lg p-4 flex flex-col gap-4 z-50 animate-in slide-in-from-top-2">
                    <NavItems />
                </div>
            )}
        </div>
    );
}

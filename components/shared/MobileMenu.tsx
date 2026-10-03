"use client";

import { useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import NavItems from "@/components/shared/NavItems";

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Button
                variant="ghost"
                size="icon"
                className="size-11"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
            >
                {isOpen ? <X className="size-5" /> : <List className="size-5" />}
            </Button>

            {isOpen && (
                <div
                    id="mobile-menu"
                    // Any link tap inside closes the menu
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-x-0 top-full z-50 border-b border-border bg-card px-4 py-2 animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
                >
                    <NavItems />
                </div>
            )}
        </div>
    );
}

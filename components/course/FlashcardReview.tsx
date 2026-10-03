"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowCounterClockwise, CheckCircle, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { reviewFlashcard } from "@/lib/actions/flashcard.actions";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface Flashcard {
    id: string;
    front: string;
    back: string;
    nextReviewAt: Date;
    interval: number;
    easeFactor: number;
}

interface FlashcardReviewProps {
    flashcards: Flashcard[];
    chapterId: string;
}

export default function FlashcardReview({ flashcards: initialCards }: FlashcardReviewProps) {
    const [cards] = useState(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);
    const reduceMotion = useReducedMotion();

    // Separate due cards from future cards
    const now = new Date();
    const dueCards = cards.filter((c) => new Date(c.nextReviewAt) <= now);
    const totalDue = dueCards.length;

    const currentCard = cards[currentIndex];

    const handleFlip = useCallback(() => {
        setIsFlipped((prev) => !prev);
    }, []);

    const handleReview = async (quality: 0 | 1 | 2 | 3) => {
        if (!currentCard || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await reviewFlashcard(currentCard.id, quality);
            setReviewedCount((prev) => prev + 1);

            // Move to next card or finish
            if (currentIndex < cards.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setIsFlipped(false);
            } else {
                setSessionComplete(true);
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBrowse = (direction: "prev" | "next") => {
        setIsFlipped(false);
        if (direction === "prev" && currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        } else if (direction === "next" && currentIndex < cards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    if (cards.length === 0) {
        return (
            <div className="mt-6 rounded-xl border border-dashed border-foreground/25 px-6 py-8">
                <p className="font-medium">No flashcards for this chapter yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Generate a set from this lesson to start reviewing.
                </p>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="mt-6 rounded-xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-2.5">
                    <CheckCircle weight="fill" className="size-6 shrink-0 text-success" aria-hidden />
                    <h3 className="text-xl font-semibold">Review done</h3>
                </div>
                <p className="mt-2 max-w-[55ch] text-muted-foreground">
                    You reviewed {reviewedCount} card{reviewedCount !== 1 ? "s" : ""}. Cards
                    you found hard come back sooner, easy ones later.
                </p>
                <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                        setCurrentIndex(0);
                        setIsFlipped(false);
                        setSessionComplete(false);
                        setReviewedCount(0);
                    }}
                >
                    <ArrowCounterClockwise /> Go through the cards again
                </Button>
            </div>
        );
    }

    const ratings: { quality: 0 | 1 | 2 | 3; label: string; dot: string }[] = [
        { quality: 0, label: "Again", dot: "bg-destructive" },
        { quality: 1, label: "Hard", dot: "bg-warning" },
        { quality: 2, label: "Good", dot: "bg-foreground/50" },
        { quality: 3, label: "Easy", dot: "bg-success" },
    ];

    const faceClass =
        "[grid-area:1/1] flex min-h-52 flex-col rounded-xl border bg-card p-5 backface-hidden sm:p-7";

    return (
        <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                <span>
                    Card {currentIndex + 1}/{cards.length}
                    {totalDue > 0 && (
                        <span className="text-foreground"> · {totalDue} due</span>
                    )}
                </span>
                <span>{reviewedCount} reviewed</span>
            </div>

            {/* Keyed by card so a new card always starts on its question side */}
            <button
                key={currentCard.id}
                type="button"
                onClick={handleFlip}
                aria-label={isFlipped ? "Show the question" : "Show the answer"}
                className="group block w-full cursor-pointer rounded-xl text-left perspective-[1200px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                <motion.span
                    className="grid transform-3d"
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={
                        reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", bounce: 0, duration: 0.4 }
                    }
                >
                    <span
                        aria-hidden={isFlipped}
                        className={cn(
                            faceClass,
                            "border-foreground/20 transition-colors duration-150 group-hover:border-foreground/40",
                        )}
                    >
                        <span className="font-mono text-xs text-muted-foreground">
                            Question
                        </span>
                        <span className="my-auto block py-4 text-lg leading-snug font-medium text-pretty sm:text-xl">
                            {currentCard.front}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Tap to see the answer
                        </span>
                    </span>
                    <span
                        aria-hidden={!isFlipped}
                        className={cn(faceClass, "rotate-y-180 border-foreground/50")}
                    >
                        <span className="font-mono text-xs text-primary">
                            Answer
                        </span>
                        <span className="my-auto block py-4 text-lg leading-snug font-medium text-pretty sm:text-xl">
                            {currentCard.back}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            How well did you know it?
                        </span>
                    </span>
                </motion.span>
            </button>

            {isFlipped ? (
                <div className="grid grid-cols-4 gap-2">
                    {ratings.map((r) => (
                        <Button
                            key={r.quality}
                            variant="outline"
                            className="h-11 gap-1.5 px-2"
                            onClick={() => handleReview(r.quality)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && r.quality === 0 ? (
                                <Spinner />
                            ) : (
                                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", r.dot)} />
                            )}
                            {r.label}
                        </Button>
                    ))}
                </div>
            ) : (
                <div className="flex justify-between">
                    <Button
                        variant="ghost"
                        className="h-11"
                        onClick={() => handleBrowse("prev")}
                        disabled={currentIndex === 0}
                    >
                        <CaretLeft /> Previous
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-11"
                        onClick={() => handleBrowse("next")}
                        disabled={currentIndex === cards.length - 1}
                    >
                        Next <CaretRight />
                    </Button>
                </div>
            )}
        </div>
    );
}

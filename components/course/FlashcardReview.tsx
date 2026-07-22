"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, Zap, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { reviewFlashcard, getFlashcardsDueForReview } from "@/lib/actions/flashcard.actions";
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

export default function FlashcardReview({ flashcards: initialCards, chapterId }: FlashcardReviewProps) {
    const [cards, setCards] = useState(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

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
            <div className="text-center py-8 text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-secondary mt-6">
                <Brain className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No flashcards yet. Generate flashcards from the lesson first!</p>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="p-8 border rounded-2xl bg-green-500/10 border-green-500/20 text-center space-y-3 mt-6">
                <Check className="w-10 h-10 mx-auto text-green-500" />
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Review Complete!
                </h3>
                <p className="text-muted-foreground">
                    You reviewed {reviewedCount} card{reviewedCount !== 1 ? "s" : ""}. Come back later for your next review session.
                </p>
                <Button
                    variant="outline"
                    onClick={() => {
                        setCurrentIndex(0);
                        setIsFlipped(false);
                        setSessionComplete(false);
                        setReviewedCount(0);
                    }}
                >
                    <RotateCcw className="w-4 h-4 mr-2" /> Browse All Cards
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Card {currentIndex + 1} of {cards.length}
                    {totalDue > 0 && (
                        <span className="text-primary font-medium">
                            ({totalDue} due for review)
                        </span>
                    )}
                </span>
                <span>{reviewedCount} reviewed this session</span>
            </div>

            {/* Card */}
            <div
                onClick={handleFlip}
                className={cn(
                    "relative min-h-[200px] p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center text-center",
                    isFlipped
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card border-border hover:border-primary/30",
                )}
            >
                <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                        {isFlipped ? "Answer" : "Question"}
                    </span>
                    <p className="text-lg md:text-xl font-medium">
                        {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                    {!isFlipped && (
                        <p className="text-xs text-muted-foreground mt-4">
                            Click to reveal answer
                        </p>
                    )}
                </div>
            </div>

            {/* Review Buttons (shown after flip) */}
            {isFlipped ? (
                <div className="grid grid-cols-4 gap-2">
                    <Button
                        variant="outline"
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => handleReview(0)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Spinner className="w-4 h-4" /> : "Again"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:text-orange-500"
                        onClick={() => handleReview(1)}
                        disabled={isSubmitting}
                    >
                        Hard
                    </Button>
                    <Button
                        variant="outline"
                        className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => handleReview(2)}
                        disabled={isSubmitting}
                    >
                        Good
                    </Button>
                    <Button
                        variant="outline"
                        className="border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                        onClick={() => handleReview(3)}
                        disabled={isSubmitting}
                    >
                        <Zap className="w-4 h-4 mr-1" /> Easy
                    </Button>
                </div>
            ) : (
                /* Browse navigation (before flip) */
                <div className="flex justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBrowse("prev")}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBrowse("next")}
                        disabled={currentIndex === cards.length - 1}
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}

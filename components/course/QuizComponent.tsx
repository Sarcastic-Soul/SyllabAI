"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitQuizScore } from "@/lib/actions/quiz.actions";
import { Spinner } from "@/components/ui/spinner";
import { Check, CheckCircle, X, XCircle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface QuizComponentProps {
  quizId: string;
  chapterId: string;
  courseId: string;
  questions: Question[];
  existingScore: number | null;
}

export default function QuizComponent({
  quizId,
  chapterId,
  courseId,
  questions,
  existingScore,
}: QuizComponentProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reduceMotion = useReducedMotion();

  if (existingScore !== null) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <CheckCircle weight="fill" className="size-6 shrink-0 text-success" aria-hidden />
          <h3 className="text-lg font-semibold">Quiz done</h3>
        </div>
        <p className="text-muted-foreground">
          You scored{" "}
          <span className="font-mono font-medium text-foreground tabular-nums">
            {existingScore}/{questions.length}
          </span>
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIdx];

  const handleNext = async () => {
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setIsSubmitting(true);
      const finalScore =
        selectedOption === currentQuestion.correctAnswer ? score + 1 : score;
      await submitQuizScore(quizId, finalScore, chapterId, courseId);
      setIsSubmitting(false);
    }
  };

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4 font-mono text-xs text-muted-foreground">
        <span>
          Question {currentQuestionIdx + 1}/{questions.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {questions.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= currentQuestionIdx ? "bg-primary" : "bg-foreground/10"}`}
          />
        ))}
      </div>

      <h3 className="mt-6 text-lg leading-snug font-semibold text-pretty sm:text-xl">
        {currentQuestion.questionText}
      </h3>

      <div role="radiogroup" aria-label="Answer options" className="mt-5 space-y-2.5">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isAnswer = index === currentQuestion.correctAnswer;

          // States carry a border weight, an icon and a text label, not only color
          let optionStyle = "border-foreground/15 hover:border-foreground/40 hover:bg-muted/50";
          let markerStyle = "border-foreground/25 text-muted-foreground";
          let note: string | null = null;

          if (showResult) {
            if (isAnswer) {
              optionStyle = "border-success bg-success/10 ring-1 ring-success";
              markerStyle = "border-success bg-success text-primary-foreground";
              note = isSelected ? "Your answer, correct" : "Correct answer";
            } else if (isSelected) {
              optionStyle = "border-destructive bg-destructive/5 ring-1 ring-destructive";
              markerStyle = "border-destructive bg-destructive text-primary-foreground";
              note = "Your answer, wrong";
            } else {
              optionStyle = "border-border text-muted-foreground";
              markerStyle = "border-border text-muted-foreground";
            }
          } else if (isSelected) {
            optionStyle = "border-foreground bg-muted ring-1 ring-foreground";
            markerStyle = "border-foreground bg-foreground text-background";
          }

          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={showResult}
              onClick={() => !showResult && setSelectedOption(index)}
              className={`flex min-h-12 w-full items-start gap-3 rounded-lg border p-3.5 text-left text-[0.9375rem] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${showResult ? "cursor-default" : "cursor-pointer"} ${optionStyle}`}
            >
              <span
                aria-hidden
                className={`mt-px flex size-6 shrink-0 items-center justify-center rounded-sm border font-mono text-xs font-medium ${markerStyle}`}
              >
                {showResult && isAnswer ? (
                  <Check weight="bold" className="size-3.5" />
                ) : showResult && isSelected ? (
                  <X weight="bold" className="size-3.5" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span className="min-w-0 flex-1 leading-snug font-medium">
                {option}
                {note && (
                  <span className="mt-1 block font-mono text-xs font-normal text-foreground/80">
                    {note}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-6">
          {showResult && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {isCorrect ? (
                <CheckCircle weight="fill" className="size-5 shrink-0 text-success" aria-hidden />
              ) : (
                <XCircle weight="fill" className="size-5 shrink-0 text-destructive" aria-hidden />
              )}
              {isCorrect
                ? "Correct."
                : `Not quite. The answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`}
            </motion.p>
          )}
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => {
            if (!showResult) setShowResult(true);
            else handleNext();
          }}
          disabled={selectedOption === null || isSubmitting}
        >
          {isSubmitting && <Spinner />}
          {isSubmitting
            ? "Saving..."
            : !showResult
              ? "Check answer"
              : currentQuestionIdx === questions.length - 1
                ? "Finish quiz"
                : "Next question"}
        </Button>
      </div>
    </div>
  );
}

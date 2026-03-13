"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { submitQuizScore } from "@/lib/actions/quiz.actions";
import { Spinner } from "@/components/ui/spinner"; // Import shadcn spinner

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

  if (existingScore !== null) {
    return (
      <div className="p-8 border rounded-2xl bg-green-500/10 border-green-500/20 text-center space-y-2 mt-8">
        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
          Quiz Completed!
        </h3>
        <p className="text-muted-foreground">
          You scored {existingScore} out of {questions.length}
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

  return (
    <div className="p-8 border rounded-2xl bg-card mt-8 space-y-6">
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-4">
        <span>
          Question {currentQuestionIdx + 1} of {questions.length}
        </span>
        <span>Score: {score}</span>
      </div>

      <h3 className="text-xl font-semibold">{currentQuestion.questionText}</h3>

      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          // Color logic for correct vs wrong answers
          let optionStyle = "border-border hover:border-primary/50";

          if (showResult) {
            if (index === currentQuestion.correctAnswer) {
              optionStyle =
                "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"; // Always Green
            } else if (selectedOption === index) {
              optionStyle =
                "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"; // User's wrong pick is Red
            } else {
              optionStyle = "opacity-50 border-border";
            }
          } else if (selectedOption === index) {
            optionStyle = "border-primary bg-primary/10"; // Selected state before checking
          }

          return (
            <div
              key={index}
              onClick={() => !showResult && setSelectedOption(index)}
              className={`p-4 border rounded-xl cursor-pointer transition-all font-medium ${optionStyle}`}
            >
              {option}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => {
            if (!showResult) setShowResult(true);
            else handleNext();
          }}
          disabled={selectedOption === null || isSubmitting}
        >
          {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
          {isSubmitting
            ? "Saving..."
            : !showResult
              ? "Check Answer"
              : currentQuestionIdx === questions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
        </Button>
      </div>
    </div>
  );
}

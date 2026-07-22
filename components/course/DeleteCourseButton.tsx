"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { deleteCourse } from "@/lib/actions/course.actions";

export default function DeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this course? All chapters, quizzes, and progress will be permanently lost.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCourse(courseId);
        // Redirect back to the dashboard after successful deletion
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        console.error("Failed to delete course", error);
        alert("Failed to delete the course. Please try again.");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Spinner className="w-4 h-4 mr-2" />
      ) : (
        <Trash2 className="w-4 h-4 mr-2" />
      )}
      {isPending ? "Deleting..." : "Delete Course"}
    </Button>
  );
}

import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import StudyBuddyInteractive from "@/components/StudyBuddyInteractive";

interface StudyBuddyPageProps {
  params: Promise<{ courseId: string }>;
}

const StudyBuddyPage = async ({ params }: StudyBuddyPageProps) => {
  const { courseId } = await params;

  // Fetch course and its structure for AI context
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.order)],
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Generate a text summary of the course structure to feed to the Study Buddy
  const courseStructureString = course.chapters
    .map((c) => `Chapter ${c.order}: ${c.title} - ${c.content}`)
    .join(" | ");

  return (
    <div className="bg-background">
      <StudyBuddyInteractive
        courseId={course.id}
        courseTopic={course.topic}
        courseStructure={courseStructureString}
      />
    </div>
  );
};

export default StudyBuddyPage;

import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DashboardClient from "@/components/DashboardClient";
import { syncUserToDatabase } from "@/lib/actions/syncUser";

const Dashboard = async () => {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  await syncUserToDatabase();

  // Fetch the user's generated courses
  const userCourses = await db.query.courses.findMany({
    where: eq(courses.author, userId),
    orderBy: [desc(courses.createdAt)],
    with: {
      chapters: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your AI learning journeys.
          </p>
        </div>
        <Link href="/courses/new">
          <Button size="lg">Create New Course</Button>
        </Link>
      </div>

      {userCourses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border rounded-xl bg-card">
          <p>You haven't generated any courses yet.</p>
        </div>
      ) : (
        <DashboardClient initialCourses={userCourses} />
      )}
    </div>
  );
};

export default Dashboard;

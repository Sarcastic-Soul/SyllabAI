import CourseForm from "@/components/course/CourseForm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Lock } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

const FREE_COURSE_LIMIT = 2; // Set your free tier limit here

const NewCoursePage = async () => {
    const { userId, has } = await auth();

    if (!userId) {
        return null; // Or redirect to sign-in
    }

    // 1. Check if the user has a pro plan via Clerk
    const isPro = has({ plan: "pro" }); // Ensure "pro" matches the slug in your Clerk dashboard

    // 2. Fetch the number of courses they have generated from your database
    const userRecord = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
            coursesGenerated: true,
        },
    });

    const coursesCount = userRecord?.coursesGenerated || 0;

    // 3. Determine if they are locked out
    const hasReachedLimit = !isPro && coursesCount >= FREE_COURSE_LIMIT;

    return (
        <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold sm:text-4xl">New course</h1>
                <p className="max-w-[55ch] leading-relaxed text-muted-foreground">
                    Give a topic or upload your notes. You get a chapter list
                    first, then you generate each lesson, quiz and flashcard set
                    when you reach it.
                </p>
                {!isPro && !hasReachedLimit && (
                    <p className="font-mono text-xs text-muted-foreground">
                        {coursesCount}/{FREE_COURSE_LIMIT} free courses used
                    </p>
                )}
            </header>

            <div className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
                {hasReachedLimit ? (
                    <div className="py-4">
                        <Lock className="size-7 text-muted-foreground" aria-hidden />
                        <h2 className="mt-4 text-xl font-semibold">
                            You have used your free courses
                        </h2>
                        <p className="mt-2 max-w-[50ch] leading-relaxed text-muted-foreground">
                            You have generated {coursesCount} out of{" "}
                            {FREE_COURSE_LIMIT} free courses. Pro has no course
                            limit. Your existing courses stay available either
                            way.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button asChild size="lg">
                                <Link href="/subscription">See Pro plan</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/dashboard">Back to courses</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <CourseForm />
                )}
            </div>
        </main>
    );
};

export default NewCoursePage;

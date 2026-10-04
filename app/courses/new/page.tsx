import CourseForm from "@/components/course/CourseForm";
import { getUserId } from "@/lib/auth/session";
import { resolvePlan } from "@/lib/billing/plan";
import { FREE_COURSE_LIMIT } from "@/lib/billing/config";
import { db } from "@/lib/db";
import { courses, users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { Lock } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

const NewCoursePage = async () => {
    const userId = await getUserId();

    if (!userId) {
        return null; // Or redirect to sign-in
    }

    // 1. Plan and the number of courses the user has right now. Same count
    // as the API check, so deleting a course frees a slot.
    const [userRecord, [courseRow]] = await Promise.all([
        db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                subscriptionPlan: true,
                proUntil: true,
            },
        }),
        db.select({ value: count() }).from(courses).where(eq(courses.author, userId)),
    ]);

    const { isPro } = resolvePlan(userRecord);
    const coursesCount = courseRow?.value ?? 0;

    // 2. Determine if they are locked out
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
                        {coursesCount}/{FREE_COURSE_LIMIT} free course slots used
                    </p>
                )}
            </header>

            <div className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-8">
                {hasReachedLimit ? (
                    <div className="py-4">
                        <Lock className="size-7 text-muted-foreground" aria-hidden />
                        <h2 className="mt-4 text-xl font-semibold">
                            Your {FREE_COURSE_LIMIT} free course slots are full
                        </h2>
                        <p className="mt-2 max-w-[50ch] leading-relaxed text-muted-foreground">
                            The Basic plan holds {FREE_COURSE_LIMIT} courses at a
                            time. Delete one from your dashboard to make room,
                            or get Pro for no course limit.
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

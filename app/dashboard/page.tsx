import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { getUserCourses, getUserDb } from "@/lib/queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import DashboardClient from "@/components/dashboard/DashboardClient";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { syncUserToDatabase } from "@/lib/actions/syncUser";

const Dashboard = async () => {
    const { userId } = await auth();

    if (!userId) {
        return (
            <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                <p className="text-muted-foreground">
                    Sign in to see your courses.{" "}
                    <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
                        Sign in
                    </Link>
                </p>
            </main>
        );
    }

    const cookieStore = await cookies();
    const hasSynced = cookieStore.get("user_synced");

    if (!hasSynced) {
        await syncUserToDatabase();
    }

    const userDb = await getUserDb(userId);

    // Fetch the user's generated courses
    const userCourses = await getUserCourses(userId);

    const courseCount = userCourses.length;

    return (
        <main className="mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold sm:text-4xl">Your courses</h1>
                    <p className="mt-1.5 text-muted-foreground">
                        {courseCount === 0
                            ? "Nothing here yet. Start with a topic or a PDF."
                            : `${courseCount} ${courseCount === 1 ? "course" : "courses"}. Pick one to keep going.`}
                    </p>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/courses/new">
                        <Plus />
                        New course
                    </Link>
                </Button>
            </header>

            {courseCount === 0 ? (
                <section className="rounded-xl border border-dashed border-foreground/25 px-6 py-14 sm:px-10">
                    <h2 className="text-xl font-semibold">Make your first course</h2>
                    <p className="mt-2 max-w-[55ch] leading-relaxed text-muted-foreground">
                        Type a topic or upload a PDF up to 4 MB. You get chapter
                        lessons, a quiz for each chapter and flashcards to review
                        later.
                    </p>
                    <Button asChild variant="outline" className="mt-6">
                        <Link href="/courses/new">
                            <Plus />
                            New course
                        </Link>
                    </Button>
                </section>
            ) : (
                <>
                    <DashboardStats userCourses={userCourses} userDb={userDb || undefined} />
                    <DashboardClient initialCourses={userCourses} />
                </>
            )}
        </main>
    );
};

export default Dashboard;

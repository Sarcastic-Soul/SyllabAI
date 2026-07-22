import CourseForm from "@/components/course/CourseForm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
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
        <div className="max-w-3xl mx-auto p-6 space-y-8 mt-10">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                    Design Your Learning Path
                </h1>
                <p className="text-lg text-muted-foreground">
                    Tell us what you want to learn, your skill level, and how
                    much time you have. Our AI will generate a highly structured
                    curriculum just for you.
                </p>
            </div>

            <div className="p-8 border rounded-2xl bg-card shadow-sm mt-8">
                {hasReachedLimit ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                        <div className="p-4 bg-muted rounded-full">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-semibold">
                            Limit Reached
                        </h2>
                        <p className="text-muted-foreground max-w-md">
                            You have generated {coursesCount} out of{" "}
                            {FREE_COURSE_LIMIT} free courses. Upgrade to our Pro
                            plan to generate unlimited courses and unlock more
                            features.
                        </p>
                        <Link href="/subscription">
                            <Button size="lg" className="mt-4">
                                Upgrade to Pro
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <CourseForm />
                )}
            </div>
        </div>
    );
};

export default NewCoursePage;

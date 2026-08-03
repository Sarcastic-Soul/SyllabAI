import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { getUserCourses, getUserDb } from "@/lib/queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardClient from "@/components/dashboard/DashboardClient";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { syncUserToDatabase } from "@/lib/actions/syncUser";

const Dashboard = async () => {
    const { userId } = await auth();

    if (!userId) {
        return <div>Please sign in to view your dashboard.</div>;
    }

    const cookieStore = await cookies();
    const hasSynced = cookieStore.get("user_synced");

    if (!hasSynced) {
        await syncUserToDatabase();
    }

    const userDb = await getUserDb(userId);

    // Fetch the user's generated courses
    const userCourses = await getUserCourses(userId);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-bold">My Courses</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track your AI learning journeys.
                    </p>
                </div>
                <Link href="/courses/new">
                    <Button size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Course
                    </Button>
                </Link>
            </div>

            <DashboardStats userCourses={userCourses} userDb={userDb || undefined} />

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

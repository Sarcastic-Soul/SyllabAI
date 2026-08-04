import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDailyQuotaStatus } from "@/lib/quota";

const ADMIN_EMAIL = "anishisbusy@gmail.com";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    const primaryEmail =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress || user?.emailAddresses[0]?.emailAddress;

    if (!userId || !primaryEmail || primaryEmail.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const quota = await getDailyQuotaStatus();
    return NextResponse.json(quota);
  } catch (error: any) {
    console.error("Error fetching quota status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quota status" },
      { status: 500 }
    );
  }
}

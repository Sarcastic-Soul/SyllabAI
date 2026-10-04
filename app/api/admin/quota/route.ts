import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDailyQuotaStatus } from "@/lib/quota";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const quota = await getDailyQuotaStatus();
    return NextResponse.json(quota);
  } catch (error) {
    console.error("Error fetching quota status:", error);
    return NextResponse.json(
      { error: (error instanceof Error && error.message) || "Failed to fetch quota status" },
      { status: 500 }
    );
  }
}

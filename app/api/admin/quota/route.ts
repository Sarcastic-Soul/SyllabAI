import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDailyQuotaStatus } from "@/lib/quota";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

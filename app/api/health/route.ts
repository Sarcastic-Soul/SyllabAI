import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
    let databaseStatus = "disconnected";

    try {
        await db.execute(sql`SELECT 1`);
        databaseStatus = "connected";
    } catch (e) {
        console.error("Health check database query failed:", e);
    }

    const isHealthy = databaseStatus === "connected";

    return NextResponse.json(
        {
            status: isHealthy ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            services: {
                database: databaseStatus,
            },
        },
        { status: isHealthy ? 200 : 503 }
    );
}

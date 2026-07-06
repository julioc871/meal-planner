import { getAppSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");

  if (!weekStart) {
    return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  }

  // Find or create the meal plan for this week
  const mealPlan = await db.mealPlan.upsert({
    where: {
      householdId_weekStart: {
        householdId: session.user.householdId,
        weekStart: new Date(weekStart),
      },
    },
    update: {},
    create: {
      householdId: session.user.householdId,
      weekStart: new Date(weekStart),
    },
    include: {
      meals: {
        include: {
          recipe: true,
        },
      },
    },
  });

  return NextResponse.json(mealPlan);
}
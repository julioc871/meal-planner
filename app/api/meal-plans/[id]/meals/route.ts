import { getAppSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { recipeId, dayOfWeek, slot, servings } = await req.json();

  const meal = await db.plannedMeal.create({
    data: {
      mealPlanId: id,
      recipeId,
      dayOfWeek,
      slot,
      servings: servings ?? 4,
    },
    include: { recipe: true },
  });

  return NextResponse.json(meal, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mealId } = await req.json();

  await db.plannedMeal.delete({
    where: { id: mealId },
  });

  return NextResponse.json({ success: true });
}
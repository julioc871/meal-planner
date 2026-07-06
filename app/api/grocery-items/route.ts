import { getAppSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groceryListId, ingredientName, quantity, unit, category } = await req.json();

  // Make sure the grocery list belongs to this household
  const groceryList = await db.groceryList.findFirst({
    where: {
      id: groceryListId,
      mealPlan: { householdId: session.user.householdId },
    },
  });

  if (!groceryList) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await db.groceryItem.create({
    data: {
      groceryListId,
      ingredientName,
      quantity: quantity ? Number(quantity) : 1,
      unit: unit || "PIECE",
      category: category || "Other",
      checked: false,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
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

  // Load the meal plan with all planned meals and their recipe ingredients
  const mealPlan = await db.mealPlan.findFirst({
    where: { id, householdId: session.user.householdId },
    include: {
      meals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: {
                    include: { category: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mealPlan) {
    return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
  }

  // Aggregate ingredients across all planned meals
  const aggregated: Record<string, {
    ingredientName: string;
    quantity: number;
    unit: string;
    category: string;
    sortOrder: number;
  }> = {};

  for (const meal of mealPlan.meals) {
    const scalingFactor = meal.servings / meal.recipe.baseServings;

    for (const ri of meal.recipe.ingredients) {
      // Use imperial quantities as the default
      const key = `${ri.ingredient.name}__${ri.unitImperial}`;
      const quantity = ri.quantityImperial * scalingFactor;

      if (aggregated[key]) {
        aggregated[key].quantity += quantity;
      } else {
        aggregated[key] = {
          ingredientName: ri.ingredient.name,
          quantity,
          unit: ri.unitImperial,
          category: ri.ingredient.category?.name ?? "Other",
          sortOrder: ri.ingredient.category?.sortOrder ?? 99,
        };
      }
    }
  }

  // Delete existing grocery list if one exists
  await db.groceryList.deleteMany({ where: { mealPlanId: id } });

  // Save the new grocery list
  const groceryList = await db.groceryList.create({
    data: {
      mealPlanId: id,
      items: {
        create: Object.values(aggregated).map((item) => ({
          ingredientName: item.ingredientName,
          quantity: Math.round(item.quantity * 100) / 100,
          unit: item.unit as any,
          category: item.category,
          checked: false,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  return NextResponse.json(groceryList);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const groceryList = await db.groceryList.findUnique({
    where: { mealPlanId: id },
    include: { items: true },
  });

  return NextResponse.json(groceryList);
}
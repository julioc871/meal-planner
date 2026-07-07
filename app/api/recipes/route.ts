import { getAppSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipes = await db.recipe.findMany({
    where: { householdId: session.user.householdId },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recipes);
}

export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, instructions, baseServings, ingredients } = body;

  const recipe = await db.recipe.create({
    data: {
      name,
      instructions,
      baseServings: Number(baseServings),
      householdId: session.user.householdId,
      ingredients: {
        create: await Promise.all(
          ingredients.map(async (ing: any) => {
            const ingredient = await db.ingredient.upsert({
              where: { name: ing.name.toLowerCase().trim() },
              update: {},
              create: {
                name: ing.name.toLowerCase().trim(),
                categoryId: ing.categoryId || null,
              },
            });

            return {
              ingredientId: ingredient.id,
              quantityMetric: Number(ing.quantityMetric),
              unitMetric: ing.unitMetric,
              quantityImperial: Number(ing.quantityImperial),
              unitImperial: ing.unitImperial,
              notes: ing.notes || null,
            };
          })
        ),
      },
    },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
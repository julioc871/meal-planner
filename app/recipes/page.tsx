import { db } from "@/lib/db";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAppSession } from "@/lib/session";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAppSession();
  if (!session?.user?.householdId) redirect("/");

  const { id } = await params;

  const recipe = await db.recipe.findFirst({
    where: { id, householdId: session.user.householdId },
    include: {
      ingredients: {
        include: { ingredient: { include: { category: true } } },
      },
    },
  });

  if (!recipe) notFound();

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <Link href="/recipes" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>
        ← Back to Recipes
      </Link>

      <h1 style={{ marginTop: "0.5rem" }}>{recipe.name}</h1>
      <p style={{ color: "gray" }}>Serves {recipe.baseServings}</p>

      <h2 style={{ marginTop: "1.5rem" }}>Ingredients</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Ingredient</th>
            <th style={{ padding: "0.5rem" }}>Metric</th>
            <th style={{ padding: "0.5rem" }}>Imperial</th>
            <th style={{ padding: "0.5rem" }}>Notes</th>
            <th style={{ padding: "0.5rem" }}>Category</th>
          </tr>
        </thead>
        <tbody>
          {recipe.ingredients.map((ri) => (
            <tr key={ri.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem", fontWeight: 500 }}>{ri.ingredient.name}</td>
              <td style={{ padding: "0.5rem" }}>{ri.quantityMetric} {ri.unitMetric}</td>
              <td style={{ padding: "0.5rem" }}>{ri.quantityImperial} {ri.unitImperial}</td>
              <td style={{ padding: "0.5rem", color: "gray" }}>{ri.notes ?? "—"}</td>
              <td style={{ padding: "0.5rem", color: "gray" }}>{ri.ingredient.category?.name ?? "Uncategorized"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {recipe.instructions && (
        <>
          <h2 style={{ marginTop: "1.5rem" }}>Instructions</h2>
          <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{recipe.instructions}</p>
        </>
      )}
    </main>
  );
}
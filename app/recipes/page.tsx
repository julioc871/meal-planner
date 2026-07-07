import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";

export default async function RecipesPage() {
  const session = await getAppSession();
  if (!session?.user?.householdId) redirect("/");

  const recipes = await db.recipe.findMany({
    where: { householdId: session.user.householdId },
    include: { ingredients: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/calendar" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to Calendar
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Recipes</h1>
        <Link
          href="/recipes/new"
          style={{
            background: "#16a34a",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          + New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p style={{ color: "gray", marginTop: "2rem" }}>
          No recipes yet. Create your first one!
        </p>
      ) : (
        <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{
                display: "block",
                padding: "1rem 1.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{recipe.name}</h2>
              <p style={{ margin: "0.25rem 0 0", color: "gray", fontSize: "0.9rem" }}>
                {recipe.ingredients.length} ingredients · serves {recipe.baseServings}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
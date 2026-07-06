"use client";

import { useEffect, useState, useCallback } from "react";
import RecipePicker from "../components/RecipePicker";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOTS = ["BREAKFAST", "LUNCH", "DINNER"] as const;
const SLOT_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

type Recipe = { id: string; name: string; baseServings: number };
type PlannedMeal = { id: string; recipeId: string; dayOfWeek: number; slot: string; servings: number; recipe: Recipe };
type MealPlan = { id: string; meals: PlannedMeal[] };

function getSundayOf(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(sunday: Date): string {
  const saturday = new Date(sunday);
  saturday.setDate(saturday.getDate() + 6);
  return `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${saturday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getSundayOf(new Date()));
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerCell, setPickerCell] = useState<{ day: number; slot: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [planRes, recipesRes] = await Promise.all([
      fetch(`/api/meal-plans?weekStart=${weekStart.toISOString()}`),
      fetch("/api/recipes"),
    ]);
    const [plan, recipeList] = await Promise.all([planRes.json(), recipesRes.json()]);
    setMealPlan(plan);
    setRecipes(recipeList);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const goToPrevWeek = () => {
    setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
  };

  const getMeal = (day: number, slot: string): PlannedMeal | undefined =>
    mealPlan?.meals.find((m) => m.dayOfWeek === day && m.slot === slot);

  const handleCellClick = (day: number, slot: string) => {
    const existing = getMeal(day, slot);
    if (existing) return; // already has a meal — click X to remove instead
    setPickerCell({ day, slot });
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!pickerCell || !mealPlan) return;
    setPickerCell(null);

    const res = await fetch(`/api/meal-plans/${mealPlan.id}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId: recipe.id,
        dayOfWeek: pickerCell.day,
        slot: pickerCell.slot,
        servings: recipe.baseServings,
      }),
    });

    if (res.ok) fetchData();
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (!mealPlan) return;
    await fetch(`/api/meal-plans/${mealPlan.id}/meals`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealId }),
    });
    fetchData();
  };

  return (
    <main style={{ padding: "1.5rem", fontFamily: "sans-serif", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>📅 Meal Calendar</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/recipes" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem", padding: "0.4rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
            Recipes
          </Link>
          <Link href="/grocery-list" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem", padding: "0.4rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
            🛒 Grocery List
          </Link>
        </div>
      </div>

      {/* Week navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={goToPrevWeek} style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid #e5e7eb", cursor: "pointer", background: "white" }}>← Prev</button>
        <span style={{ fontWeight: 600, fontSize: "1rem" }}>{formatWeekLabel(weekStart)}</span>
        <button onClick={goToNextWeek} style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid #e5e7eb", cursor: "pointer", background: "white" }}>Next →</button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <p style={{ color: "gray" }}>Loading...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr>
                <th style={{ width: "90px", padding: "0.5rem", background: "#f9fafb", border: "1px solid #e5e7eb" }}></th>
                {DAYS.map((day) => (
                  <th key={day} style={{ padding: "0.75rem 0.5rem", background: "#f9fafb", border: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.9rem", textAlign: "center" }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot}>
                  <td style={{ padding: "0.75rem 0.5rem", background: "#f9fafb", border: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.85rem", textAlign: "center", color: "#374151" }}>
                    {SLOT_LABELS[slot]}
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const meal = getMeal(dayIndex, slot);
                    return (
                      <td
                        key={dayIndex}
                        onClick={() => handleCellClick(dayIndex, slot)}
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #e5e7eb",
                          verticalAlign: "top",
                          height: "80px",
                          cursor: meal ? "default" : "pointer",
                          background: meal ? "#f0fdf4" : "white",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!meal) (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (!meal) (e.currentTarget as HTMLElement).style.background = "white"; }}
                      >
                        {meal ? (
                          <div style={{ position: "relative" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#15803d" }}>
                              {meal.recipe.name}
                            </span>
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "gray" }}>serves {meal.servings}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveMeal(meal.id); }}
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: "none",
                                border: "none",
                                color: "#9ca3af",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                lineHeight: 1,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: "0.8rem" }}>+ Add</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipe picker modal */}
      {pickerCell && (
        <RecipePicker
          recipes={recipes}
          onSelect={handleSelectRecipe}
          onClose={() => setPickerCell(null)}
        />
      )}
    </main>
  );
}
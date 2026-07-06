"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const UNITS_METRIC = ["GRAM", "KILOGRAM", "MILLILITER", "LITER", "TEASPOON", "TABLESPOON", "CUP", "PIECE", "CLOVE", "PINCH"];
const UNITS_IMPERIAL = ["OUNCE", "POUND", "FLUID_OUNCE", "TEASPOON", "TABLESPOON", "CUP", "PIECE", "CLOVE", "PINCH"];

type Ingredient = {
  name: string;
  quantityMetric: string;
  unitMetric: string;
  quantityImperial: string;
  unitImperial: string;
  notes: string;
};

const emptyIngredient = (): Ingredient => ({
  name: "",
  quantityMetric: "",
  unitMetric: "GRAM",
  quantityImperial: "",
  unitImperial: "OUNCE",
  notes: "",
});

export default function NewRecipePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [baseServings, setBaseServings] = useState("4");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);

  const removeIngredient = (index: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Recipe name is required"); return; }
    if (ingredients.some((i) => !i.name.trim())) { setError("All ingredients need a name"); return; }

    setSaving(true);
    setError("");

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, baseServings, instructions, ingredients }),
    });

    if (res.ok) {
      const recipe = await res.json();
      router.push(`/recipes/${recipe.id}`);
    } else {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>New Recipe</h1>

      {error && (
        <p style={{ color: "red", background: "#fee2e2", padding: "0.75rem", borderRadius: "6px" }}>
          {error}
        </p>
      )}

      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
            Recipe Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Burgers"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "1rem" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
            Base Servings
          </label>
          <input
            type="number"
            value={baseServings}
            onChange={(e) => setBaseServings(e.target.value)}
            min="1"
            style={{ width: "100px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "1rem" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step by step instructions..."
            rows={5}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "1rem" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.75rem" }}>
            Ingredients
          </label>

          {ingredients.map((ing, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "0.75rem",
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <strong style={{ fontSize: "0.9rem" }}>Ingredient {index + 1}</strong>
                {ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(index)}
                    style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                value={ing.name}
                onChange={(e) => updateIngredient(index, "name", e.target.value)}
                placeholder="Ingredient name (e.g. ground beef)"
                style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", marginBottom: "0.5rem", fontSize: "0.95rem" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "gray" }}>Metric quantity</label>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <input
                      type="number"
                      value={ing.quantityMetric}
                      onChange={(e) => updateIngredient(index, "quantityMetric", e.target.value)}
                      placeholder="0"
                      style={{ width: "70px", padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                    <select
                      value={ing.unitMetric}
                      onChange={(e) => updateIngredient(index, "unitMetric", e.target.value)}
                      style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      {UNITS_METRIC.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "gray" }}>Imperial quantity</label>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <input
                      type="number"
                      value={ing.quantityImperial}
                      onChange={(e) => updateIngredient(index, "quantityImperial", e.target.value)}
                      placeholder="0"
                      style={{ width: "70px", padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                    <select
                      value={ing.unitImperial}
                      onChange={(e) => updateIngredient(index, "unitImperial", e.target.value)}
                      style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    >
                      {UNITS_IMPERIAL.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <input
                value={ing.notes}
                onChange={(e) => updateIngredient(index, "notes", e.target.value)}
                placeholder="Notes (e.g. diced, room temperature)"
                style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
              />
            </div>
          ))}

          <button
            onClick={addIngredient}
            style={{
              background: "none",
              border: "1px dashed #9ca3af",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              color: "#6b7280",
              width: "100%",
            }}
          >
            + Add Ingredient
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: saving ? "#9ca3af" : "#16a34a",
            color: "white",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "none",
            fontSize: "1rem",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {saving ? "Saving..." : "Save Recipe"}
        </button>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type GroceryItem = {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
};

type GroceryList = {
  id: string;
  items: GroceryItem[];
};

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

export default function GroceryListPage() {
  const [weekStart] = useState<Date>(() => getSundayOf(new Date()));
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Custom item form state
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customCategory, setCustomCategory] = useState("Other");
  const [addingCustom, setAddingCustom] = useState(false);

  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/meal-plans?weekStart=${weekStart.toISOString()}`);
    const plan = await res.json();
    setMealPlanId(plan.id);

    const listRes = await fetch(`/api/meal-plans/${plan.id}/grocery-list`);
    const list = await listRes.json();
    setGroceryList(list);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchMealPlan(); }, [fetchMealPlan]);

  const generateList = async () => {
    if (!mealPlanId) return;
    setGenerating(true);
    const res = await fetch(`/api/meal-plans/${mealPlanId}/grocery-list`, {
      method: "POST",
    });
    const list = await res.json();
    setGroceryList(list);
    setGenerating(false);
  };

  const toggleItem = async (item: GroceryItem) => {
    setGroceryList((prev) =>
      prev
        ? { ...prev, items: prev.items.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i) }
        : prev
    );
    await fetch(`/api/grocery-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
  };

  const deleteItem = async (itemId: string) => {
    setGroceryList((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev
    );
    await fetch(`/api/grocery-items/${itemId}`, { method: "DELETE" });
  };

  const addCustomItem = async () => {
    if (!customName.trim() || !groceryList) return;
    setAddingCustom(true);

    const res = await fetch("/api/grocery-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groceryListId: groceryList.id,
        ingredientName: customName.trim(),
        quantity: customQty || 1,
        unit: customUnit || "PIECE",
        category: customCategory || "Other",
      }),
    });

    if (res.ok) {
      const newItem = await res.json();
      setGroceryList((prev) =>
        prev ? { ...prev, items: [...prev.items, newItem] } : prev
      );
      setCustomName("");
      setCustomQty("");
      setCustomUnit("");
      setCustomCategory("Other");
    }

    setAddingCustom(false);
  };

  const grouped = groceryList?.items.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const checkedCount = groceryList?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = groceryList?.items.length ?? 0;

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/calendar" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to Calendar
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>🛒 Grocery List</h1>
        <button
          onClick={generateList}
          disabled={generating}
          style={{
            background: generating ? "#9ca3af" : "#16a34a",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            cursor: generating ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {generating ? "Generating..." : "↻ Regenerate"}
        </button>
      </div>

      <p style={{ color: "gray", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Week of {formatWeekLabel(weekStart)}
      </p>

      {loading ? (
        <p style={{ color: "gray" }}>Loading...</p>
      ) : !groceryList || groceryList.items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "gray" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>No grocery list yet.</p>
          <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Plan your meals on the calendar first, then generate your list.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href="/calendar" style={{ background: "#16a34a", color: "white", padding: "0.5rem 1rem", borderRadius: "6px", textDecoration: "none" }}>
              Go to Calendar
            </Link>
            <button
              onClick={generateList}
              disabled={generating}
              style={{ background: "#2563eb", color: "white", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer" }}
            >
              Generate Anyway
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          {totalCount > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "gray", marginBottom: "0.25rem" }}>
                <span>{checkedCount} of {totalCount} items checked</span>
                <span>{Math.round((checkedCount / totalCount) * 100)}%</span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: "99px", height: "8px" }}>
                <div style={{ background: "#16a34a", borderRadius: "99px", height: "8px", width: `${(checkedCount / totalCount) * 100}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {/* Grouped items */}
          {Object.entries(grouped ?? {}).map(([category, items]) => (
            <div key={category} style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                {category}
              </h2>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderTop: index > 0 ? "1px solid #f3f4f6" : "none",
                      background: item.checked ? "#f9fafb" : "white",
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleItem(item)}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        border: item.checked ? "none" : "2px solid #d1d5db",
                        background: item.checked ? "#16a34a" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      {item.checked && <span style={{ color: "white", fontSize: "0.75rem" }}>✓</span>}
                    </div>

                    {/* Name */}
                    <span
                      onClick={() => toggleItem(item)}
                      style={{
                        flex: 1,
                        fontSize: "0.95rem",
                        textDecoration: item.checked ? "line-through" : "none",
                        color: item.checked ? "#9ca3af" : "#111827",
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    >
                      {item.ingredientName}
                    </span>

                    {/* Quantity */}
                    <span style={{ fontSize: "0.85rem", color: "gray" }}>
                      {item.quantity} {item.unit.toLowerCase()}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#d1d5db",
                        cursor: "pointer",
                        fontSize: "1rem",
                        lineHeight: 1,
                        padding: "0 0.25rem",
                      }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add custom item */}
      {groceryList && (
        <div style={{ marginTop: "2rem", border: "1px dashed #d1d5db", borderRadius: "8px", padding: "1rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem", margin: "0 0 0.75rem" }}>
            + Add Custom Item
          </h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
              placeholder="Item name (e.g. Paper towels)"
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <input
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="Qty (e.g. 2)"
                type="number"
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
              />
              <input
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Unit (e.g. pack)"
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
              >
                <option>Produce</option>
                <option>Meat & Seafood</option>
                <option>Dairy & Eggs</option>
                <option>Bakery & Bread</option>
                <option>Pantry & Dry Goods</option>
                <option>Canned & Jarred</option>
                <option>Frozen</option>
                <option>Condiments & Sauces</option>
                <option>Spices & Seasonings</option>
                <option>Oils & Vinegars</option>
                <option>Beverages</option>
                <option>Snacks</option>
                <option>Other</option>
              </select>
            </div>
            <button
              onClick={addCustomItem}
              disabled={addingCustom || !customName.trim()}
              style={{
                background: addingCustom || !customName.trim() ? "#9ca3af" : "#2563eb",
                color: "white",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "none",
                cursor: addingCustom || !customName.trim() ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {addingCustom ? "Adding..." : "Add to List"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
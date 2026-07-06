"use client";

type Recipe = {
  id: string;
  name: string;
  baseServings: number;
};

type Props = {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  onClose: () => void;
};

export default function RecipePicker({ recipes, onSelect, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          width: "400px",
          maxHeight: "500px",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Pick a Recipe</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "gray" }}
          >
            ✕
          </button>
        </div>

        {recipes.length === 0 ? (
          <p style={{ color: "gray", textAlign: "center" }}>
            No recipes yet. <a href="/recipes/new">Create one first!</a>
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelect(recipe)}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                {recipe.name}
                <span style={{ color: "gray", fontSize: "0.8rem", fontWeight: 400, marginLeft: "0.5rem" }}>
                  serves {recipe.baseServings}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
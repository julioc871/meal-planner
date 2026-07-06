import { getAppSession } from "@/lib/session";
import { signIn, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getAppSession();

  if (!session) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🥗 Meal Planner</h1>
        <p style={{ color: "gray", marginBottom: "2rem" }}>Plan your week, build your grocery list.</p>
        <form action={async () => { "use server"; await signIn("google"); }}>
          <button type="submit" style={{ background: "#16a34a", color: "white", padding: "0.75rem 2rem", borderRadius: "8px", border: "none", fontSize: "1rem", cursor: "pointer", fontWeight: 600 }}>
            Sign in with Google
          </button>
        </form>
      </main>
    );
  }

  // If signed in, send them straight to the app
  redirect("/recipes");
}
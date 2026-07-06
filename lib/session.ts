import { auth } from "@/auth";

export type AppSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    householdId: string | null;
  };
};

export async function getAppSession(): Promise<AppSession | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session as unknown as AppSession;
}
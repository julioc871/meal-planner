import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const dbUser = await db.user.upsert({
        where: { email: user.email },
        update: { name: user.name ?? undefined },
        create: {
          email: user.email,
          name: user.name ?? "New User",
        },
      });

      const existingMembership = await db.householdMember.findFirst({
        where: { userId: dbUser.id },
      });

      if (!existingMembership) {
        const household = await db.household.create({
          data: { name: `${user.name ?? user.email}'s Household` },
        });
        await db.householdMember.create({
          data: {
            userId: dbUser.id,
            householdId: household.id,
            role: "owner",
          },
        });
      }

      return true;
    },

    async session({ session }) {
      if (!session.user.email) return session;

      const dbUser = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
          households: {
            include: { household: true },
            take: 1,
          },
        },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
       (session.user as any).householdId = dbUser.households[0]?.householdId ?? null;
      }

      return session;
    },
  },
});
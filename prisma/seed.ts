import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding ingredient categories...");

  const categories = [
    { name: "Produce",             sortOrder: 1 },
    { name: "Meat & Seafood",      sortOrder: 2 },
    { name: "Dairy & Eggs",        sortOrder: 3 },
    { name: "Bakery & Bread",      sortOrder: 4 },
    { name: "Pantry & Dry Goods",  sortOrder: 5 },
    { name: "Canned & Jarred",     sortOrder: 6 },
    { name: "Frozen",              sortOrder: 7 },
    { name: "Condiments & Sauces", sortOrder: 8 },
    { name: "Spices & Seasonings", sortOrder: 9 },
    { name: "Oils & Vinegars",     sortOrder: 10 },
    { name: "Beverages",           sortOrder: 11 },
    { name: "Snacks",              sortOrder: 12 },
    { name: "Other",               sortOrder: 99 },
  ];

  for (const category of categories) {
    await db.ingredientCategory.upsert({
      where:  { name: category.name },
      update: { sortOrder: category.sortOrder },
      create: category,
    });
    console.log(`  ✅ ${category.name}`);
  }

  console.log("\nDone! All categories seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
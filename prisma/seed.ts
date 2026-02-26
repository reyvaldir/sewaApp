import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("Seeding database...");

  // 1. Categories
  const catWedding = await prisma.category.upsert({
    where: { name: "Wedding Costumes" },
    update: {},
    create: { name: "Wedding Costumes" },
  });

  const catSuperhero = await prisma.category.upsert({
    where: { name: "Superheroes" },
    update: {},
    create: { name: "Superheroes" },
  });

  const catTraditional = await prisma.category.upsert({
    where: { name: "Traditional" },
    update: {},
    create: { name: "Traditional" },
  });

  // 2. Products
  const prodWedding1 = await prisma.product.create({
    data: {
      name: "Premium White Wedding Dress",
      pricePerDay: 500000,
      replacementCost: 5000000,
      cleaningDaysBuffer: 2,
      categoryId: catWedding.id,
    },
  });

  const prodWedding2 = await prisma.product.create({
    data: {
      name: "Classic Black Tuxedo",
      pricePerDay: 300000,
      replacementCost: 2000000,
      cleaningDaysBuffer: 1,
      categoryId: catWedding.id,
    },
  });

  const prodBatman = await prisma.product.create({
    data: {
      name: "Batman Dark Knight Suit",
      pricePerDay: 200000,
      replacementCost: 1500000,
      cleaningDaysBuffer: 1,
      categoryId: catSuperhero.id,
    },
  });

  const prodSpiderman = await prisma.product.create({
    data: {
      name: "Spiderman Homecoming Suit",
      pricePerDay: 150000,
      replacementCost: 1000000,
      cleaningDaysBuffer: 1,
      categoryId: catSuperhero.id,
    },
  });

  const prodKebaya = await prisma.product.create({
    data: {
      name: "Modern Javanese Kebaya",
      pricePerDay: 250000,
      replacementCost: 3000000,
      cleaningDaysBuffer: 2,
      categoryId: catTraditional.id,
    },
  });

  // 3. Inventory Units (Belasan unit barcode)
  const unitsData = [
    // Wedding Dress (3 units)
    ...Array.from({ length: 3 }).map((_, i) => ({
      barcode: `WD-WHT-00${i + 1}`,
      productId: prodWedding1.id,
    })),
    // Tuxedo (4 units)
    ...Array.from({ length: 4 }).map((_, i) => ({
      barcode: `TX-BLK-00${i + 1}`,
      productId: prodWedding2.id,
    })),
    // Batman (2 units)
    ...Array.from({ length: 2 }).map((_, i) => ({
      barcode: `SH-BTM-00${i + 1}`,
      productId: prodBatman.id,
    })),
    // Spiderman (3 units)
    ...Array.from({ length: 3 }).map((_, i) => ({
      barcode: `SH-SPD-00${i + 1}`,
      productId: prodSpiderman.id,
    })),
    // Kebaya (5 units)
    ...Array.from({ length: 5 }).map((_, i) => ({
      barcode: `TR-KBY-00${i + 1}`,
      productId: prodKebaya.id,
    })),
  ];

  for (const unit of unitsData) {
    await prisma.inventoryUnit.upsert({
      where: { barcode: unit.barcode },
      update: {},
      create: {
        barcode: unit.barcode,
        productId: unit.productId,
        status: "AVAILABLE",
      },
    });
  }

  // 4. Bundles (1 Paket)
  const weddingBundle = await prisma.bundle.create({
    data: {
      name: "Ultimate Wedding Couple Package",
      pricePerDay: 700000, // Diskon dari 800k (500k + 300k)
      items: {
        create: [
          { productId: prodWedding1.id, quantity: 1 },
          { productId: prodWedding2.id, quantity: 1 },
        ],
      },
    },
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

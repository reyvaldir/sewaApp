import { NextResponse } from "next/server";
import { AppDataSource } from "@/lib/typeorm/data-source";
import { Category } from "@/lib/typeorm/entities/Category";
import { Product } from "@/lib/typeorm/entities/Product";
import {
  InventoryUnit,
  UnitStatus,
} from "@/lib/typeorm/entities/InventoryUnit";

export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);
    const inventoryRepo = AppDataSource.getRepository(InventoryUnit);

    // Clear existing data securely using Postgres CASCADE
    await AppDataSource.query(
      "TRUNCATE TABLE inventory_units, products, categories, bundle_items, bundles, rental_items, rentals, customers CASCADE;",
    );

    // Create Categories
    const catAnime = await categoryRepo.save(
      categoryRepo.create({ name: "Anime Cosplay" }),
    );
    const catGaming = await categoryRepo.save(
      categoryRepo.create({ name: "Gaming Roles" }),
    );
    const catProps = await categoryRepo.save(
      categoryRepo.create({ name: "Props & Weapons" }),
    );

    // Create Products
    const genshinSword = await productRepo.save(
      productRepo.create({
        name: "Raiden Shogun Katana",
        pricePerDay: 50000,
        replacementCost: 1000000,
        category: catProps,
      }),
    );

    const genshinOutfit = await productRepo.save(
      productRepo.create({
        name: "Raiden Shogun Full Set",
        pricePerDay: 150000,
        replacementCost: 2500000,
        category: catGaming,
      }),
    );

    const narutoCloak = await productRepo.save(
      productRepo.create({
        name: "Akatsuki Cloak",
        pricePerDay: 35000,
        replacementCost: 500000,
        category: catAnime,
      }),
    );

    const mitsuriOutfit = await productRepo.save(
      productRepo.create({
        name: "Mitsuri Kanroji Uniform",
        pricePerDay: 120000,
        replacementCost: 1500000,
        category: catAnime,
      }),
    );

    // Create Inventory Units
    await inventoryRepo.save([
      inventoryRepo.create({
        product: genshinSword,
        barcode: "SWORD01",
        status: UnitStatus.AVAILABLE,
      }),
      inventoryRepo.create({
        product: genshinSword,
        barcode: "SWORD02",
        status: UnitStatus.AVAILABLE,
      }),
      inventoryRepo.create({
        product: genshinOutfit,
        barcode: "RAIDEN-M01",
        size: "M",
        status: UnitStatus.AVAILABLE,
      }),
      inventoryRepo.create({
        product: genshinOutfit,
        barcode: "RAIDEN-L01",
        size: "L",
        status: UnitStatus.AVAILABLE,
      }),
      inventoryRepo.create({
        product: narutoCloak,
        barcode: "AKA-01",
        size: "All Size",
        status: UnitStatus.AVAILABLE,
      }),
      inventoryRepo.create({
        product: narutoCloak,
        barcode: "AKA-02",
        size: "All Size",
        status: UnitStatus.RENTED,
      }),
      inventoryRepo.create({
        product: mitsuriOutfit,
        barcode: "MIT-S01",
        size: "S",
        status: UnitStatus.AVAILABLE,
      }),
      inventoryRepo.create({
        product: mitsuriOutfit,
        barcode: "MIT-M01",
        size: "M",
        status: UnitStatus.AVAILABLE,
      }),
    ]);

    return NextResponse.json(
      { message: "Database seeded successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

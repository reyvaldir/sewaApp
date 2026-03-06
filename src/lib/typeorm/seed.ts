import { DataSource } from "typeorm";
import { Category } from "./entities/Category";
import { Product } from "./entities/Product";
import { InventoryUnit, UnitStatus } from "./entities/InventoryUnit";
import { Bundle } from "./entities/Bundle";
import { BundleItem } from "./entities/BundleItem";
import { Customer } from "./entities/Customer";
import { Rental } from "./entities/Rental";
import { RentalItem } from "./entities/RentalItem";
import "reflect-metadata";

const AppDataSource = new DataSource({
  type: "postgres",
  url:
    process.env.DATABASE_URL ||
    "postgresql://tenant:supersecretpassword@localhost:5433/sewaapp",
  ssl: false,
  synchronize: true, // Auto create tables for this seed file
  logging: true,
  entities: [
    Category,
    Product,
    InventoryUnit,
    Bundle,
    BundleItem,
    Customer,
    Rental,
    RentalItem,
  ],
});

async function main() {
  await AppDataSource.initialize();
  console.log("Data Source has been initialized!");

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const inventoryRepo = AppDataSource.getRepository(InventoryUnit);

  // Clear existing data (optional, but good for reliable seed)
  await inventoryRepo.clear();
  await productRepo.clear();
  await categoryRepo.clear();
  console.log("Cleared existing data");

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
      barcode: "GENSHIN01",
      pricePerDay: 50000,
      category: catProps,
    }),
  );

  const genshinOutfit = await productRepo.save(
    productRepo.create({
      name: "Raiden Shogun Full Set",
      barcode: "GENSHIN02",
      pricePerDay: 150000,
      category: catGaming,
    }),
  );

  const narutoCloak = await productRepo.save(
    productRepo.create({
      name: "Akatsuki Cloak",
      barcode: "ANIME01",
      pricePerDay: 35000,
      category: catAnime,
    }),
  );

  const mitsuriOutfit = await productRepo.save(
    productRepo.create({
      name: "Mitsuri Kanroji Uniform",
      barcode: "ANIME02",
      pricePerDay: 120000,
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

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

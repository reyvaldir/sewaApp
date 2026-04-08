import "reflect-metadata";
import { DataSource } from "typeorm";

// Entity imports will go here
import { Category } from "./entities/Category";
import { Product } from "./entities/Product";
import { InventoryUnit } from "./entities/InventoryUnit";
import { Bundle } from "./entities/Bundle";
import { BundleItem } from "./entities/BundleItem";
import { Customer } from "./entities/Customer";
import { Rental } from "./entities/Rental";
import { RentalItem } from "./entities/RentalItem";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  url:
    process.env.DATABASE_URL ||
    "postgresql://tenant:supersecretpassword@localhost:5432/sewaapp",
  synchronize: process.env.NODE_ENV !== "production", // Auto-create tables in dev
  logging: process.env.NODE_ENV !== "production",
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
  entities: [
    User,
    Category,
    Product,
    InventoryUnit,
    Bundle,
    BundleItem,
    Customer,
    Rental,
    RentalItem,
  ],
  migrations: [],
  subscribers: [],
});

"use server";

import "reflect-metadata";
import { AppDataSource } from "@/lib/typeorm/data-source";
import { Product } from "@/lib/typeorm/entities/Product";
import { Category } from "@/lib/typeorm/entities/Category";
import { Bundle } from "@/lib/typeorm/entities/Bundle";

async function ensureDbConnection() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

export async function getProducts() {
  await ensureDbConnection();
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({
      relations: ["category", "inventoryUnits"],
      order: {
        name: "ASC",
      },
    });

    // Map relationships and calculate available count matching previous Prisma structure
    const mappedProducts = products.map((product: Product) => ({
      id: product.id,
      name: product.name,
      barcode: product.inventoryUnits?.[0]?.barcode || "", // Added placeholder for POS usage if needed
      pricePerDay: Number(product.pricePerDay),
      replacementCost: Number(product.replacementCost),
      cleaningDaysBuffer: product.cleaningDaysBuffer,
      categoryId: product.categoryId,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : undefined,
      _count: {
        inventoryUnits:
          product.inventoryUnits?.filter((u: any) => u.status === "AVAILABLE")
            .length || 0,
      },
    }));
    return mappedProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products.");
  }
}

export async function getCategories() {
  await ensureDbConnection();
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const categories = await categoryRepo.find({
      order: {
        name: "ASC",
      },
    });
    return categories.map((cat: Category) => ({
      id: cat.id,
      name: cat.name,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories.");
  }
}

export async function getBundles() {
  await ensureDbConnection();
  try {
    const bundleRepo = AppDataSource.getRepository(Bundle);
    const bundles = await bundleRepo.find({
      relations: ["items", "items.product"],
      order: {
        name: "ASC",
      },
    });

    const mappedBundles = bundles.map((bundle: Bundle) => ({
      id: bundle.id,
      name: bundle.name,
      pricePerDay: Number(bundle.pricePerDay),
      items:
        bundle.items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            pricePerDay: Number(item.product.pricePerDay),
            replacementCost: Number(item.product.replacementCost),
          },
        })) || [],
    }));

    return mappedBundles;
  } catch (error) {
    console.error("Error fetching bundles:", error);
    throw new Error("Failed to fetch bundles.");
  }
}

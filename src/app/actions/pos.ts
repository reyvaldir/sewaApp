"use server";

import prisma from "@/lib/prisma";

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        _count: {
          select: {
            inventoryUnits: {
              where: {
                status: "AVAILABLE",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Prisma Decimals are not serializable by React Server Components automatically.
    // Map them to plain JavaScript Numbers before returning.
    return products.map((product) => ({
      ...product,
      pricePerDay: Number(product.pricePerDay),
      replacementCost: Number(product.replacementCost),
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products.");
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories.");
  }
}

export async function getBundles() {
  try {
    const bundles = await prisma.bundle.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Handle Decimal fields mapping for Bundles
    return bundles.map((bundle) => ({
      ...bundle,
      pricePerDay: Number(bundle.pricePerDay),
      items: bundle.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          pricePerDay: Number(item.product.pricePerDay),
          replacementCost: Number(item.product.replacementCost),
        },
      })),
    }));
  } catch (error) {
    console.error("Error fetching bundles:", error);
    throw new Error("Failed to fetch bundles.");
  }
}

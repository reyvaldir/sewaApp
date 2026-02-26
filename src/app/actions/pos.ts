"use server";

import prisma from "@/lib/prisma";

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        // Calculate availability directly via Prisma count
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

    return products;
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

    return bundles;
  } catch (error) {
    console.error("Error fetching bundles:", error);
    throw new Error("Failed to fetch bundles.");
  }
}

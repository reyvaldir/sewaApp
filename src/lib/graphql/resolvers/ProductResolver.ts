import { Resolver, Query, Mutation, Arg, Float, Int } from "type-graphql";
import { Product } from "../../typeorm/entities/Product";
import { AppDataSource } from "../../typeorm/data-source";
import { Category } from "../../typeorm/entities/Category";

@Resolver(Product)
export class ProductResolver {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);

  @Query(() => [Product])
  async products(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ["category", "inventoryUnits", "bundleItems"],
    });
  }

  @Query(() => Product, { nullable: true })
  async product(@Arg("id") id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ["category", "inventoryUnits", "bundleItems"],
    });
  }

  @Mutation(() => Product)
  async createProduct(
    @Arg("name") name: string,
    @Arg("pricePerDay", () => Float) pricePerDay: number,
    @Arg("replacementCost", () => Float) replacementCost: number,
    @Arg("categoryId") categoryId: string,
    @Arg("cleaningDaysBuffer", () => Int, { nullable: true })
    cleaningDaysBuffer?: number,
  ): Promise<Product> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new Error("Category not found");

    const product = this.productRepository.create({
      name,
      pricePerDay,
      replacementCost,
      categoryId,
      cleaningDaysBuffer: cleaningDaysBuffer ?? 1,
    });
    return this.productRepository.save(product);
  }
}

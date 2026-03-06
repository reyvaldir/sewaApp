import { Resolver, Query, Mutation, Arg } from "type-graphql";
import { Category } from "../../typeorm/entities/Category";
import { AppDataSource } from "../../typeorm/data-source";

@Resolver(Category)
export class CategoryResolver {
  private categoryRepository = AppDataSource.getRepository(Category);

  @Query(() => [Category])
  async categories(): Promise<Category[]> {
    return this.categoryRepository.find({ relations: ["products"] });
  }

  @Query(() => Category, { nullable: true })
  async category(@Arg("id") id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ["products"],
    });
  }

  @Mutation(() => Category)
  async createCategory(@Arg("name") name: string): Promise<Category> {
    const category = this.categoryRepository.create({ name });
    return this.categoryRepository.save(category);
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { ObjectType, Field, ID, Float, Int } from "type-graphql";
import { Category } from "./Category";
import type { Category as ICategory } from "./Category";

import { InventoryUnit } from "./InventoryUnit";
import type { InventoryUnit as IInventoryUnit } from "./InventoryUnit";

import { BundleItem } from "./BundleItem";
import type { BundleItem as IBundleItem } from "./BundleItem";


@ObjectType()
@Entity("products")
export class Product {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2 })
  pricePerDay: number;

  @Field(() => Float)
  @Column("decimal", { name: "replacement_cost", precision: 10, scale: 2 })
  replacementCost: number;

  @Field(() => Int)
  @Column({ name: "cleaning_days_buffer", default: 1 })
  cleaningDaysBuffer: number;

  @Field()
  @Column({ name: "category_id" })
  categoryId: string;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" })
  category: Relation<ICategory>;

  @Field(() => [InventoryUnit], { nullable: true })
  @OneToMany(() => InventoryUnit, (unit) => unit.product)
  inventoryUnits: Relation<IInventoryUnit[]>;

  @Field(() => [BundleItem], { nullable: true })
  @OneToMany(() => BundleItem, (item) => item.product)
  bundleItems: Relation<IBundleItem[]>;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Relation,
} from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { Bundle } from "./Bundle";
import { Product } from "./Product";

@ObjectType()
@Entity("bundle_items")
@Unique(["bundleId", "productId"])
export class BundleItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ name: "bundle_id" })
  bundleId: string;

  @Field(() => Bundle, { nullable: true })
  @ManyToOne(() => Bundle, (bundle) => bundle.items)
  @JoinColumn({ name: "bundle_id" })
  bundle: Relation<Bundle>;

  @Field()
  @Column({ name: "product_id" })
  productId: string;

  @Field(() => Product, { nullable: true })
  @ManyToOne(() => Product, (product) => product.bundleItems)
  @JoinColumn({ name: "product_id" })
  product: Relation<Product>;

  @Field(() => Int)
  @Column({ default: 1 })
  quantity: number;
}

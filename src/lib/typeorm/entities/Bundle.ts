import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Relation,
} from "typeorm";
import { ObjectType, Field, ID, Float } from "type-graphql";
import { BundleItem } from "./BundleItem";
import { RentalItem } from "./RentalItem";

@ObjectType()
@Entity("bundles")
export class Bundle {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2, name: "price_per_day" })
  pricePerDay: number;

  @Field(() => [BundleItem], { nullable: true })
  @OneToMany(() => BundleItem, (item) => item.bundle)
  items: Relation<BundleItem[]>;

  @Field(() => [RentalItem], { nullable: true })
  @OneToMany(() => RentalItem, (rental) => rental.bundle)
  rentals: Relation<RentalItem[]>;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

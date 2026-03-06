import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { ObjectType, Field, ID, Float } from "type-graphql";
import { Rental } from "./Rental";
import { InventoryUnit } from "./InventoryUnit";
import { Bundle } from "./Bundle";

@ObjectType()
@Entity("rental_items")
export class RentalItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ name: "rental_id" })
  rentalId: string;

  @Field(() => Rental, { nullable: true })
  @ManyToOne(() => Rental, (rental) => rental.items)
  @JoinColumn({ name: "rental_id" })
  rental: Relation<Rental>;

  @Field()
  @Column({ name: "inventory_unit_id" })
  inventoryUnitId: string;

  @Field(() => InventoryUnit, { nullable: true })
  @ManyToOne(() => InventoryUnit, (unit) => unit.rentalItems)
  @JoinColumn({ name: "inventory_unit_id" })
  inventoryUnit: Relation<InventoryUnit>;

  @Field({ nullable: true })
  @Column({ name: "bundle_id", nullable: true })
  bundleId: string;

  @Field(() => Bundle, { nullable: true })
  @ManyToOne(() => Bundle, (bundle) => bundle.rentals, { nullable: true })
  @JoinColumn({ name: "bundle_id" })
  bundle: Relation<Bundle>;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2 })
  price: number;
}

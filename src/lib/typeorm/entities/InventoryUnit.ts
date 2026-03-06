import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from "typeorm";
import { ObjectType, Field, ID, registerEnumType } from "type-graphql";
import { Product } from "./Product";
import { RentalItem } from "./RentalItem";

export enum UnitStatus {
  AVAILABLE = "AVAILABLE",
  RENTED = "RENTED",
  LAUNDRY = "LAUNDRY",
  DAMAGED = "DAMAGED",
}

registerEnumType(UnitStatus, {
  name: "UnitStatus",
});

@ObjectType()
@Entity("inventory_units")
export class InventoryUnit {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ unique: true })
  barcode: string;

  @Field(() => UnitStatus)
  @Column({
    type: "varchar",
    default: UnitStatus.AVAILABLE,
  })
  status: UnitStatus;

  @Field()
  @Column({ name: "product_id" })
  productId: string;

  @Field(() => Product, { nullable: true })
  @ManyToOne(() => Product, (product) => product.inventoryUnits)
  @JoinColumn({ name: "product_id" })
  product: Relation<Product>;

  @Field(() => [RentalItem], { nullable: true })
  @OneToMany(() => RentalItem, (rentalItem) => rentalItem.inventoryUnit)
  rentalItems: Relation<RentalItem[]>;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

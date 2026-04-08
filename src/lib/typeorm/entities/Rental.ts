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
import { ObjectType, Field, ID, Float } from "type-graphql";
import { Customer } from "./Customer";
import type { Customer as ICustomer } from "./Customer";

import { RentalItem } from "./RentalItem";
import type { RentalItem as IRentalItem } from "./RentalItem";


@ObjectType()
@Entity("rentals")
export class Rental {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ name: "customer_id" })
  customerId: string;

  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.rentals)
  @JoinColumn({ name: "customer_id" })
  customer: Relation<ICustomer>;

  @Field()
  @Column({ name: "start_date" })
  startDate: Date;

  @Field()
  @Column({ name: "end_date" })
  endDate: Date;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2, name: "total_price" })
  totalPrice: number;

  @Field(() => Float)
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  penalty: number;

  @Field(() => [RentalItem], { nullable: true })
  @OneToMany(() => RentalItem, (item) => item.rental)
  items: Relation<IRentalItem[]>;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

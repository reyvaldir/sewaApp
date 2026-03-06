import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Relation,
} from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Rental } from "./Rental";

@ObjectType()
@Entity("customers")
export class Customer {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  nik: string;

  @Field()
  @Column()
  phone: string;

  @Field({ nullable: true })
  @Column({ name: "ktp_photo_path", nullable: true })
  ktpPhotoPath: string;

  @Field(() => [Rental], { nullable: true })
  @OneToMany(() => Rental, (rental) => rental.customer)
  rentals: Relation<Rental[]>;

  @Field()
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

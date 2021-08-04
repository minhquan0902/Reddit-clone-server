import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
import { Upvote } from "./Upvote";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post {
  @Field()
  @PrimaryKey()
  _id!: number;

  @Field()
  @Property()
  creatorId!: number;

  @Field(() => Int, { nullable: true })
  @Property({ type: "number", nullable: true })
  voteStatus: number | null; // 1 or -1 or null

  @Field()
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field()
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field()
  @Property({ type: "text" })
  title!: string;

  @Field()
  @Property({ type: "text" })
  text!: string;

  @Field()
  @Property({ type: "number" })
  points!: number;

  @Field()
  @ManyToOne(() => User)
  creator: User;

  constructor(creator: User) {
    this.creator = creator;
  }

  @OneToMany(() => Upvote, (upvote) => upvote.post)
  upvote = new Collection<Upvote>(this);
}

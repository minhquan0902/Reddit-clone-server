import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Post } from "./Post";
import { User } from "./User";

// Upvote is Many to Many relationship
// user <=> posts
// user => join table <= posts
// this join table is gonna be upvote
// user => upvote <= posts

@ObjectType()
@Entity()
export class Upvote {
  @PrimaryKey()
  @Field()
  @Property()
  userId: number;

  @PrimaryKey()
  @Field()
  @Property()
  postId: number;

  @Field()
  @Property({ type: "number" })
  value: number;

  @Field(() => User)
  @ManyToOne(() => User)
  user!: User;

  @Field(() => Post)
  @ManyToOne(() => Post)
  post!: Post;
}

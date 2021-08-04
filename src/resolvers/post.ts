import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { Upvote } from "../entities/Upvote";

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  // vote mutation for upvote points
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req, em }: MyContext
  ) {
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;

    const { userId } = req.session;

    const upvote = await em.findOne(Upvote, { postId: postId, userId: userId });

    // user has already voted on this
    // and they are changing their vote
    if (upvote && upvote.value !== realValue) {
      em.getConnection().execute(`
      update upvote
      set value =  ${realValue}
      where post_id = ${postId} and user_id = ${userId}
      `);

      //vote value 1
      // post point 1

      em.getConnection().execute(`
      update post
      set points = points + ${2 * realValue}
      where _id = ${postId}
      `);
    }
    // not voted before, dont have a vote, has never voted before
    else if (!upvote) {
      await em.nativeInsert(Upvote, {
        postId: postId,
        post: postId,
        user: userId,
        userId: userId,
        value: realValue,
      });

      em.getConnection().execute(`
      update post
      set points = points + ${realValue}
      where _id = ${postId}
      `);
    }

    // await em.nativeUpdate(Post, { _id: postId }, { points: votePoints });

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string,
    @Ctx() { em, req }: MyContext
  ) {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    em.getConnection().execute(`
        update post
        set vote_status = null
        `);

    // insert Query Upvote value to see if posts are being voted yet
    const userId = req.session.userId;
    if (userId) {
      const queryUpvote = await em.find(Upvote, { userId: req.session.userId });

      const userUpvoteData = queryUpvote?.map((v) => {
        return {
          userId: v.userId,
          postId: v.postId,
          value: v.value,
        };
      });
      userUpvoteData?.map((v) => {
        em.getConnection().execute(`
        update post
        set vote_status =  ${v.value}
        where _id = ${v.postId}
        `);
      });

      console.log("User Upvote Data: ", userUpvoteData);

      console.log("userId", userId);
    } else {
      console.log("No user ID found :(");
    }

    const withCursor = await em.find(
      Post,
      { $and: [{ "createdAt <=": cursor }] },
      { limit: realLimitPlusOne, orderBy: { createdAt: "DESC" } }
    );
    const withoutCursor = await em.find(
      Post,
      {},
      { limit: realLimitPlusOne, orderBy: { createdAt: "DESC" } }
    );

    // console.log("Post with Cursor:", withCursor);

    if (cursor) {
      return {
        posts: withCursor.slice(0, realLimit),
        hasMore: withCursor.length === realLimitPlusOne,
      };
    } else {
      return {
        posts: withoutCursor.slice(0, realLimit),
        hasMore: withoutCursor.length === realLimitPlusOne,
      };
    }
  }
  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { _id: id });
  }
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { em, req }: MyContext
  ): Promise<Post> {
    console.log("userId: ", req.session.userId);
    const defaultPoints = 0;

    const post = em.create(Post, {
      title,
      text,
      creatorId: req.session.userId,
      creator: req.session.userId,
      points: defaultPoints,
    });
    await em.persistAndFlush(post);
    return post;
  }
  @Mutation(() => Number, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { em, req }: MyContext
  ): Promise<Post | null> {
    const post = await em.nativeUpdate(
      Post,
      { _id: id, creatorId: req.session.userId },
      { title: title, text: text }
    );

    // const post = await em.getConnection().execute(`
    //   update post
    //   set title = '${title}' and
    //   set text = '${text}'
    //   where _id = ${id} and creator_id = ${req.session.userId}
    //   `);

    return post as any; // this line return the state of update post as 1 means ok, 0 means fail;
  }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const post = await em.findOne(Post, { _id: id });
    if (!post) {
      return false;
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error("not Authorized");
    }
    await em.nativeDelete(Upvote, { postId: id });
    try {
      await em.nativeDelete(Post, { _id: id, creatorId: req.session.userId });
    } catch {
      return false;
    }
    return true;
  }
}

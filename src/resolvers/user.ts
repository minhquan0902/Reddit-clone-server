import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  FieldResolver,
  Root,
  Query,
  Int,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_Name, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/SendEmail";
import { v4 } from "uuid";

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user._id) {
      return user.email;
    }
    // current user wants to see someone elses email => cannot due to security reasons :(
    return "";
  }

  // CHange Password Mutation
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<UserResponse> {
    // password validation
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password must have more than 3  characters",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;

    //verify token
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }
    // Get the user base on ID
    const user = await em.findOne(User, { _id: parseInt(userId) });

    // if no user found
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exist",
          },
        ],
      };
    }

    //hash the new password and store on database
    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    //delete the token key right after changing process is completed
    await redis.del(key);

    //Log in user after change password
    req.session.userId = user._id;

    return { user };
  }

  // Forgot Password mutation
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    // Check if email already existed in the Database or not
    const user = await em.findOne(User, { email });

    if (!user) {
      // the email is not in the db
      return true;
    }

    // generate random token with V4
    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user._id,
      "ex",
      1000 * 60 * 60 * 24 * 3 // 3 days
    );

    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }

  // Me Query, check the cookies and return the Credential of who is logging in
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }
    return em.findOne(User, req.session.userId);
  }

  @Query(() => String)
  async findUser(@Arg("id", () => Int) id: number, @Ctx() { em }: MyContext) {
    const data = await em.findOne(User, { _id: id });
    const returnUsername = data?.username;

    return returnUsername;
  }

  @Query(() => [User])
  async listUser(@Ctx() { em }: MyContext) {
    const userList = await em.find(User, {});
    return userList;
  }

  // Register Mutation
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req, em }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    // Hash the password before storing them to the db
    const hashedPassword = await argon2.hash(options.password);

    // Add user to db
    const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      //|| err.detail.includes("already exists")) {
      // duplicate username and password error check

      if (err.code === "23505") {
        if (err.constraint === "user_email_unique") {
          return {
            errors: [
              {
                field: "email",
                message: "email already taken",
              },
            ],
          };
        } else
          return {
            errors: [
              {
                field: "username",
                message: "username already taken",
              },
            ],
          };
      }
    }

    // store user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session.userId = user._id;

    return { user };
  }

  // Login Mutation
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req, em }: MyContext
  ): Promise<UserResponse> {
    // Find if User existed in the db or not
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );

    // User doesn't exist :(
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username doesn't exist",
          },
        ],
      };
    }

    // Compare the hash password with the hash password store in the database to verify credential
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    // return user when login success

    req.session.userId = user._id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_Name);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}

import { MikroORM } from "@mikro-orm/core";
import { COOKIE_Name, __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import "reflect-metadata";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";

const main = async () => {
  // MikroOrm returns a Promise, can await this
  // this line is to initiate connection to db
  const orm = await MikroORM.init(microConfig);

  // run the Migration before do anything else
  await orm.getMigrator().up();

  // create an express server app
  const app = express();

  // set up redis running
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(
    session({
      name: COOKIE_Name,
      store: new RedisStore({
        client: redis,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 3, // 3 years cookies
        path: "/",
        httpOnly: true,
        secure: __prod__, // cookie only works in https
        sameSite: "lax", //csrf: google this for more information\
        domain: __prod__ ? ".quanredditcloneee.xyz" : undefined,
      },
      saveUninitialized: false,

      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  app.get("/", (_, res) => {
    res.send("hello");
  });
  app.listen(parseInt(process.env.PORT), () => {
    console.log("server started on localhost:4000");
  });

  // Apollo server
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      em: orm.em.fork(),
      req,
      res,
      redis,
    }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });
};

main().catch((err) => {
  console.log(err);
});

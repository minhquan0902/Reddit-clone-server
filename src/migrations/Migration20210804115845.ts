import { Migration } from '@mikro-orm/migrations';

export class Migration20210804115845 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("_id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "email" text not null, "password" text not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');

    this.addSql('create table "post" ("_id" serial primary key, "creator_id" int4 not null, "vote_status" int4 null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null, "text" text not null, "points" int4 not null, "creator__id" int4 not null);');

    this.addSql('create table "upvote" ("user_id" int4 not null, "post_id" int4 not null, "value" int4 not null, "user__id" int4 not null, "post__id" int4 not null);');
    this.addSql('alter table "upvote" add constraint "upvote_pkey" primary key ("user_id", "post_id");');

    this.addSql('alter table "post" add constraint "post_creator__id_foreign" foreign key ("creator__id") references "user" ("_id") on update cascade;');

    this.addSql('alter table "upvote" add constraint "upvote_user__id_foreign" foreign key ("user__id") references "user" ("_id") on update cascade;');
    this.addSql('alter table "upvote" add constraint "upvote_post__id_foreign" foreign key ("post__id") references "post" ("_id") on update cascade;');
  }

}

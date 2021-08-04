# Reddit-clone-server

Back end code for Reddit-clone

![Github2](https://user-images.githubusercontent.com/58071533/128237195-1189e111-3093-4bba-860c-1d583e6c8c4a.png)




The project was inspired by Ben Awad: https://www.youtube.com/watch?v=I6ypD7qv3Z8&t=44740s but I decided to stick with MikroOrm and calling new fork() for orm.em for handling request context

## Technology used

![Github1](https://user-images.githubusercontent.com/58071533/128236960-1b69a6c3-7805-48ab-ad59-acb04d40f900.png)

1. Postgres
2. type-graphql
3. MikroOrm as the main ORM tech
4. ApolloServer
5. Redis for storing cookies and user cache
6. argon2 for password has
7. Express server and express session
8. Docker for devops and deploying processes


##Install the project locally
1. Install [PostgreSQL](https://www.postgresql.org/download/)
   - Use "postgres" as the password for user "postgres"
   - Setup the PATH variable in your operating system if the shell couldn't find "psql" or "createdb"

2. Install [Redis](https://redis.io/)
   - Setup the PATH variable if neccessary
     > NOTE for Windows user: Follow the [guide](https://riptutorial.com/redis/example/29962/installing-and-running-redis-server-on-windows) from this link to run Redis after installation. Watch this [youtube](https://www.youtube.com/watch?v=188Fy-oCw4w) link to know how to set PATH to Redis

3. Open Terminal or Git Bash to create local db
   ```sh
    createdb -U postgres reddit2
   ```
4. Clone this repo at
   ```sh
    git clone https://github.com/minhquan0902/Reddit-clone-server.git
   ```
5. Build the Project

   a. Install [Node.js](https://nodejs.org/en/download/). It is recommended that you use `node v14.3.0` or newer.
   b. Install [Yarn](https://classic.yarnpkg.com/en/docs/install). 
   
6. To start the server up and running

  a) Open the first terminal for redis
  
     
        $ redis-server
     
     
     
  b) Open the second terminal to watch for changes watch
  
     
        $ yarn watch
     
     
     
  c) Start the server up and running
  
    
        $ yarn dev
     
     
     
### When server up and running, can access Graphql Playground at Localhost:4000/graphql
   
   
  







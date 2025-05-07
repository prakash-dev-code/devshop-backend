const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const PORT = process.env.PORT;
const app = require("./app");
const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { mergeResolvers } = require('@graphql-tools/merge');
const productResolver = require("./controllers/graphql/resolvers/product.resolvers");
const userResolver = require("./controllers/graphql/resolvers/product.resolvers");
const baseTypeDefs = require("./controllers/graphql/base.schema");
const productTypeDefs = require("./controllers/graphql/product.schema");
const userTypeDefs = require("./controllers/graphql/user.schema");

const connectDB = require("./database/mongodb");
const resolvers = mergeResolvers([userResolver, productResolver]);
const typeDefs = [baseTypeDefs, userTypeDefs, productTypeDefs];
async function startServer() {
  await connectDB();

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({
      user: req.user, // Reuse your existing auth middleware
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: ${apolloServer.graphqlPath}`);
  });

  // Existing error handlers
  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION, SHUTTING DOWN...");
    console.error(err);
    server.close(() => process.exit(1));
  });
}

startServer();

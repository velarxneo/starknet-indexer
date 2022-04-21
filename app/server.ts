import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import Express from "express";
import { buildSchema } from "type-graphql";
import { context } from "./context";
import {
  WalletResolver,
  RealmResolver,
  BuildingResolver,
  ResourceResolver,
  BuildingCostResolver,
  RealmTraitResolver
} from "./resolvers";
import { StarkNet } from "./indexer/Starknet";
import { RealmsL1Indexer } from "./indexer/RealmsL1Indexer";
import {
  EventCrudResolver,
  DesiegeCrudResolver
} from "@generated/type-graphql";

const main = async () => {
  const schema = await buildSchema({
    resolvers: [
      RealmResolver,
      WalletResolver,
      BuildingResolver,
      ResourceResolver,
      BuildingCostResolver,
      RealmTraitResolver,
      // Generated
      DesiegeCrudResolver,
      EventCrudResolver
    ],
    emitSchemaFile: true,
    validate: false
  });

  const server = new ApolloServer({
    schema,
    context: context,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground]
  });

  const app = Express();

  await server.start();

  server.applyMiddleware({ app });

  await StarkNet().serverWillStart();

  const realmsL1Indexer = new RealmsL1Indexer(context);
  realmsL1Indexer.start();

  app.listen({ port: 3333 }, () =>
    console.log(
      `🚀 Server ready and listening at ==> http://localhost:3333${server.graphqlPath}`
    )
  );
};

main().catch((error) => {
  console.log(error, "error");
});

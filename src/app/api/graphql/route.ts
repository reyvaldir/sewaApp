import "reflect-metadata";
import { createYoga } from "graphql-yoga";
import { buildSchema } from "type-graphql";
import { CategoryResolver } from "../../../lib/graphql/resolvers/CategoryResolver";
import { ProductResolver } from "../../../lib/graphql/resolvers/ProductResolver";
import { AppDataSource } from "../../../lib/typeorm/data-source";

let schemaPromise: Promise<any> | null = null;

async function getSchema() {
  if (!schemaPromise) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    schemaPromise = buildSchema({
      resolvers: [CategoryResolver, ProductResolver],
      validate: false,
    });
  }
  return schemaPromise;
}

const handleRequest = async (request: Request) => {
  const schema = await getSchema();
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    fetchAPI: { Response },
  });
  return yoga.handleRequest(request, {});
};

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};

import type { Env } from "../lib/env";

export type GraphQLContext = {
  env: Env;
  userId: string | null;
  user?: any;
};

export function createGraphQLContext(env: Env, userId: string | null, user?: any): GraphQLContext {
  return { env, userId, user };
}

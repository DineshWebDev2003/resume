import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError, Kind, type ValidationContext, type ASTNode } from "graphql";
import type { Env } from "../lib/env";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { createGraphQLContext } from "./context";
import { enforceSingleDevice } from "../lib/deviceSecurity";

const MAX_DEPTH = 8;
const MAX_ALIASES = 15;

function getDepth(selectionSet: any, depth = 1): number {
  if (!selectionSet?.selections?.length) return depth;
  let max = depth;
  for (const sel of selectionSet.selections) {
    if (sel.selectionSet) max = Math.max(max, getDepth(sel.selectionSet, depth + 1));
    if (sel.kind === Kind.INLINE_FRAGMENT || sel.kind === Kind.FRAGMENT_SPREAD) max = Math.max(max, depth + 1);
  }
  return max;
}

function countAliases(selectionSet: any): number {
  if (!selectionSet?.selections?.length) return 0;
  let count = 0;
  for (const sel of selectionSet.selections) {
    if (sel.alias) count++;
    if (sel.selectionSet) count += countAliases(sel.selectionSet);
  }
  return count;
}

export function createGraphQLYoga(env: Env, userId: string | null, user?: any, request?: Request) {
  return createYoga({
    schema: createSchema({ typeDefs, resolvers }),
    context: async () => {
      if (userId) {
        const gate = await enforceSingleDevice(env, userId, user?.email, request?.headers || new Headers());
        if (!gate.ok) throw new GraphQLError(gate.message, { extensions: { code: gate.code, http: { status: gate.status } } });
      }
      return { ...createGraphQLContext(env, userId), user };
    },
    graphqlEndpoint: "/graphql",
    maskedErrors: env.ENVIRONMENT === "production",
    plugins: [
      {
        onValidate({ addValidationRule }: any) {
          addValidationRule((context: ValidationContext) => ({
            Document(node: ASTNode) {
              const doc: any = node;
              for (const def of doc.definitions || []) {
                if (def.kind !== Kind.OPERATION_DEFINITION || !def.selectionSet) continue;
                const depth = getDepth(def.selectionSet);
                if (depth > MAX_DEPTH) context.reportError(new GraphQLError(`Query depth ${depth} exceeds limit ${MAX_DEPTH}`));
                const aliases = countAliases(def.selectionSet);
                if (aliases > MAX_ALIASES) context.reportError(new GraphQLError(`Alias count ${aliases} exceeds limit ${MAX_ALIASES}`));
              }
              return false;
            },
          }));
        },
      },
    ],
  });
}

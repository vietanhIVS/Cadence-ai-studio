export * as schema from "./schema";

export function getDb() {
  console.warn('[AI Studio] Database not connected — using mock');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: async () => [],
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: async () => [{}],
      }),
    }),
  };
  return new Proxy({}, {
    get: (_, prop) => (prop in noOp ? (noOp as any)[prop] : () => noOp),
  }) as any;
}

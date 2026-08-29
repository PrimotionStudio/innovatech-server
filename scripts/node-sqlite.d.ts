/**
 * Minimal declaration for the slice of `node:sqlite` the import script uses.
 *
 * This project pins `@types/node` at v20, which predates `node:sqlite`.
 * Bumping the whole project to v22 types to satisfy one one-off script would
 * surface unrelated type changes across the codebase and bury the change that
 * matters. The runtime is Node 22, where the module exists; this just tells
 * TypeScript about the two calls used here.
 *
 * Delete this the day `@types/node` is upgraded.
 */
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    prepare(sql: string): { all(...params: unknown[]): unknown[] };
    close(): void;
  }
}

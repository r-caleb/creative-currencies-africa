import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the PostgreSQL Prisma datasource", async () => {
  const [schema, config] = await Promise.all([
    readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"),
    readFile(new URL("../prisma.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(schema, /provider\s+=\s+"postgresql"/);
  assert.doesNotMatch(schema, /url\s+=\s+env/);
  assert.match(config, /env\("DATABASE_URL"\)/);
});

test("defines core Creative Currencies platform models", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

  for (const model of ["User", "CreativeProfile", "Event", "Resource", "Partner"]) {
    assert.match(schema, new RegExp(`model ${model} `));
  }
});

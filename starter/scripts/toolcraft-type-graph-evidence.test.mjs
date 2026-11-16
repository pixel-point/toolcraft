import assert from "node:assert/strict";
import test from "node:test";

import { createToolcraftTypeGraphEvidence } from "./toolcraft-type-graph-evidence.mjs";

// Fake types: `children` are graph edges; `arrayOf` marks an array type whose
// classifier inspects the element type as a new root (like standard arrays).
function createInspector() {
  let inspect;
  inspect = createToolcraftTypeGraphEvidence({
    childrenOf: (type) => type.children ?? [],
    classify: (type) => {
      if (type.kind) return type.kind;
      if (type.arrayOf) return inspect(type.arrayOf);
      return undefined;
    },
    dangerous: "dom",
    safe: "plain",
    unknown: "unknown",
  });
  return inspect;
}

test("a type holding an array of itself terminates as plain", () => {
  // Like three.js CubeTexture: a property typed as an array of the same type.
  const texture = { children: [] };
  texture.children.push({ arrayOf: texture });
  assert.equal(createInspector()(texture), "plain");
});

test("danger behind a self-referencing array is still found", () => {
  const node = { children: [] };
  node.children.push({ arrayOf: node }, { kind: "dom" });
  assert.equal(createInspector()(node), "dom");
});

test("mutually recursive arrays terminate and keep danger", () => {
  const a = { children: [] };
  const b = { children: [] };
  a.children.push({ arrayOf: b });
  b.children.push({ arrayOf: a }, { kind: "dom" });
  const inspect = createInspector();
  assert.equal(inspect(a), "dom");
  assert.equal(inspect(b), "dom");
});

test("a root cut short by a cycle is not cached as plain for later callers", () => {
  // While `a` is being inspected, `b` sees `a` only as a cycle. Asked on its
  // own afterwards, `b` must still report the danger that `a` holds.
  const a = { children: [] };
  const b = { children: [{ arrayOf: a }] };
  a.children.push({ arrayOf: b }, { kind: "dom" });
  const inspect = createInspector();
  assert.equal(inspect(a), "dom");
  assert.equal(inspect(b), "dom");
});

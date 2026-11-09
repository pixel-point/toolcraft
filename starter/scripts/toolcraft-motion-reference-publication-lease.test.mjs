import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  acquireToolcraftMotionReferenceLease,
} from "./toolcraft-motion-reference-publication-lease.mjs";

async function fixture(context) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "motion-lease-"));
  context.after(() => fs.rm(root, { force: true, recursive: true }));
  return { lockDirectory: path.join(root, "reference.lock") };
}

function settings(value, clock, token, fileSystem = fs) {
  return {
    fileSystem,
    lockDirectory: value.lockDirectory,
    lockLeaseMilliseconds: 100,
    maximumUninterruptibleOperationMilliseconds: 40,
    now: () => clock.value,
    pid: token === "owner-a" ? 101 : 202,
    sourceIdentity: "motion-reference-v1-lease-race",
    tokenFactory: () => token,
  };
}

test("a reclaim claimant rereads the owner lease after a racing heartbeat", async (context) => {
  const value = await fixture(context);
  const clock = { value: 1_000 };
  const owner = await acquireToolcraftMotionReferenceLease(
    settings(value, clock, "owner-a"),
  );
  clock.value = 1_150;
  let reclaimLinkEntered;
  let releaseReclaimLink;
  const reclaimLinkStarted = new Promise((resolve) => {
    reclaimLinkEntered = resolve;
  });
  const reclaimLinkGate = new Promise((resolve) => {
    releaseReclaimLink = resolve;
  });
  const contenderFileSystem = {
    ...fs,
    link: async (...args) => {
      reclaimLinkEntered();
      await reclaimLinkGate;
      return fs.link(...args);
    },
  };
  const contender = acquireToolcraftMotionReferenceLease(
    settings(value, clock, "owner-b", contenderFileSystem),
  );
  await reclaimLinkStarted;
  await owner.heartbeat();
  releaseReclaimLink();

  await assert.rejects(contender, /renewed|active|lease/iu);
  const persisted = JSON.parse(await fs.readFile(
    path.join(value.lockDirectory, "owner.json"), "utf8",
  ));
  assert.equal(persisted.token, "owner-a");
  assert.equal(persisted.leaseExpiresAt, 1_250);
  assert.equal(await owner.release(), undefined);
});

test("a lock owner fails closed before mutation after its token is replaced", async (context) => {
  const value = await fixture(context);
  const clock = { value: 1_000 };
  const owner = await acquireToolcraftMotionReferenceLease(
    settings(value, clock, "owner-a"),
  );
  await fs.writeFile(path.join(value.lockDirectory, "owner.json"), `${JSON.stringify({
    leaseExpiresAt: 1_200,
    pid: 202,
    sourceIdentity: "motion-reference-v1-lease-race",
    token: "owner-b",
  })}\n`);

  await assert.rejects(owner.heartbeat(), /ownership|token|lost/iu);
  const persisted = JSON.parse(await fs.readFile(
    path.join(value.lockDirectory, "owner.json"), "utf8",
  ));
  assert.equal(persisted.token, "owner-b");
});

test("the declared uninterruptible operation bound stays within half a lease", async (context) => {
  const value = await fixture(context);
  const clock = { value: 1_000 };
  await assert.rejects(() => acquireToolcraftMotionReferenceLease({
    ...settings(value, clock, "owner-a"),
    maximumUninterruptibleOperationMilliseconds: 51,
  }), /operation bound|lease/iu);
  await assert.rejects(fs.stat(value.lockDirectory), { code: "ENOENT" });
});

test("heartbeat persists the renewed owner by atomic sibling replacement", async (context) => {
  const value = await fixture(context);
  const clock = { value: 1_000 };
  const operations = [];
  const fileSystem = {
    ...fs,
    rename: async (from, to) => {
      if (to === path.join(value.lockDirectory, "owner.json")) {
        operations.push(["rename", from, to]);
      }
      return fs.rename(from, to);
    },
    writeFile: async (target, contents, options) => {
      if (target.includes("owner.json.tmp-")) {
        operations.push(["write", target, options]);
      }
      return fs.writeFile(target, contents, options);
    },
  };
  const owner = await acquireToolcraftMotionReferenceLease(
    settings(value, clock, "owner-a", fileSystem),
  );
  clock.value = 1_050;
  await owner.heartbeat();

  assert.equal(operations.length, 2);
  assert.equal(operations[0][0], "write");
  assert.equal(operations[0][2].flag, "wx");
  assert.deepEqual(operations[1], ["rename", operations[0][1],
    path.join(value.lockDirectory, "owner.json")]);
  await owner.release();
});

test("a lock held under Windows rename semantics is read as held, not as a failure", async (context) => {
  const value = await fixture(context);
  const clock = { value: 1_000 };
  const windowsFileSystem = {
    ...fs,
    rename: async (from, to) => {
      const occupied = await fs.stat(to).then(() => true, () => false);
      if (occupied) {
        throw Object.assign(new Error(`EPERM: operation not permitted, rename '${from}' -> '${to}'`), {
          code: "EPERM", dest: to, path: from, syscall: "rename",
        });
      }
      return fs.rename(from, to);
    },
  };
  await acquireToolcraftMotionReferenceLease(
    settings(value, clock, "owner-a", windowsFileSystem),
  );

  await assert.rejects(
    acquireToolcraftMotionReferenceLease(settings(value, clock, "owner-b", windowsFileSystem)),
    /unexpired publication lease/iu,
  );

  clock.value = 1_200;
  const reclaimed = await acquireToolcraftMotionReferenceLease(
    settings(value, clock, "owner-b", windowsFileSystem),
  );
  assert.equal(reclaimed.token, "owner-b");
});

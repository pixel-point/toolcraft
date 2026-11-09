import path from "node:path";

function fail(message, cause) {
  throw new Error(`Toolcraft motion reference publication failed: ${message}`, { cause });
}

function existsError(error) {
  return [error?.code, error?.cause?.code].some((code) =>
    code === "EEXIST" || code === "ENOTEMPTY");
}

function validateOptions(options) {
  if (!path.isAbsolute(options.lockDirectory ?? "") ||
      typeof options.sourceIdentity !== "string" || !options.sourceIdentity ||
      !Number.isSafeInteger(options.pid) || options.pid <= 0 ||
      typeof options.now !== "function" || typeof options.tokenFactory !== "function" ||
      !Number.isFinite(options.lockLeaseMilliseconds) ||
      options.lockLeaseMilliseconds <= 0 ||
      !Number.isFinite(options.maximumUninterruptibleOperationMilliseconds) ||
      options.maximumUninterruptibleOperationMilliseconds <= 0 ||
      options.maximumUninterruptibleOperationMilliseconds * 2 >
        options.lockLeaseMilliseconds) {
    fail("lock identity, clock, lease, operation bound, PID, and token factory are required");
  }
}

function validateOwner(owner) {
  if (!owner || !Number.isSafeInteger(owner.pid) || owner.pid <= 0 ||
      !Number.isFinite(owner.leaseExpiresAt) ||
      typeof owner.sourceIdentity !== "string" || !owner.sourceIdentity ||
      typeof owner.token !== "string" || !owner.token) {
    fail("existing lock metadata is invalid and must be inspected manually");
  }
  return owner;
}

async function readOwnerFile(fileSystem, ownerPath) {
  try {
    return validateOwner(JSON.parse(await fileSystem.readFile(ownerPath, "utf8")));
  } catch (error) {
    if (error.message?.startsWith("Toolcraft motion reference publication failed:")) {
      throw error;
    }
    fail("existing lock metadata could not be read", error);
  }
}

const ownerPath = (lockDirectory) => path.join(lockDirectory, "owner.json");
const claimPath = (lockDirectory) => path.join(lockDirectory, "reclaim.json");

async function readOwner(options) {
  return readOwnerFile(options.fileSystem, ownerPath(options.lockDirectory));
}

function freshOwner(options, token) {
  return {
    leaseExpiresAt: options.now() + options.lockLeaseMilliseconds,
    pid: options.pid,
    sourceIdentity: options.sourceIdentity,
    token,
  };
}

async function writeNewOwner(fileSystem, directory, owner) {
  try {
    await fileSystem.writeFile(ownerPath(directory), `${JSON.stringify(owner)}\n`, {
      flag: "wx",
    });
  } catch (error) {
    fail("lock ownership metadata could not be written", error);
  }
}

async function replaceOwner(options, owner) {
  const target = ownerPath(options.lockDirectory);
  const temporary = `${target}.tmp-${owner.token}`;
  try {
    await options.fileSystem.writeFile(temporary, `${JSON.stringify(owner)}\n`, {
      flag: "wx",
    });
    await options.fileSystem.rename(temporary, target);
  } catch (error) {
    await options.fileSystem.rm(temporary, { force: true }).catch(() => {});
    fail("lock lease renewal could not be persisted atomically", error);
  }
}

function leaseIsActive(options, owner) {
  return options.now() < owner.leaseExpiresAt;
}

function residuePrefixes(lockDirectory) {
  const base = path.basename(lockDirectory);
  return ["incomplete", "prepare", "release", "stale"].map(
    (kind) => `${base}.${kind}-`,
  );
}

async function cleanupResidues(options) {
  const parent = path.dirname(options.lockDirectory);
  const prefixes = residuePrefixes(options.lockDirectory);
  const entries = await options.fileSystem.readdir(parent, { withFileTypes: true });
  for (const entry of entries) {
    const name = typeof entry === "string" ? entry : entry.name;
    if (prefixes.some((prefix) => name.startsWith(prefix))) {
      await options.fileSystem.rm(path.join(parent, name), {
        force: true, recursive: true,
      });
    }
  }
}

// Windows reports EPERM, not EEXIST or ENOTEMPTY, when a directory is renamed
// onto one that already exists.
async function renameOntoFreshLock(fileSystem, prepared, lockDirectory) {
  try {
    await fileSystem.rename(prepared, lockDirectory);
  } catch (error) {
    if (error?.code !== "EPERM") throw error;
    const occupied = await fileSystem.stat(lockDirectory).then(() => true, () => false);
    if (!occupied) throw error;
    throw Object.assign(
      new Error(`source lock already exists: ${lockDirectory}`, { cause: error }),
      { code: "EEXIST" },
    );
  }
}

async function createFreshLock(options, owner) {
  const prepared = `${options.lockDirectory}.prepare-${owner.token}`;
  try {
    await options.fileSystem.mkdir(prepared);
    await writeNewOwner(options.fileSystem, prepared, owner);
    await renameOntoFreshLock(options.fileSystem, prepared, options.lockDirectory);
  } catch (error) {
    await options.fileSystem.rm(prepared, { force: true, recursive: true })
      .catch(() => {});
    throw error;
  }
  await cleanupResidues(options);
}

async function removeOwnedClaim(options, token) {
  const target = claimPath(options.lockDirectory);
  let claim;
  try {
    claim = await readOwnerFile(options.fileSystem, target);
  } catch (error) {
    if (error?.cause?.code === "ENOENT") return;
    throw error;
  }
  if (claim.token === token && claim.sourceIdentity === options.sourceIdentity) {
    await options.fileSystem.rm(target, { force: true });
  }
}

async function claimTransition(options, claimant) {
  const target = claimPath(options.lockDirectory);
  const temporary = path.join(options.lockDirectory,
    `.reclaim-${claimant.token}.json`);
  await options.fileSystem.writeFile(temporary, `${JSON.stringify(claimant)}\n`, {
    flag: "wx",
  });
  try {
    await options.fileSystem.link(temporary, target);
  } catch (error) {
    await options.fileSystem.rm(temporary, { force: true }).catch(() => {});
    if (error?.code !== "EEXIST") fail("source lock transition claim failed", error);
    const current = await readOwnerFile(options.fileSystem, target);
    if (leaseIsActive(options, current)) {
      fail("another command owns an active source lock transition", error);
    }
    await options.fileSystem.rm(target, { force: true });
    return claimTransition(options, claimant);
  }
  await options.fileSystem.rm(temporary, { force: true });
  return target;
}

async function heartbeat(options, token) {
  const renewed = freshOwner(options, token);
  await claimTransition(options, renewed);
  try {
    const current = await readOwner(options);
    const claim = await readOwnerFile(
      options.fileSystem, claimPath(options.lockDirectory),
    );
    if (current.token !== token || current.sourceIdentity !== options.sourceIdentity ||
        claim.token !== token || claim.sourceIdentity !== options.sourceIdentity) {
      fail("source lock ownership token was lost before the next mutation");
    }
    await replaceOwner(options, renewed);
  } finally {
    await removeOwnedClaim(options, token).catch(() => {});
  }
}

async function reclaim(options, observed, claimant) {
  await claimTransition(options, claimant);
  const current = await readOwner(options);
  const claim = await readOwnerFile(
    options.fileSystem, claimPath(options.lockDirectory),
  );
  if (claim.token !== claimant.token || !leaseIsActive(options, claim)) {
    fail("stale source lock reclaim ownership expired before quarantine");
  }
  if (current.sourceIdentity !== options.sourceIdentity ||
      current.token !== observed.token || leaseIsActive(options, current)) {
    await removeOwnedClaim(options, claimant.token).catch(() => {});
    fail("source lock owner renewed or changed during stale reclaim");
  }
  const quarantine = `${options.lockDirectory}.stale-${claimant.token}`;
  try {
    await options.fileSystem.rename(options.lockDirectory, quarantine);
    await createFreshLock(options, claimant);
  } catch (error) {
    await options.fileSystem.rm(quarantine, { force: true, recursive: true })
      .catch(() => {});
    if (existsError(error)) {
      fail("another command acquired the fresh source lock during reclaim", error);
    }
    throw error;
  }
}

async function acquire(options) {
  const token = options.tokenFactory();
  if (typeof token !== "string" || !token) fail("lock token factory returned no token");
  const claimant = freshOwner(options, token);
  try {
    await createFreshLock(options, claimant);
    return token;
  } catch (error) {
    if (!existsError(error)) throw error;
  }
  const current = await readOwner(options);
  if (current.sourceIdentity !== options.sourceIdentity) {
    fail("existing lock belongs to a different source identity");
  }
  if (leaseIsActive(options, current)) {
    fail(`an unexpired publication lease already exists for this source (PID ${current.pid})`);
  }
  await reclaim(options, current, claimant);
  return token;
}

async function release(options, token) {
  try {
    await heartbeat(options, token);
  } catch {
    return "Source lock ownership could not be verified; the lock was retained.";
  }
  const quarantine = `${options.lockDirectory}.release-${token}`;
  try {
    await options.fileSystem.rename(options.lockDirectory, quarantine);
    await options.fileSystem.rm(quarantine, { force: true, recursive: true });
  } catch {
    return `Source lock cleanup was retained for stale-owner recovery: ${quarantine}`;
  }
}

export async function acquireToolcraftMotionReferenceLease(options) {
  validateOptions(options);
  const token = await acquire(options);
  return {
    heartbeat: () => heartbeat(options, token),
    release: () => release(options, token),
    token,
  };
}

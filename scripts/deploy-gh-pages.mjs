import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "piggybank-gh-pages-"));

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...options,
  });
}

function runInTemp(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: tempRoot,
    stdio: "inherit",
    ...options,
  });
}

function read(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

try {
  run("npm", ["run", "build"]);

  const distDir = path.join(repoRoot, "dist");
  const originUrl = read("git", ["remote", "get-url", "origin"]);
  const userName = read("git", ["config", "user.name"]);
  const userEmail = read("git", ["config", "user.email"]);

  await cp(distDir, tempRoot, { recursive: true });
  await writeFile(path.join(tempRoot, ".nojekyll"), "");

  runInTemp("git", ["init", "-b", "gh-pages"]);
  runInTemp("git", ["config", "user.name", userName]);
  runInTemp("git", ["config", "user.email", userEmail]);
  runInTemp("git", ["add", "."]);
  runInTemp("git", ["commit", "-m", "Deploy GitHub Pages"]);
  runInTemp("git", ["remote", "add", "origin", originUrl]);
  runInTemp("git", ["push", "--force", "origin", "gh-pages"]);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

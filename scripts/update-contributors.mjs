import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ORGANIZATION = "OpenMouse-Project";
const API_ROOT = "https://api.github.com";
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/contributors.json");
const token = process.env.GITHUB_TOKEN;

async function githubJson(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "openmouse-contributor-snapshot",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_ROOT}${path}`, { headers });
  if (response.status === 204) return [];
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    throw new Error(`GitHub API ${response.status} for ${path} (remaining: ${remaining ?? "unknown"})`);
  }
  return response.json();
}

const repos = (await githubJson(`/orgs/${ORGANIZATION}/repos?per_page=100&sort=full_name`))
  .filter((repo) => !repo.fork && !repo.archived);
const primaryRepo = await githubJson(`/repos/${ORGANIZATION}/openmouse`);

const merged = new Map();
for (const repo of repos) {
  const contributors = await githubJson(`/repos/${repo.full_name}/contributors?anon=1&per_page=100`);
  for (const contributor of contributors) {
    const login = contributor.login ?? contributor.name ?? "Unknown";
    if (contributor.type === "Bot" || login === "Unknown" || login.endsWith("[bot]")) continue;
    const current = merged.get(login) ?? {
      login,
      avatar: contributor.avatar_url ?? null,
      htmlUrl: contributor.html_url ?? null,
      total: 0,
    };
    current.avatar ??= contributor.avatar_url ?? null;
    current.htmlUrl ??= contributor.html_url ?? null;
    current.total += Number.isFinite(contributor.contributions) ? contributor.contributions : 0;
    merged.set(login, current);
  }
}

const snapshot = {
  stars: Number.isFinite(primaryRepo.stargazers_count) ? primaryRepo.stargazers_count : 0,
  contributors: [...merged.values()].sort((a, b) => b.total - a.total || a.login.localeCompare(b.login)),
};
const next = `${JSON.stringify(snapshot, null, 2)}\n`;
let previous = "";
try {
  previous = await readFile(OUTPUT, "utf8");
} catch {
  // First generation creates the file below.
}

if (next !== previous) {
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, next, "utf8");
  console.log(`Updated ${OUTPUT} with ${snapshot.contributors.length} contributors.`);
} else {
  console.log(`No contributor changes in ${OUTPUT}.`);
}

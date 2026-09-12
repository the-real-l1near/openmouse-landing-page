export interface Contributor {
  login: string;
  avatar: string | null;
  htmlUrl: string | null;
  total: number;
}

export interface ContributorSnapshot {
  stars: number;
  contributors: Contributor[];
}

/** Build-time fallback. The generated snapshot normally replaces this after
    first paint; keeping a small copy makes the page resilient offline. */
export const DEFAULT_CONTRIBUTORS: Contributor[] = [
  { login: "snekxs", total: 426, avatar: "https://github.com/snekxs.png", htmlUrl: "https://github.com/snekxs" },
  { login: "jazzstack", total: 112, avatar: "https://github.com/jazzstack.png", htmlUrl: "https://github.com/jazzstack" },
  { login: "dwei30", total: 45, avatar: "https://github.com/dwei30.png", htmlUrl: "https://github.com/dwei30" },
  { login: "viix0dev", total: 24, avatar: "https://github.com/viix0dev.png", htmlUrl: "https://github.com/viix0dev" },
  { login: "nyedle", total: 22, avatar: "https://github.com/nyedle.png", htmlUrl: "https://github.com/nyedle" },
  { login: "angelocore", total: 21, avatar: "https://github.com/angelocore.png", htmlUrl: "https://github.com/angelocore" },
  { login: "Pochiiko", total: 21, avatar: "https://github.com/Pochiiko.png", htmlUrl: "https://github.com/Pochiiko" },
  { login: "Josh Jenkins", total: 19, avatar: null, htmlUrl: null },
  { login: "Grandma", total: 9, avatar: null, htmlUrl: null },
  { login: "AnasIsmai1", total: 7, avatar: "https://github.com/AnasIsmai1.png", htmlUrl: "https://github.com/AnasIsmai1" },
  { login: "qsxcv", total: 6, avatar: "https://github.com/qsxcv.png", htmlUrl: "https://github.com/qsxcv" },
  { login: "weltern", total: 5, avatar: "https://github.com/weltern.png", htmlUrl: "https://github.com/weltern" },
  { login: "ydw1904", total: 5, avatar: "https://github.com/ydw1904.png", htmlUrl: "https://github.com/ydw1904" },
  { login: "nguyenan1601", total: 2, avatar: "https://github.com/nguyenan1601.png", htmlUrl: "https://github.com/nguyenan1601" },
  { login: "NotLokry", total: 1, avatar: "https://github.com/NotLokry.png", htmlUrl: "https://github.com/NotLokry" },
  { login: "FormunaGit", total: 1, avatar: "https://github.com/FormunaGit.png", htmlUrl: "https://github.com/FormunaGit" },
];

function isContributor(value: unknown): value is Contributor {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Contributor>;
  return typeof item.login === "string"
    && item.login.length > 0
    && (typeof item.avatar === "string" || item.avatar === null)
    && (typeof item.htmlUrl === "string" || item.htmlUrl === null)
    && typeof item.total === "number"
    && Number.isFinite(item.total)
    && item.total >= 0;
}

export function parseContributorSnapshot(value: unknown): ContributorSnapshot {
  if (!value || typeof value !== "object") throw new Error("Invalid contributor snapshot");
  const snapshot = value as Partial<ContributorSnapshot>;
  if (typeof snapshot.stars !== "number" || !Number.isFinite(snapshot.stars) || snapshot.stars < 0) {
    throw new Error("Invalid contributor snapshot");
  }
  if (!Array.isArray(snapshot.contributors)) throw new Error("Invalid contributor snapshot");
  const contributors = snapshot.contributors.filter(isContributor);
  if (contributors.length === 0) throw new Error("Empty contributor snapshot");
  return { stars: snapshot.stars, contributors };
}

export async function loadContributorSnapshot(
  fetcher: typeof fetch = fetch,
): Promise<ContributorSnapshot> {
  const response = await fetcher("/contributors.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Contributor snapshot ${response.status}`);
  return parseContributorSnapshot(await response.json());
}

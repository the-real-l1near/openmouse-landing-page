import assert from "node:assert/strict";
import test from "node:test";

import { loadContributorSnapshot, parseContributorSnapshot } from "./contributors.ts";

test("contributor snapshots reject malformed or empty data", () => {
  assert.throws(() => parseContributorSnapshot({ stars: 10, contributors: [] }));
  assert.throws(() => parseContributorSnapshot({ contributors: [] }));
  assert.throws(() => parseContributorSnapshot({ stars: 10, contributors: [{ login: "broken" }] }));
});

test("contributor snapshots keep only complete entries", () => {
  const snapshot = parseContributorSnapshot({
    stars: 10,
    contributors: [
      { login: "alice", avatar: null, htmlUrl: "https://github.com/alice", total: 4 },
      { login: "broken", total: "4" },
    ],
  });
  assert.equal(snapshot.stars, 10);
  assert.deepEqual(snapshot.contributors, [
    { login: "alice", avatar: null, htmlUrl: "https://github.com/alice", total: 4 },
  ]);
});

test("the browser loads contributors from the same-origin snapshot", async () => {
  let requested = "";
  const fetcher: typeof fetch = async (input) => {
    requested = String(input);
    return new Response(JSON.stringify({
      stars: 10,
      contributors: [{ login: "alice", avatar: null, htmlUrl: null, total: 4 }],
    }));
  };
  const snapshot = await loadContributorSnapshot(fetcher);
  assert.equal(requested, "/contributors.json");
  assert.equal(snapshot.stars, 10);
  assert.equal(snapshot.contributors[0]?.login, "alice");
});

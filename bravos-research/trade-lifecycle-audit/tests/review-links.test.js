import test from "node:test";
import assert from "node:assert/strict";

import { getTradeReviewLinks } from "../lib/review-links.js";

test("returns entry and exit links in review order", () => {
  assert.deepEqual(getTradeReviewLinks({
    entry_link: "https://bravosresearch.com/entry/",
    exit_link: "https://bravosresearch.com/exit/",
  }), [
    "https://bravosresearch.com/entry/",
    "https://bravosresearch.com/exit/",
  ]);
});

test("keeps one available link and removes duplicates", () => {
  assert.deepEqual(getTradeReviewLinks({
    entry_link: "https://bravosresearch.com/update/",
    exit_link: "https://bravosresearch.com/update/",
  }), ["https://bravosresearch.com/update/"]);
  assert.deepEqual(getTradeReviewLinks({ entry_link: "", exit_link: "https://bravosresearch.com/exit/" }), [
    "https://bravosresearch.com/exit/",
  ]);
});

test("rejects empty and non-web links", () => {
  assert.deepEqual(getTradeReviewLinks(null), []);
  assert.deepEqual(getTradeReviewLinks({ entry_link: "javascript:alert(1)", exit_link: "not-a-url" }), []);
});

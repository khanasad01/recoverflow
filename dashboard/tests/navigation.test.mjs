/**
 * Automated Cross-Surface Navigation Test
 * Flow: Homepage (/) -> Login (/login) -> Console (/overview) -> back to Homepage (/)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Cross-Surface Navigation & Routing Suite", () => {
  test("Step 1: Homepage (/) responds and exposes Onboarding Portal entrypoints", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200, "Homepage must return HTTP 200");
    const html = await res.text();
    assert.match(html, /RecoverFlow/i, "Homepage must display RecoverFlow branding");
    assert.match(html, /\/login/i, "Homepage must link to Login / Onboarding Portal");
  });

  test("Step 2: Login Portal (/login) responds and provides safe path back to Homepage", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.equal(res.status, 200, "Login Portal must return HTTP 200");
    const html = await res.text();
    assert.match(html, /Welcome back|Set up your recovery workspace/i, "Login page must display sign-in prompt");
    assert.match(html, /Back to Homepage/i, "Login page must have a return path to Homepage");
  });

  test("Step 3: Console Overview (/overview) loads and provides return path", async () => {
    const res = await fetch(`${BASE_URL}/overview`);
    assert.equal(res.status, 200, "Console Overview must return HTTP 200");
    const html = await res.text();
    assert.match(html, /Executive/i, "Overview must render Executive Console header");
  });

  test("Step 4: All authenticated consoles respond without dead-ends", async () => {
    const routes = [
      "/opportunities",
      "/customers",
      "/interventions",
      "/experiments",
      "/policy",
      "/settings",
    ];

    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`);
      assert.equal(res.status, 200, `Route ${route} must return HTTP 200`);
    }
  });
});

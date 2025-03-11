// Run with: pnpm test   (Node 22+, uses built-in type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CodEvent } from "./domain.ts";
import { getPhase, parseQrPayload, profileNeedsUpdate, qrPayload, schoolYearOf } from "./domain.ts";

const HOUR = 3600_000;
const now = new Date("2026-11-14T04:00:00Z");

function event(overrides: Partial<CodEvent> = {}): CodEvent {
  return {
    id: "e1",
    title: "Test",
    tagline: "",
    description: "x",
    type: "CONTEST",
    venue: "CL1",
    coverImageUrl: null,
    startDate: new Date(now.getTime() + 48 * HOUR).toISOString(),
    endDate: new Date(now.getTime() + 50 * HOUR).toISOString(),
    registrationDeadline: null,
    capacity: null,
    participation: "SOLO",
    teamMin: 1,
    teamMax: 1,
    prizes: [],
    winners: [],
    status: "REGISTRATION_OPEN",
    registrationCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: "a@b.c",
    ...overrides,
  };
}

const prize = { place: 1 as const, title: "Keyboard", description: "", imageUrl: null };

test("draft and cancelled win over dates", () => {
  assert.equal(getPhase(event({ status: "DRAFT" }), now), "DRAFT");
  assert.equal(getPhase(event({ status: "CANCELLED", startDate: "2020-01-01T00:00:00Z" }), now), "CANCELLED");
});

test("registration open until deadline or capacity", () => {
  assert.equal(getPhase(event(), now), "REGISTRATION_OPEN");
  assert.equal(
    getPhase(event({ registrationDeadline: new Date(now.getTime() - HOUR).toISOString() }), now),
    "REGISTRATION_CLOSED"
  );
  assert.equal(getPhase(event({ capacity: 10, registrationCount: 10 }), now), "REGISTRATION_CLOSED");
  assert.equal(getPhase(event({ capacity: 10, registrationCount: 9 }), now), "REGISTRATION_OPEN");
  assert.equal(getPhase(event({ status: "REGISTRATION_CLOSED" }), now), "REGISTRATION_CLOSED");
});

test("ongoing and finished follow the dates", () => {
  const started = { startDate: new Date(now.getTime() - HOUR).toISOString() };
  assert.equal(getPhase(event(started), now), "ONGOING");
  const ended = { ...started, endDate: new Date(now.getTime() - 1).toISOString() };
  assert.equal(getPhase(event(ended), now), "COMPLETED");
  assert.equal(getPhase(event({ ...ended, prizes: [prize] }), now), "AWAITING_RESULTS");
  assert.equal(
    getPhase(event({ ...ended, prizes: [prize], winners: [{ place: 1, refId: "r", name: "A" }] }), now),
    "COMPLETED"
  );
});

test("school year rolls over in August (Manila time)", () => {
  assert.equal(schoolYearOf(new Date("2026-07-31T15:00:00Z")), "2025-2026"); // Jul 31 23:00 PHT
  assert.equal(schoolYearOf(new Date("2026-07-31T16:00:00Z")), "2026-2027"); // Aug 1 00:00 PHT
  assert.equal(schoolYearOf(new Date("2027-03-01T00:00:00Z")), "2026-2027");
});

test("profile needs a yearly confirmation", () => {
  const base = {
    uid: "u",
    email: "e",
    name: "n",
    photoURL: null,
    course: "BSCS",
    yearLevel: "1st Year",
    createdAt: "",
    updatedAt: "",
  };
  assert.equal(profileNeedsUpdate(null), true);
  assert.equal(profileNeedsUpdate({ ...base, schoolYear: schoolYearOf() }), false);
  assert.equal(profileNeedsUpdate({ ...base, schoolYear: "2001-2002" }), true);
});

test("QR payload round-trips and rejects junk", () => {
  const value = qrPayload({ id: "evt_user", checkinToken: "abc123XYZ" });
  assert.deepEqual(parseQrPayload(value), { registrationId: "evt_user", token: "abc123XYZ" });
  assert.equal(parseQrPayload("https://example.com"), null);
  assert.equal(parseQrPayload("codevents:a/b:tok"), null); // never let "/" reach a Firestore path
  assert.equal(parseQrPayload("codevents:a:tok!"), null);
});

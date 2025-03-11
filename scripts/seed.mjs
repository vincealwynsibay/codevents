// Fills the local emulators with demo data: events in every phase, students,
// registrations, teams and winners. Only ever talks to the emulators.
//   pnpm emulators   (in another terminal)
//   pnpm seed
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { createHash, randomBytes } from "node:crypto";

const host = "127.0.0.1";
const fsHost = `${host}:8080`;
const authHost = `${host}:9099`;
Object.assign(globalThis.process.env, {
  FIRESTORE_EMULATOR_HOST: fsHost,
  FIREBASE_AUTH_EMULATOR_HOST: authHost,
});

const projectId = "demo-codevents";
initializeApp({ projectId });
const db = getFirestore();
const auth = getAuth();

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const token = () => randomBytes(12).toString("hex");
const code = () => randomBytes(3).toString("hex").toUpperCase();

function schoolYear(d = new Date()) {
  const y = d.getUTCFullYear();
  return d.getUTCMonth() + 1 >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

const students = [
  ["Andrea Santos", "BS Computer Science", "3rd Year"],
  ["Miguel Reyes", "BS Information Technology", "2nd Year"],
  ["Bea Villanueva", "BS Computer Science", "4th Year"],
  ["Paolo Cruz", "BS Information Technology", "3rd Year"],
  ["Jasmine Dela Cruz", "BS Information Systems", "1st Year"],
  ["Carlo Mendoza", "BS Computer Science", "2nd Year"],
  ["Trisha Ramos", "BS Information Technology", "4th Year"],
  ["Kevin Bautista", "BS Computer Science", "3rd Year"],
  ["Ella Navarro", "BS Information Systems", "2nd Year"],
  ["Rafael Gomez", "BS Computer Science", "1st Year"],
  ["Nicole Aquino", "BS Information Technology", "3rd Year"],
  ["Joshua Lim", "BS Computer Science", "4th Year"],
].map(([name, course, yearLevel], i) => {
  const [first, last] = name.toLowerCase().split(" ");
  return {
    uid: `seed-student-${i + 1}`,
    name,
    course,
    yearLevel,
    email: `${first[0]}.${last.replace(/\s/g, "")}.${String(130000 + i * 137).padStart(6, "0")}.tc@umindanao.edu.ph`,
  };
});

async function clear() {
  for (const col of ["events", "registrations", "teams", "teamKeys", "users", "admins"]) {
    const snap = await db.collection(col).get();
    const w = db.bulkWriter();
    snap.docs.forEach((d) => w.delete(d.ref));
    await w.close();
  }
}

async function main() {
  console.log("Clearing emulator data…");
  await clear();

  for (const s of students) {
    await auth.deleteUser(s.uid).catch(() => {});
    await auth.createUser({ uid: s.uid, email: s.email, displayName: s.name, emailVerified: true });
    await db.collection("users").doc(s.uid).set({
      uid: s.uid,
      email: s.email,
      name: s.name,
      photoURL: null,
      course: s.course,
      yearLevel: s.yearLevel,
      schoolYear: schoolYear(),
      createdAt: iso(now - 60 * DAY),
      updatedAt: iso(now - 60 * DAY),
    });
  }

  await db.collection("admins").doc("officer@umindanao.edu.ph").set({
    email: "officer@umindanao.edu.ph",
    role: "OFFICER",
    addedBy: "owner@umindanao.edu.ph",
    addedAt: iso(now - 30 * DAY),
  });

  const base = {
    tagline: "",
    coverImageUrl: null,
    registrationDeadline: null,
    capacity: null,
    participation: "SOLO",
    teamMin: 1,
    teamMax: 1,
    prizes: [],
    winners: [],
    registrationCount: 0,
    createdBy: "owner@umindanao.edu.ph",
    createdAt: iso(now - 20 * DAY),
    updatedAt: iso(now - 20 * DAY),
  };

  const prizes = [
    { place: 1, title: "Mechanical keyboard", description: "+ ₱5,000 cash", imageUrl: "/images/1st.png" },
    { place: 2, title: "Gaming headset", description: "+ ₱3,000 cash", imageUrl: "/images/2nd.png" },
    { place: 3, title: "Gaming mouse", description: "+ ₱1,500 cash", imageUrl: "/images/3rd.png" },
  ];

  const events = {
    hackathon: {
      ...base,
      title: "CODES Hackathon 2026",
      tagline: "24 hours. One problem. Build something that matters for Tagum.",
      description:
        "Our flagship hackathon is back.\n\nForm a team of 2–4, get the problem statement at kickoff, and ship a working prototype in 24 hours. Mentors from local tech companies will be around all night.\n\nWhat to bring:\n• Laptop and charger\n• Student ID\n• Your best ideas\n\nFood and coffee are on us.",
      type: "CONTEST",
      venue: "CL3, UM Tagum College",
      startDate: iso(now + 12 * DAY),
      endDate: iso(now + 13 * DAY),
      registrationDeadline: iso(now + 10 * DAY),
      capacity: 60,
      participation: "TEAM",
      teamMin: 2,
      teamMax: 4,
      prizes,
      status: "REGISTRATION_OPEN",
    },
    workshop: {
      ...base,
      title: "Intro to Next.js Workshop",
      tagline: "Build and deploy your first full-stack web app in one afternoon.",
      description:
        "A hands-on workshop for beginners. We'll build a small app with Next.js and deploy it live.\n\nBring a laptop with Node.js installed.",
      type: "WORKSHOP",
      venue: "AVR, 3rd floor",
      startDate: iso(now + 5 * DAY),
      endDate: iso(now + 5 * DAY + 3 * HOUR),
      capacity: 40,
      status: "REGISTRATION_OPEN",
    },
    talk: {
      ...base,
      title: "Careers in Tech: Alumni Talk",
      tagline: "CODES alumni share how they landed their first dev jobs.",
      description: "Three alumni, one panel, open Q&A. Free snacks.",
      type: "TALK",
      venue: "University Gym",
      startDate: iso(now + 20 * DAY),
      endDate: iso(now + 20 * DAY + 2 * HOUR),
      status: "REGISTRATION_CLOSED",
    },
    draft: {
      ...base,
      title: "Code Golf Night",
      tagline: "Shortest solution wins.",
      description: "Draft. Mechanics to follow.",
      type: "CONTEST",
      venue: "CL1",
      startDate: iso(now + 40 * DAY),
      endDate: iso(now + 40 * DAY + 4 * HOUR),
      prizes: prizes.slice(0, 1),
      status: "DRAFT",
    },
    pastContest: {
      ...base,
      title: "Algorithm Showdown",
      tagline: "Competitive programming, 3 hours, 8 problems.",
      description: "An ICPC-style individual contest.",
      type: "CONTEST",
      venue: "CL2",
      startDate: iso(now - 30 * DAY),
      endDate: iso(now - 30 * DAY + 3 * HOUR),
      prizes,
      status: "REGISTRATION_CLOSED",
      createdAt: iso(now - 50 * DAY),
    },
    awaiting: {
      ...base,
      title: "UI/UX Design Sprint",
      tagline: "Redesign a campus app in 6 hours.",
      description: "Solo design challenge judged by industry designers.",
      type: "CONTEST",
      venue: "Multimedia Lab",
      startDate: iso(now - 2 * DAY),
      endDate: iso(now - 2 * DAY + 6 * HOUR),
      prizes: prizes.slice(0, 2),
      status: "REGISTRATION_CLOSED",
    },
  };

  const ids = {};
  for (const [key, e] of Object.entries(events)) {
    const ref = await db.collection("events").add(e);
    ids[key] = ref.id;
  }

  async function register(eventKey, student, extra = {}) {
    const id = `${ids[eventKey]}_${student.uid}`;
    await db.collection("registrations").doc(id).set({
      eventId: ids[eventKey],
      uid: student.uid,
      name: student.name,
      email: student.email,
      photoURL: null,
      course: student.course,
      yearLevel: student.yearLevel,
      teamId: null,
      checkinToken: token(),
      checkedInAt: null,
      createdAt: iso(now - Math.random() * 5 * DAY),
      ...extra,
    });
    return id;
  }

  // Hackathon teams
  const teamDefs = [
    ["Null Pointers", students.slice(0, 3)],
    ["Stack Overflowers", students.slice(3, 5)],
    ["Byte Me", students.slice(5, 6)],
  ];
  let hackCount = 0;
  for (const [name, members] of teamDefs) {
    const ref = db.collection("teams").doc();
    const teamCode = code();
    // Mirrors teamNameKey/teamCodeKey in lib/server/data.ts
    const nameSlug = createHash("sha1").update(name.trim().toLowerCase()).digest("hex").slice(0, 20);
    await db.collection("teamKeys").doc(`${ids.hackathon}_name_${nameSlug}`).set({ eventId: ids.hackathon, teamId: ref.id });
    await db.collection("teamKeys").doc(`${ids.hackathon}_code_${teamCode}`).set({ eventId: ids.hackathon, teamId: ref.id });
    await ref.set({
      eventId: ids.hackathon,
      name,
      nameLower: name.toLowerCase(),
      code: teamCode,
      captainUid: members[0].uid,
      memberUids: members.map((m) => m.uid),
      memberNames: members.map((m) => m.name),
      createdAt: iso(now - 3 * DAY),
    });
    for (const m of members) {
      await register("hackathon", m, { teamId: ref.id });
      hackCount++;
    }
  }

  // Workshop
  for (const s of students.slice(2, 10)) await register("workshop", s);
  // Talk
  for (const s of students.slice(0, 5)) await register("talk", s);
  // Past contest with winners, everyone checked in
  const pastRegs = [];
  for (const s of students.slice(0, 9)) {
    pastRegs.push(await register("pastContest", s, { checkedInAt: iso(now - 30 * DAY + 10 * 60 * 1000) }));
  }
  // Awaiting results
  for (const s of students.slice(4, 11)) {
    await register("awaiting", s, { checkedInAt: iso(now - 2 * DAY + 5 * 60 * 1000) });
  }

  const counts = { hackathon: hackCount, workshop: 8, talk: 5, pastContest: 9, awaiting: 7 };
  for (const [key, count] of Object.entries(counts)) {
    await db.collection("events").doc(ids[key]).update({ registrationCount: count });
  }
  await db.collection("events").doc(ids.pastContest).update({
    winners: [
      { place: 1, refId: pastRegs[2], name: students[2].name },
      { place: 2, refId: pastRegs[7], name: students[7].name },
      { place: 3, refId: pastRegs[0], name: students[0].name },
    ],
  });

  console.log("Seeded:", Object.keys(ids).length, "events,", students.length, "students.");
  console.log("Sign in (emulator Google popup → Add new account):");
  console.log("  owner@umindanao.edu.ph    → owner (via OWNER_EMAILS in dev:local)");
  console.log("  officer@umindanao.edu.ph  → officer");
  console.log("  anything@umindanao.edu.ph → student");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

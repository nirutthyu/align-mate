const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
let db;

const EXPECTED_STUDENTS = 13;

const QUESTIONS = {
  0:  { type: "binary",  labels: ["Night", "Early"] },
  1:  { type: "ordinal", labels: ["Low", "Medium", "High"] },
  2:  { type: "ordinal", labels: ["No", "Sometimes", "Yes"] },
  3:  { type: "binary",  labels: ["No", "Yes"] },
  4:  { type: "binary",  labels: ["Group", "Individual"] },
  5:  { type: "binary",  labels: ["No", "Yes"] },
  6:  { type: "binary",  labels: ["NeedSupport", "Calm"] },
  7:  { type: "ordinal", labels: ["Never", "Rarely", "Sometimes", "Frequently"] },
  8:  { type: "binary",  labels: ["Bad", "Good"] },
  9:  { type: "ordinal", labels: ["Not", "Somewhat", "Very"] },
  10: { type: "ordinal", labels: ["Introvert", "Ambivert", "Extrovert"] },
  11: { type: "binary",  labels: ["Yes", "No"] },
  12: { type: "binary",  labels: ["Emotional", "Logical"] },
  13: { type: "ordinal", labels: ["Low", "Medium", "High"] },
  14: { type: "binary",  labels: ["Reassure others", "Seek reassurance"] },
  15: { type: "binary",  labels: ["Alarm", "Self wake up"] },
  16: { type: "binary",  labels: ["Mostly listen", "Mostly speak"] },
  17: { type: "binary",  labels: ["Remind Timeline", "Rely on reminders"] }
};

const binaryIdx = Object.keys(QUESTIONS)
  .filter(i => QUESTIONS[i].type === "binary").map(Number);
const ordinalIdx = Object.keys(QUESTIONS)
  .filter(i => QUESTIONS[i].type === "ordinal").map(Number);

const QID_INDEX = {
  "early-night": 0,
  "cleanliness": 1,
  "daily-routine": 2,
  "quiet-room": 3,
  "study-style": 4,
  "gaming": 5,
  "stress-handle-comp": 6,
  "movies-frequency": 7,
  "friends-other-rooms": 8,
  "sharing-items": 9,
  "social-level": 10,
  "group-lead": 11,
  "decision-style": 12,
  "adaptability": 13,
  "difficult-situations": 14,
  "wake-up-style": 15,
  "conversation-style": 16,
  "exam-period": 17
};

const TRAIT_WEIGHTS = {
  stress: 1.5,
  cleanliness: 1.3,
  quiet_room: 1.2,
  sharing_items: 1.1,
  default: 1.0
};

// ======================= HELPER FUNCTIONS =======================
function extractAnswers(user) {
  const arr = new Array(18).fill(null);
  for (const a of user.answers || []) {
    const idx = QID_INDEX[a.qid];
    if (idx !== undefined) arr[idx] = a.chosenAnswer;
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === null) arr[i] = QUESTIONS[i].labels[0];
  }
  return arr;
}

function preprocessStudent(raw) {
  const encoded = [];
  for (let i = 0; i < raw.length; i++) {
    const labels = QUESTIONS[i].labels;
    let idx = labels.indexOf(raw[i]);
    if (idx === -1) idx = 0;
    encoded.push(idx);
  }
  for (const i of ordinalIdx) {
    const max = QUESTIONS[i].labels.length - 1;
    encoded[i] = encoded[i] / max;
  }
  return encoded;
}

function diceSimilarity(a, b) {
  let inter = 0, total = 0;
  for (let i = 0; i < a.length; i++) {
    inter += a[i] * b[i];
    total += a[i] + b[i];
  }
  return total === 0 ? 1 : (2 * inter) / total;
}

function weightedComplement(A, B) {
  let total = 0, weightSum = 0;
  for (let i = 0; i < A.length; i++) {
    let weight = TRAIT_WEIGHTS.default;
    if (i === 6) weight = TRAIT_WEIGHTS.stress;
    if (i === 1) weight = TRAIT_WEIGHTS.cleanliness;
    if (i === 3) weight = TRAIT_WEIGHTS.quiet_room;
    if (i === 9) weight = TRAIT_WEIGHTS.sharing_items;
    total += weight * Math.abs(A[i] - B[i]);
    weightSum += weight;
  }
  return total / weightSum;
}

function conflictRisk(A, B) {
  let risk = 0;
  if (A[6] > 0.7 && B[6] > 0.7) risk += 0.3;
  if (A[1] < 0.3 && B[1] < 0.3) risk += 0.2;
  if (A[7] > 0.7 && B[7] > 0.7) risk += 0.2;
  return risk;
}

function improvedHybridCompatibility(A_raw, B_raw) {
  const A = preprocessStudent(A_raw);
  const B = preprocessStudent(B_raw);

  const A_bin = binaryIdx.map(i => A[i]);
  const B_bin = binaryIdx.map(i => B[i]);
  const dice = diceSimilarity(A_bin, B_bin);

  const A_ord = ordinalIdx.map(i => A[i]);
  const B_ord = ordinalIdx.map(i => B[i]);
  const ordSim = A_ord
    .map((v, i) => 1 - Math.abs(v - B_ord[i]))
    .reduce((a, b) => a + b, 0) / A_ord.length;

  const similarityScore = (dice + ordSim) / 2;
  const complementScore = weightedComplement(A, B);
  const riskPenalty = conflictRisk(A, B);

  const alpha = 0.4, beta = 0.4, gamma = 0.2;
  return alpha * similarityScore + beta * complementScore - gamma * riskPenalty;
}

function buildCompatibilityMatrix(users) {
  const mat = {};
  users.forEach(u => mat[u._id.toString()] = {});
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const A = extractAnswers(users[i]);
      const B = extractAnswers(users[j]);
      const score = improvedHybridCompatibility(A, B);
      const id1 = users[i]._id.toString();
      const id2 = users[j]._id.toString();
      mat[id1][id2] = score;
      mat[id2][id1] = score;
    }
  }
  return mat;
}

// ======================= PUBLISH HELPERS =======================
async function isPublished() {
  const setting = await db.collection('settings').findOne({ key: 'published' });
  return setting?.value === true;
}

async function getCompletedCount() {
  return db.collection('users').countDocuments({
    hasCompletedQuestionnaire: true,
    answers: { $exists: true, $ne: [] }
  });
}

// ======================= SERVER START =======================
async function start() {
  try {
    await client.connect();
    db = client.db('roommateapp');
    console.log('✅ Connected to MongoDB');

    // ── Save user answers ──────────────────────────────────────
    app.post('/api/save-user', async (req, res) => {
      try {
        const { email, answers } = req.body;
        await db.collection('users').updateOne(
          { email },
          { $set: { email, answers, hasCompletedQuestionnaire: true } },
          { upsert: true }
        );
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // ── Assign rooms ───────────────────────────────────────────
    app.post('/api/assign-rooms', async (req, res) => {
      try {
        const users = await db.collection('users').find({
          hasCompletedQuestionnaire: true,
          answers: { $exists: true, $ne: [] }
        }).toArray();

        if (users.length < 2)
          return res.status(400).json({ error: "Not enough users" });

        const compat = buildCompatibilityMatrix(users);
        const used = new Set();
        const rooms = [];

        for (let i = 0; i < users.length; i++) {
          const uid = users[i]._id.toString();
          if (used.has(uid)) continue;

          let room = [uid];
          used.add(uid);

          while (room.length < 4) {
            let best = null, bestScore = -Infinity;
            for (let j = 0; j < users.length; j++) {
              const cid = users[j]._id.toString();
              if (used.has(cid)) continue;
              let score = 0;
              for (const r of room) score += compat[r]?.[cid] || 0;
              if (score > bestScore) { bestScore = score; best = cid; }
            }
            if (!best) break;
            room.push(best);
            used.add(best);
          }
          rooms.push(room);
        }

        for (let i = 0; i < rooms.length; i++) {
          const roomId = `room-${i + 1}`;
          await db.collection('users').updateMany(
            { _id: { $in: rooms[i].map(id => new ObjectId(id)) } },
            { $set: { roomId } }
          );
        }

        res.json({ success: true, rooms });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // ── CHANGE: Get publish status + student counts ────────────
    // Used by both Admin (to show the publish button state)
    // and Home (to decide whether to show the result to students)
    app.get('/api/admin/status', async (req, res) => {
      try {
        const published      = await isPublished();
        const completedCount = await getCompletedCount();
        res.json({
          published,
          completedCount,
          expectedCount: EXPECTED_STUDENTS,
          canPublish: completedCount >= EXPECTED_STUDENTS
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // ── CHANGE: Publish rooms (admin only) ─────────────────────
    // Sets published = true in the settings collection.
    // Can also be called again to unpublish (toggle).
    app.post('/api/admin/publish', async (req, res) => {
      try {
        const completedCount = await getCompletedCount();
        if (completedCount < EXPECTED_STUDENTS) {
          return res.status(400).json({
            error: `Only ${completedCount}/${EXPECTED_STUDENTS} students have completed the questionnaire.`
          });
        }

        const { publish } = req.body;           // pass { publish: true } or { publish: false }
        const value = publish !== false;         // default to true if not specified

        await db.collection('settings').updateOne(
          { key: 'published' },
          { $set: { key: 'published', value } },
          { upsert: true }
        );

        res.json({ success: true, published: value });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // ── CHANGE: My room — guarded by publish flag ──────────────
    app.get('/api/my-room/:email', async (req, res) => {
      try {
        // Block students from seeing results until admin publishes
        const published = await isPublished();
        if (!published) {
          return res.status(403).json({ notPublished: true });
        }

        const user = await db.collection('users')
          .findOne({ email: req.params.email });

        if (!user || !user.roomId)
          return res.status(404).json({ error: "Room not assigned" });

        const roommates = await db.collection('users').find({
          roomId: user.roomId,
          email: { $ne: user.email }
        }).project({ email: 1 }).toArray();

        res.json({ roomId: user.roomId, roommates });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // ── Admin: list all rooms ──────────────────────────────────
    app.get('/api/admin/rooms', async (req, res) => {
      try {
        const users = await db.collection('users').find({
          roomId: { $exists: true }
        }).toArray();

        const rooms = {};
        users.forEach(user => {
          const room = user.roomId || "Unassigned";
          if (!rooms[room]) rooms[room] = { roomId: room, members: [], compatibility: 0 };
          rooms[room].members.push({ email: user.email });
        });

        const usersWithAnswers = users.filter(u => u.answers);
        const compatMatrix = buildCompatibilityMatrix(usersWithAnswers);

        Object.keys(rooms).forEach(room => {
          const members = users.filter(u => u.roomId === room);
          let total = 0, count = 0;
          for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
              const id1 = members[i]._id.toString();
              const id2 = members[j]._id.toString();
              total += compatMatrix[id1]?.[id2] || 0;
              count++;
            }
          }
          rooms[room].compatibility = count === 0 ? "1.00" : (total / count).toFixed(2);
        });

        res.json(Object.values(rooms));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

  } catch (err) {
    console.error('❌ DB CONNECTION FAILED:', err);
    process.exit(1);
  }
}

app.get('/api/check-answered/:email', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({
      email: req.params.email,
      hasCompletedQuestionnaire: true,
      answers: { $exists: true, $not: { $size: 0 } }
    });
    res.json({ answered: !!user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

start();
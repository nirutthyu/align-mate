const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
let db;

/* =====================================================
   QUESTION CONFIGURATION (UPDATED)
===================================================== */

const QUESTIONS = {
  0: { type: "binary", labels: ["Night", "Early"] },
  1: { type: "ordinal", labels: ["Low", "Medium", "High"] },

  // ✅ UPDATED HERE
  2: { type: "ordinal", labels: ["No", "Sometimes", "Yes"] },

  3: { type: "binary", labels: ["No", "Yes"] },
  4: { type: "binary", labels: ["Group", "Individual"] },
  5: { type: "binary", labels: ["No", "Yes"] },
  6: { type: "binary", labels: ["NeedSupport", "Calm"] },
  7: { type: "ordinal", labels: ["Never", "Rarely", "Sometimes", "Frequently"] },
  8: { type: "binary", labels: ["Bad", "Good"] },
  9: { type: "ordinal", labels: ["Not", "Somewhat", "Very"] }
};

const binaryIdx = Object.keys(QUESTIONS)
  .filter(i => QUESTIONS[i].type === "binary")
  .map(Number);

const ordinalIdx = Object.keys(QUESTIONS)
  .filter(i => QUESTIONS[i].type === "ordinal")
  .map(Number);

const QID_INDEX = {
  "day-night-person": 0,
  "cleanliness": 1,
  "fixed-routine": 2,   // matches your daily-routine question
  "quiet-room": 3,
  "study-type": 4,
  "gaming": 5,
  "stress": 6,
  "movies-frequency": 7,
  "friends-over": 8,
  "sharing-items": 9
};

/* =====================================================
   TRAIT WEIGHTS
===================================================== */

const TRAIT_WEIGHTS = {
  stress: 1.5,
  cleanliness: 1.3,
  quiet_room: 1.2,
  sharing_items: 1.1,
  default: 1.0
};

/* =====================================================
   ANSWER EXTRACTION
===================================================== */

function extractAnswers(user) {
  const arr = new Array(10).fill(null);

  for (const a of user.answers || []) {
    if (QID_INDEX[a.qid] !== undefined) {
      arr[QID_INDEX[a.qid]] = a.chosenAnswer;
    }
  }

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === null) arr[i] = QUESTIONS[i].labels[0];
  }

  return arr;
}

/* =====================================================
   PREPROCESSING
===================================================== */

function preprocessStudent(raw) {
  const encoded = [];

  for (let i = 0; i < raw.length; i++) {
    const labels = QUESTIONS[i].labels;
    let idx = labels.indexOf(raw[i]);
    if (idx === -1) idx = 0;
    encoded.push(idx);
  }

  // Normalize ordinal values to 0–1
  for (const i of ordinalIdx) {
    const max = QUESTIONS[i].labels.length - 1;
    encoded[i] = encoded[i] / max;
  }

  return encoded;
}

/* =====================================================
   SIMILARITY
===================================================== */

function diceSimilarity(a, b) {
  let inter = 0, total = 0;
  for (let i = 0; i < a.length; i++) {
    inter += a[i] * b[i];
    total += a[i] + b[i];
  }
  return total === 0 ? 1 : (2 * inter) / total;
}

/* =====================================================
   WEIGHTED COMPLEMENT
===================================================== */

function weightedComplement(A, B) {
  let total = 0;
  let weightSum = 0;

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

/* =====================================================
   CONFLICT RISK
===================================================== */

function conflictRisk(A, B) {
  let risk = 0;

  if (A[6] > 0.7 && B[6] > 0.7) risk += 0.3;
  if (A[1] < 0.3 && B[1] < 0.3) risk += 0.2;
  if (A[7] > 0.7 && B[7] > 0.7) risk += 0.2;

  return risk;
}

/* =====================================================
   FINAL COMPATIBILITY
===================================================== */

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

  const alpha = 0.4;
  const beta = 0.4;
  const gamma = 0.2;

  return (alpha * similarityScore) +
         (beta * complementScore) -
         (gamma * riskPenalty);
}

/* =====================================================
   COMPATIBILITY MATRIX
===================================================== */

function buildCompatibilityMatrix(users) {
  const mat = {};
  users.forEach(u => mat[u._id.toString()] = {});

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {

      const A = extractAnswers(users[i]);
      const B = extractAnswers(users[j]);

      const score = improvedHybridCompatibility(A, B);

      mat[users[i]._id.toString()][users[j]._id.toString()] = score;
      mat[users[j]._id.toString()][users[i]._id.toString()] = score;
    }
  }
  return mat;
}

/* =====================================================
   SERVER START
===================================================== */

async function start() {
  try {
    await client.connect();
    db = client.db('roommateapp');
    console.log('✅ Connected to MongoDB');

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
            let best = null;
            let bestScore = -Infinity;

            for (let j = 0; j < users.length; j++) {
              const cid = users[j]._id.toString();
              if (used.has(cid)) continue;

              let score = 0;
              for (const r of room) {
                score += compat[r]?.[cid] || 0;
              }

              if (score > bestScore) {
                bestScore = score;
                best = cid;
              }
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

    app.get('/api/my-room/:email', async (req, res) => {
      try {
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

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

  } catch (err) {
    console.error('❌ DB CONNECTION FAILED:', err);
    process.exit(1);
  }
}

start();

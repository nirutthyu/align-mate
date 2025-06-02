const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function start() {
  try {
    await client.connect();
    db = client.db('roommateapp');
    console.log('Connected to MongoDB');

    app.post('/api/save-user', async (req, res) => {
      const { email, answers } = req.body;
      if (!email || !answers) {
        return res.status(400).json({ error: 'Missing email or answers' });
      }
      try {
        const result = await db.collection('users').updateOne(
          { email },
          { $set: { answers } },
          { upsert: true }
        );
        res.json({ message: 'User data saved', result });
      } catch (err) {
        console.error('Error saving user:', err.message);
        res.status(500).json({ error: 'Failed to save user', details: err.message });
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }
}

start();

// server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const path = require('path');
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');

// =======================
// GOOGLE OAUTH CONFIG
// =======================
const { OAuth2Client } = require('google-auth-library');
const { googleClientId } = require('./config'); //frontend client ID
const client = new OAuth2Client(googleClientId);

server.use(middlewares);
// server.use(bodyParser.json());
// server.use(express.json());
server.use(jsonServer.bodyParser);

// =======================
// SIGNUP
// =======================
server.post('/signup', (req, res) => {
  const db = router.db;
  const { name, email, password, officeId } = req.body;

  if (!name || !email || !password || !officeId) {
    return res.status(400).json({ success: false, message: 'All fields are required!' });
  }

  const users = db.get('users').value();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already exists!' });
  }
  if (users.find(u => u.officeId === officeId)) {
    return res.status(400).json({ success: false, message: 'Office ID already exists!' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    officeId,
    passwordHistory: [password]
  };

  db.get('users').push(newUser).write();
  return res.json({ success: true, message: 'Signup successful!' });
});

// =======================
// SIGNIN
// =======================
server.post('/signin', (req, res) => {
  const db = router.db;
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required!' });
  }

  const users = db.get('users').value();
  const user = users.find(u =>
    (u.email === identifier || u.officeId === identifier) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid Office ID / Email or Password!' });
  }

  return res.json({ success: true, message: 'Login successful!', user });
});

// =======================
// GOOGLE LOGIN
// =======================
server.post('/auth/google', async (req, res) => {
  const db = router.db;
  const { token } = req.body;

  if (!token) return res.status(400).json({ success: false, message: 'Token required!' });

  try {
    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId, // must match your frontend client ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    const users = db.get('users').value();
    let user = users.find(u => u.email === email);

    if (!user) {
      // Auto-create Google user
      user = {
        id: crypto.randomUUID(),
        name,
        email,
        password: '',
        officeId: `OT${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        passwordHistory: []
      };
      db.get('users').push(user).write();
    }

    return res.json({ success: true, message: 'Google login successful!', user, token: 'mock-jwt-token' });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
});

// =======================
// USE DEFAULT JSON-SERVER ROUTER
// =======================
server.use(router);

// =======================
// START SERVER
// =======================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server running at http://localhost:${PORT}`);
});
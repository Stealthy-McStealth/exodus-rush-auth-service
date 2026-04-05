const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// JWT Secret (in production, use proper secrets management)
const JWT_SECRET = process.env.JWT_SECRET || 'exodus-rush-secret-2026';
const JWT_EXPIRES_IN = '24h';

// Mock user database (in production, use PostgreSQL)
const users = [
  {
    id: 1,
    username: 'test_user',
    email: 'test@stealthymcstealth.com',
    password: bcrypt.hashSync('passover2026', 10)
  },
  {
    id: 2,
    username: 'moishe',
    email: 'moishe.deploy@stealthymcstealth.com',
    password: bcrypt.hashSync('deploy123', 10)
  }
];

// In-memory session store (in production, use Redis)
const sessions = new Map();

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    sessions.set(token, {
      userId: user.id,
      username: user.username,
      loginTime: new Date()
    });

    console.log(`User ${username} logged in`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token && sessions.has(token)) {
      const session = sessions.get(token);
      console.log(`User ${session.username} logged out`);
      sessions.delete(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /validate
router.get('/validate', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists
    if (!sessions.has(token)) {
      return res.status(401).json({ valid: false, error: 'Session expired' });
    }

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, error: 'Token expired' });
    }
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// POST /refresh
router.post('/refresh', (req, res) => {
  try {
    const oldToken = req.headers.authorization?.replace('Bearer ', '');

    if (!oldToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify old token (ignoring expiration)
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });

    // Check if session exists
    if (!sessions.has(oldToken)) {
      return res.status(401).json({ error: 'Session not found' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { id: decoded.id, username: decoded.username, email: decoded.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update session
    const session = sessions.get(oldToken);
    sessions.delete(oldToken);
    sessions.set(newToken, session);

    console.log(`Token refreshed for user ${decoded.username}`);

    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;

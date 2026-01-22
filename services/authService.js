import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername } from './db.js';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload, secret, expiresIn = '30d') {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

/**
 * Initialize default user from environment variables
 * Called at server startup to ensure the default user exists
 */
export async function initDefaultUser() {
  const username = process.env.USER_USERNAME;
  const password = process.env.USER_PASSWORD;

  if (!username || !password) {
    console.warn('Warning: USER_USERNAME or USER_PASSWORD not set in environment');
    return null;
  }

  // Check if user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    console.log(`Default user '${username}' already exists`);
    return existingUser;
  }

  // Create new user with hashed password
  const passwordHash = await hashPassword(password);
  const newUser = {
    id: generateUUID(),
    username,
    passwordHash,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await createUser(newUser);
  console.log(`Default user '${username}' created`);

  return newUser;
}

/**
 * Authenticate a user by username and password
 * Returns user object if successful, null otherwise
 */
export async function authenticateUser(username, password) {
  // First check environment credentials (for backwards compatibility)
  if (username === process.env.USER_USERNAME && password === process.env.USER_PASSWORD) {
    return { username };
  }

  // Then check database
  const user = await getUserByUsername(username);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    username: user.username
  };
}

/**
 * Express middleware for JWT authentication
 */
export function createAuthMiddleware(jwtSecret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const token = authHeader.slice(7);
      req.user = verifyToken(token, jwtSecret);
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

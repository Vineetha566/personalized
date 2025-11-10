const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const users = new Map(); // id -> user
const emailIndex = new Map(); // email -> id

function hash(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function createUser({ name, email, password }) {
  const id = uuidv4();
  const salt = uuidv4();
  const passwordHash = hash(password, salt);
  const user = { id, name, email, salt, passwordHash };
  users.set(id, user);
  emailIndex.set(email, id);
  return { id, name, email };
}

function findUserByEmail(email) {
  const id = emailIndex.get(email);
  if (!id) return null;
  const u = users.get(id);
  return u ? { ...u } : null;
}

function verifyPassword(user, password) {
  return user.passwordHash === hash(password, user.salt);
}

module.exports = { createUser, findUserByEmail, verifyPassword };



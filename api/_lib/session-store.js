const crypto = require('node:crypto');
const { getNumberEnv } = require('./env');
const { getGuest } = require('./mock-service');

const sessions = new Map();

function now() {
  return Date.now();
}

function ttlMs() {
  return getNumberEnv('AI_KITCHEN_SESSION_TTL_MS', 30 * 60 * 1000);
}

function pruneExpired() {
  const cutoff = now() - ttlMs();
  for (const [id, session] of sessions.entries()) {
    if (session.updatedAt < cutoff) {
      sessions.delete(id);
    }
  }
}

function createSession({ guestId }) {
  pruneExpired();

  const guest = getGuest(guestId);
  const session = {
    id: crypto.randomUUID(),
    guest,
    status: 'created',
    rounds: [],
    dishes: [],
    finalDish: null,
    feedback: null,
    createdAt: now(),
    updatedAt: now(),
  };

  sessions.set(session.id, session);
  return session;
}

function getSession(id) {
  pruneExpired();
  const session = sessions.get(id);
  if (!session) return null;
  return session;
}

function saveSession(session) {
  session.updatedAt = now();
  sessions.set(session.id, session);
  return session;
}

function serializeSession(session) {
  return {
    sessionId: session.id,
    guest: session.guest,
    status: session.status,
    rounds: session.rounds,
    dishes: session.dishes,
    finalDish: session.finalDish,
    feedback: session.feedback,
  };
}

module.exports = {
  createSession,
  getSession,
  saveSession,
  serializeSession,
};

import crypto from 'crypto';

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hashed: string) {
  return hashPassword(password) === hashed;
}

export function createSessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

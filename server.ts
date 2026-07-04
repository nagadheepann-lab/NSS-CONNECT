import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { createSessionToken, hashPassword, verifyPassword } from './src/utils/auth';

// Define ES module compatible paths
let currentFilename = '';
let currentDirname = '';

try {
  currentFilename = __filename;
  currentDirname = __dirname;
} catch (e) {
  currentFilename = fileURLToPath(import.meta.url);
  currentDirname = path.dirname(currentFilename);
}

// Import default values from db.ts for initialization
import { 
  DEFAULT_USERS, 
  DEFAULT_EVENTS, 
  DEFAULT_ANNOUNCEMENTS, 
  DEFAULT_REGISTRATIONS, 
  DEFAULT_ATTENDANCE, 
  DEFAULT_CERTIFICATES, 
  DEFAULT_POINT_RULES, 
  DEFAULT_AUDIT_LOGS 
} from './src/utils/db';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const FALLBACK_DB_DIR = process.env.NSS_DB_DIR || 'D:/nss-connect-data';
const DB_FILE_PATH = path.join(FALLBACK_DB_DIR, 'app.sqlite');
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const sessions = new Map<string, { userId: string; expiresAt: number }>();

function resolveStaticRoot() {
  const candidates = [
    path.join(currentDirname, 'dist'),
    currentDirname,
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return currentDirname;
}

const STATIC_ROOT = resolveStaticRoot();

if (!fs.existsSync(FALLBACK_DB_DIR)) {
  fs.mkdirSync(FALLBACK_DB_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_FILE_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

app.use(express.json({ limit: '10mb' })); // allow profile image base64 uploads
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

function getDefaultDbData() {
  return {
    coordinator_key: 'COORD-SNUC-NSS',
    volunteer_key: 'VOL-SNUC-NSS',
    users: DEFAULT_USERS,
    events: DEFAULT_EVENTS,
    announcements: DEFAULT_ANNOUNCEMENTS,
    registrations: DEFAULT_REGISTRATIONS,
    attendance: DEFAULT_ATTENDANCE,
    certificates: DEFAULT_CERTIFICATES,
    point_rules: DEFAULT_POINT_RULES,
    audit_logs: DEFAULT_AUDIT_LOGS,
    initialized: true
  };
}

function initializeDbStore() {
  try {
    const existing = db.prepare("SELECT value FROM app_state WHERE key = 'db'").get() as { value?: string } | undefined;
    if (!existing) {
      writeDb(getDefaultDbData());
      console.log('Initialized SQLite database store at app.sqlite');
    }
  } catch (err) {
    console.error('Error initializing SQLite store:', err);
  }
}

// Helper to get db data
function readDb() {
  try {
    const row = db.prepare("SELECT value FROM app_state WHERE key = 'db'").get() as { value?: string } | undefined;
    if (!row?.value) {
      writeDb(getDefaultDbData());
      return getDefaultDbData();
    }

    const parsed = JSON.parse(row.value);
    return {
      ...getDefaultDbData(),
      ...parsed,
      users: parsed.users || DEFAULT_USERS,
      events: parsed.events || DEFAULT_EVENTS,
      announcements: parsed.announcements || DEFAULT_ANNOUNCEMENTS,
      registrations: parsed.registrations || DEFAULT_REGISTRATIONS,
      attendance: parsed.attendance || DEFAULT_ATTENDANCE,
      certificates: parsed.certificates || DEFAULT_CERTIFICATES,
      point_rules: parsed.point_rules || DEFAULT_POINT_RULES,
      audit_logs: parsed.audit_logs || DEFAULT_AUDIT_LOGS,
    };
  } catch (err) {
    console.error('Error reading SQLite store:', err);
    try {
      writeDb(getDefaultDbData());
    } catch (writeErr) {
      console.error('Failed to recover SQLite store:', writeErr);
    }
  }

  return getDefaultDbData();
}

// Helper to write db data
function writeDb(data: any) {
  try {
    db.prepare("INSERT INTO app_state(key, value) VALUES('db', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to SQLite store:', err);
  }
}

// API Routes
app.get('/api/debug', (req, res) => {
  const distPath = path.join(process.cwd(), 'dist');
  res.json({
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: currentDirname,
    filename: currentFilename,
    distPath,
    indexExists: fs.existsSync(path.join(distPath, 'index.html')),
    dbStoreExists: fs.existsSync(DB_FILE_PATH)
  });
});

app.get('/api/db', (req, res) => {
  const data = readDb();
  res.json(data);
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, password, role, rollNumber, year, department } = req.body || {};
  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'Email, name, password, and role are required' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  if (!trimmedEmail.endsWith('@snuchennai.edu.in')) {
    return res.status(400).json({ error: 'Only @snuchennai.edu.in emails are allowed' });
  }

  const data = readDb();
  const existing = data.users?.find((u: any) => u.email?.toLowerCase() === trimmedEmail);
  if (existing) {
    return res.status(409).json({ error: 'This email is already registered' });
  }

  const newUser = {
    id: `u-${Math.random().toString(36).substring(2, 11)}`,
    name: String(name).trim(),
    email: trimmedEmail,
    password: hashPassword(String(password)),
    department: String(department || 'Computer Science & Engineering'),
    rollNumber: String(rollNumber || `23110${Math.floor(100 + Math.random() * 900)}`),
    year: String(year || 'II'),
    role: String(role),
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80',
    nssPoints: 0,
    attendancePct: 100,
    volunteerHours: 0,
    badges: [],
    certificates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streak: 1,
  };

  data.users = [...(data.users || []), newUser];
  data.audit_logs = [
    {
      id: `log-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      operator: newUser.name,
      action: 'USER_REGISTRATION',
      details: `Registered profile for ${newUser.name} (${newUser.rollNumber}) as ${newUser.role}`,
      type: 'AUTH'
    },
    ...(data.audit_logs || [])
  ].slice(0, 500);
  writeDb(data);
  res.json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const data = readDb();
  const user = data.users?.find((u: any) => u.email?.toLowerCase() === trimmedEmail);

  if (!user) {
    return res.status(404).json({ error: 'No account found for this email' });
  }

  if (!verifyPassword(String(password), user.password)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: `This account is registered as ${user.role}` });
  }

  data.audit_logs = [
    {
      id: `log-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      operator: user.name,
      action: 'LOGIN_SUCCESS',
      details: `Authenticated to ${user.role} portal`,
      type: 'AUTH'
    },
    ...(data.audit_logs || [])
  ].slice(0, 500);
  writeDb(data);

  const token = createSessionToken();
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
  res.cookie('nss_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: SESSION_TTL_MS
  });
  res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.cookie?.split('nss_session=')[1]?.split(';')[0];
  if (token) sessions.delete(token);
  res.clearCookie('nss_session');
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.cookie?.split('nss_session=')[1]?.split(';')[0];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  const data = readDb();
  const user = data.users?.find((u: any) => u.id === session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user });
});

app.post('/api/db', (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }
  const data = readDb();
  data[key] = value;
  writeDb(data);
  res.json({ success: true });
});

app.post('/api/db/reset', (req, res) => {
  const defaultData = {
    coordinator_key: 'COORD-SNUC-NSS',
    volunteer_key: 'VOL-SNUC-NSS',
    users: DEFAULT_USERS,
    events: DEFAULT_EVENTS,
    announcements: DEFAULT_ANNOUNCEMENTS,
    registrations: DEFAULT_REGISTRATIONS,
    attendance: DEFAULT_ATTENDANCE,
    certificates: DEFAULT_CERTIFICATES,
    point_rules: DEFAULT_POINT_RULES,
    audit_logs: DEFAULT_AUDIT_LOGS,
    initialized: true
  };
  writeDb(defaultData);
  res.json(defaultData);
});

function startServer() {
  initializeDbStore();

  app.use(express.static(STATIC_ROOT));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(STATIC_ROOT, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();

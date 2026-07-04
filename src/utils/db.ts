/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // made optional for backwards compatibility but we'll always use it
  department: string;
  rollNumber: string;
  year: string;
  role: 'Student' | 'Volunteer' | 'Coordinator';
  profilePhoto: string;
  nssPoints: number;
  attendancePct: number;
  volunteerHours: number;
  badges: string[];
  certificates: string[];
  createdAt: string;
  updatedAt: string;
  streak: number;
}

export interface AnimalAvatar {
  name: string;
  url: string;
}

export const ANIMAL_AVATARS: AnimalAvatar[] = [
  { name: 'Cute Panda', url: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Fox', url: 'https://images.unsplash.com/photo-1570158268183-d296b2890212?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Koala', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Lion Cub', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Owl', url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Cat', url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Dog', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Rabbit', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Tiger', url: 'https://images.unsplash.com/photo-1615959186722-a1ed511d168a?w=150&h=150&fit=crop&q=80' },
  { name: 'Cute Deer', url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=150&h=150&fit=crop&q=80' }
];

export interface NSSEvent {
  id: string;
  title: string;
  description: string;
  banner: string;
  venue: string;
  date: string;
  time: string;
  duration: number; // in hours
  category: string;
  sdgGoal: string;
  maxParticipants: number;
  volunteerIncharge: string;
  registrationDeadline: string;
  status: 'OPEN' | 'ACTIVE' | 'FULL' | 'COMPLETED';
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  gpsLocation: { lat: number; lng: number; accuracy: number };
  device: string;
  verifiedBy?: string;
  qrCodeSignature?: string;
}

export interface PointRule {
  id: string;
  name: string;
  key: string;
  points: number;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  sender: string;
  targetRole: 'All' | 'Student' | 'Volunteer' | 'Coordinator';
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  eventTitle: string;
  hours: number;
  qrVerificationCode: string;
  uniqueId: string;
  issueDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
  type: 'AUTH' | 'EVENT' | 'ATTENDANCE' | 'SYSTEM';
}

export interface Registration {
  id: string;
  eventId: string;
  studentId: string;
  timestamp: string;
  status: 'REGISTERED' | 'WAITLISTED';
}

// Default Seed Data
export const DEFAULT_POINT_RULES: PointRule[] = [
  { id: 'r1', name: 'Attend Event', key: 'attendEvent', points: 10, description: 'Points awarded for general event attendance' },
  { id: 'r2', name: 'Volunteer', key: 'volunteer', points: 20, description: 'Points awarded for volunteering support' },
  { id: 'r3', name: 'Organize Event', key: 'organizeEvent', points: 40, description: 'Points awarded for core event organization' },
  { id: 'r4', name: 'Blood Donation', key: 'bloodDonation', points: 30, description: 'Points awarded for active blood donation drives' },
  { id: 'r5', name: 'Tree Plantation', key: 'treePlantation', points: 25, description: 'Points awarded per tree planted and logged' },
  { id: 'r6', name: 'Special Recognition', key: 'specialRecognition', points: 50, description: 'Points awarded for outstanding NSS contributions' },
];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'u-coord-1',
    name: 'Dr. Aditi Iyer',
    email: 'aditiiyer@snuchennai.edu.in',
    password: 'password123',
    department: 'Computer Science & Engineering',
    rollNumber: 'NSS-COORD-01',
    year: 'Faculty',
    role: 'Coordinator',
    profilePhoto: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&h=150&fit=crop&q=80',
    nssPoints: 620,
    attendancePct: 98,
    volunteerHours: 120,
    badges: ['First Event', '10 Points', '50 Points', '100 Points', '250 Points', '500 Points', 'Event Organizer', 'Top Volunteer'],
    certificates: ['cert-1', 'cert-2'],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2026-07-02T07:35:00-07:00',
    streak: 15,
  },
  {
    id: 'u-vol-1',
    name: 'Rahul Dev',
    email: 'rahuldev@snuchennai.edu.in',
    password: 'password123',
    department: 'Information Technology',
    rollNumber: '211101234',
    year: 'III',
    role: 'Volunteer',
    profilePhoto: 'https://images.unsplash.com/photo-1570158268183-d296b2890212?w=150&h=150&fit=crop&q=80',
    nssPoints: 450,
    attendancePct: 94,
    volunteerHours: 85,
    badges: ['First Event', '10 Points', '50 Points', '100 Points', '250 Points', 'Blood Hero', 'Green Warrior'],
    certificates: ['cert-1'],
    createdAt: '2025-02-15T11:00:00Z',
    updatedAt: '2026-07-02T07:35:00-07:00',
    streak: 8,
  },
  {
    id: 'u-stud-1',
    name: 'Sneha Ram',
    email: 'sneharam@snuchennai.edu.in',
    password: 'password123',
    department: 'Electronics & Communication',
    rollNumber: '221102456',
    year: 'II',
    role: 'Student',
    profilePhoto: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=150&h=150&fit=crop&q=80',
    nssPoints: 120,
    attendancePct: 88,
    volunteerHours: 24,
    badges: ['First Event', '10 Points', '50 Points', '100 Points'],
    certificates: [],
    createdAt: '2025-09-01T09:00:00Z',
    updatedAt: '2026-07-02T07:35:00-07:00',
    streak: 4,
  }
];

export const DEFAULT_EVENTS: NSSEvent[] = [
  {
    id: 'e-1',
    title: 'Green Campus Tree Plantation Drive',
    description: 'Join us in planting 200 saplings around the campus perimeter. This project supports SDG 15 (Life on Land) and will contribute to the campus green cover. Refreshments and tools will be provided.',
    banner: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    venue: 'SNU Chennai Sports Ground Outer Ring',
    date: '2026-07-05',
    time: '08:00 AM',
    duration: 3,
    category: 'Environmental Protection',
    sdgGoal: 'SDG 15 - Life on Land',
    maxParticipants: 150,
    volunteerIncharge: 'Rahul Dev',
    registrationDeadline: '2026-07-04',
    status: 'OPEN'
  },
  {
    id: 'e-2',
    title: 'Emergency Blood Donation Camp',
    description: 'In collaboration with Rajiv Gandhi General Hospital, we are organizing a campus-wide blood donation drive. One unit of blood can save up to three lives. All donors receive a certificate and nutrient packets.',
    banner: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800',
    venue: 'Campus Medical Centre Block B',
    date: '2026-07-02',
    time: '10:00 AM',
    duration: 5,
    category: 'Health Awareness',
    sdgGoal: 'SDG 3 - Good Health and Well-being',
    maxParticipants: 100,
    volunteerIncharge: 'Rahul Dev',
    registrationDeadline: '2026-07-01',
    status: 'ACTIVE'
  },
  {
    id: 'e-3',
    title: 'Rural Primary Education Camp',
    description: 'A 2-day workshop teaching basic English, Mathematics, and Computer skills to children in the neighboring Kalavakkam village. Transportation and teaching materials will be coordinated.',
    banner: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
    venue: 'Kalavakkam Community Hall',
    date: '2026-07-12',
    time: '09:30 AM',
    duration: 8,
    category: 'Social Service',
    sdgGoal: 'SDG 4 - Quality Education',
    maxParticipants: 30,
    volunteerIncharge: 'Aditi Iyer',
    registrationDeadline: '2026-07-10',
    status: 'FULL'
  }
];

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a-1',
    title: 'Annual NSS General Body Meeting 2026',
    content: 'All NSS students, volunteers, and executives are required to attend the Annual Review Meeting this Friday. The agenda covers upcoming village adoptions, point allocation rules review, and the badge system overview.',
    date: '2026-07-01',
    category: 'General',
    sender: 'Dr. Aditi Iyer',
    targetRole: 'All'
  },
  {
    id: 'a-2',
    title: 'Special Blood Donor Badges Now Live!',
    content: 'We have updated our gamification metrics. Students donating blood in the upcoming drive will instantly unlock the "Blood Hero" badge and obtain 30 points automatically on verification. Keep up the high spirits!',
    date: '2026-06-30',
    category: 'Updates',
    sender: 'Dr. Aditi Iyer',
    targetRole: 'Student'
  }
];

export const DEFAULT_REGISTRATIONS: Registration[] = [
  { id: 'reg-1', eventId: 'e-2', studentId: 'u-stud-1', timestamp: '2026-06-28T09:00:00Z', status: 'REGISTERED' },
  { id: 'reg-2', eventId: 'e-3', studentId: 'u-stud-1', timestamp: '2026-06-29T10:15:00Z', status: 'WAITLISTED' }
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    eventId: 'e-2',
    eventTitle: 'Emergency Blood Donation Camp',
    studentId: 'u-stud-1',
    studentName: 'Sneha Ram',
    studentRoll: '221102456',
    timestamp: '2026-07-02T10:15:00-07:00',
    status: 'APPROVED',
    gpsLocation: { lat: 12.7513, lng: 80.1982, accuracy: 12 },
    device: 'iPhone 15 Pro - Chrome Browser',
    verifiedBy: 'Rahul Dev',
    qrCodeSignature: 'QR-SIGN-E2-STD1-VALID'
  }
];

export const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    studentId: 'u-stud-1',
    studentName: 'Sneha Ram',
    eventTitle: 'Coastal Clean-up Drive 2025',
    hours: 6,
    qrVerificationCode: 'VERIFY-C-9843-XY2',
    uniqueId: 'NSS-2025-C09843',
    issueDate: '2025-11-20'
  },
  {
    id: 'cert-2',
    studentId: 'u-vol-1',
    studentName: 'Rahul Dev',
    eventTitle: 'Coastal Clean-up Drive 2025',
    hours: 10,
    qrVerificationCode: 'VERIFY-C-7231-AB9',
    uniqueId: 'NSS-2025-V07231',
    issueDate: '2025-11-20'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-07-01T09:30:00Z',
    operator: 'Dr. Aditi Iyer',
    action: 'CREATED_EVENT',
    details: 'Created event "Green Campus Tree Plantation Drive" (e-1) scheduled for 2026-07-05.',
    type: 'EVENT'
  },
  {
    id: 'log-2',
    timestamp: '2026-07-02T07:35:00-07:00',
    operator: 'Rahul Dev',
    action: 'APPROVED_ATTENDANCE',
    details: 'Approved attendance scanner upload for student Sneha Ram (221102456) in Emergency Blood Donation Camp (e-2).',
    type: 'ATTENDANCE'
  }
];

// Helper to interact with storage safely
class LocalStorageDatabase {
  private get<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const data = localStorage.getItem(`nss_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(`nss_${key}`, JSON.stringify(value));
      // background fetch to server to persist cross-device
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      }).catch(err => console.error('Error syncing set to server', err));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  public async syncFromServer(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const serverData = await res.json();
        for (const [key, val] of Object.entries(serverData)) {
          localStorage.setItem(`nss_${key}`, JSON.stringify(val));
        }
        localStorage.setItem('nss_initialized', 'true');
        return true;
      }
    } catch (err) {
      console.error('Error syncing from server', err);
    }
    return false;
  }

  // Access Keys Management
  public getCoordinatorKey(): string {
    return this.get<string>('coordinator_key', 'COORD-SNUC-NSS');
  }

  public setCoordinatorKey(key: string): void {
    this.set<string>('coordinator_key', key);
    this.addAuditLog('System', 'KEY_CHANGE', 'Coordinator access key updated', 'SYSTEM');
  }

  public getVolunteerKey(): string {
    return this.get<string>('volunteer_key', 'VOL-SNUC-NSS');
  }

  public setVolunteerKey(key: string): void {
    this.set<string>('volunteer_key', key);
    this.addAuditLog('System', 'KEY_CHANGE', 'Volunteer access key updated', 'SYSTEM');
  }

  // Initialization
  public init() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('nss_initialized')) {
      this.set('coordinator_key', 'COORD-SNUC-NSS');
      this.set('volunteer_key', 'VOL-SNUC-NSS');
      this.set('users', DEFAULT_USERS);
      this.set('events', DEFAULT_EVENTS);
      this.set('announcements', DEFAULT_ANNOUNCEMENTS);
      this.set('registrations', DEFAULT_REGISTRATIONS);
      this.set('attendance', DEFAULT_ATTENDANCE);
      this.set('certificates', DEFAULT_CERTIFICATES);
      this.set('point_rules', DEFAULT_POINT_RULES);
      this.set('audit_logs', DEFAULT_AUDIT_LOGS);
      localStorage.setItem('nss_initialized', 'true');
    }
  }

  // Users
  public getUsers(): UserProfile[] {
    return this.get('users', DEFAULT_USERS);
  }

  public saveUsers(users: UserProfile[]): void {
    this.set('users', users);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public async loginUser(email: string, password: string, role?: 'Student' | 'Volunteer' | 'Coordinator') {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false as const, error: data.error || 'Login failed' };
      }
      await this.syncFromServer();
      return { success: true as const, user: data.user as UserProfile };
    } catch (err) {
      console.error('Login request failed', err);
      return { success: false as const, error: 'Unable to reach the server' };
    }
  }

  public async registerUser(
    email: string,
    name: string,
    role: 'Student' | 'Volunteer' | 'Coordinator',
    password: string,
    rollNumber: string,
    year: string,
    department: string
  ) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role, rollNumber, year, department })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false as const, error: data.error || 'Registration failed' };
      }
      await this.syncFromServer();
      return { success: true as const, user: data.user as UserProfile };
    } catch (err) {
      console.error('Registration request failed', err);
      return { success: false as const, error: 'Unable to reach the server' };
    }
  }

  public updateUser(updatedUser: UserProfile): void {
    const users = this.getUsers();
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    this.saveUsers(updated);
  }

  // Events
  public getEvents(): NSSEvent[] {
    return this.get('events', DEFAULT_EVENTS);
  }

  public saveEvents(events: NSSEvent[]): void {
    this.set('events', events);
  }

  // Registrations
  public getRegistrations(): Registration[] {
    return this.get('registrations', DEFAULT_REGISTRATIONS);
  }

  public saveRegistrations(regs: Registration[]): void {
    this.set('registrations', regs);
  }

  // Attendance
  public getAttendance(): AttendanceRecord[] {
    return this.get('attendance', DEFAULT_ATTENDANCE);
  }

  public saveAttendance(recs: AttendanceRecord[]): void {
    this.set('attendance', recs);
  }

  // Announcements
  public getAnnouncements(): Announcement[] {
    return this.get('announcements', DEFAULT_ANNOUNCEMENTS);
  }

  public saveAnnouncements(ann: Announcement[]): void {
    this.set('announcements', ann);
  }

  // Certificates
  public getCertificates(): Certificate[] {
    return this.get('certificates', DEFAULT_CERTIFICATES);
  }

  public saveCertificates(certs: Certificate[]): void {
    this.set('certificates', certs);
  }

  // Point Rules
  public getPointRules(): PointRule[] {
    return this.get('point_rules', DEFAULT_POINT_RULES);
  }

  public savePointRules(rules: PointRule[]): void {
    this.set('point_rules', rules);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.get('audit_logs', DEFAULT_AUDIT_LOGS);
  }

  public saveAuditLogs(logs: AuditLog[]): void {
    this.set('audit_logs', logs);
  }

  public addAuditLog(operator: string, action: string, details: string, type: 'AUTH' | 'EVENT' | 'ATTENDANCE' | 'SYSTEM'): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      operator,
      action,
      details,
      type
    });
    this.saveAuditLogs(logs.slice(0, 500)); // Limit to last 500 logs
  }

  // Complex Operations
  public registerForEvent(studentId: string, eventId: string): { status: 'REGISTERED' | 'WAITLISTED', error?: string } {
    const event = this.getEvents().find(e => e.id === eventId);
    if (!event) return { status: 'WAITLISTED', error: 'Event not found' };

    const regs = this.getRegistrations();
    const alreadyReg = regs.find(r => r.eventId === eventId && r.studentId === studentId);
    if (alreadyReg) return { status: alreadyReg.status, error: 'Already registered' };

    const count = regs.filter(r => r.eventId === eventId && r.status === 'REGISTERED').length;
    let status: 'REGISTERED' | 'WAITLISTED' = 'REGISTERED';

    if (count >= event.maxParticipants) {
      status = 'WAITLISTED';
    }

    regs.push({
      id: `reg-${Math.random().toString(36).substring(2, 11)}`,
      eventId,
      studentId,
      timestamp: new Date().toISOString(),
      status
    });

    this.saveRegistrations(regs);

    // If registered, trigger notification log
    const user = this.getUsers().find(u => u.id === studentId);
    this.addAuditLog(user?.name || 'Student', 'EVENT_REGISTRATION', `Registered student for ${event.title} (${status})`, 'EVENT');

    return { status };
  }

  public updateAttendanceStatus(recId: string, newStatus: 'APPROVED' | 'REJECTED', coordinatorName: string): void {
    const recs = this.getAttendance();
    const idx = recs.findIndex(r => r.id === recId);
    if (idx === -1) return;

    recs[idx].status = newStatus;
    recs[idx].verifiedBy = coordinatorName;

    const studentId = recs[idx].studentId;
    const eventId = recs[idx].eventId;

    this.saveAttendance(recs);

    if (newStatus === 'APPROVED') {
      // Award points and volunteer hours
      const event = this.getEvents().find(e => e.id === eventId);
      const users = this.getUsers();
      const userIdx = users.findIndex(u => u.id === studentId);

      if (userIdx !== -1 && event) {
        const rules = this.getPointRules();
        const basePoints = rules.find(r => r.key === 'attendEvent')?.points || 10;
        const volBonus = users[userIdx].role === 'Volunteer' ? (rules.find(r => r.key === 'volunteer')?.points || 20) : 0;
        const totalAwarded = basePoints + volBonus;

        users[userIdx].nssPoints += totalAwarded;
        users[userIdx].volunteerHours += event.duration;

        // Recalculate Attendance Pct
        const pastEvents = this.getEvents().filter(e => new Date(e.date) <= new Date());
        const totalPast = pastEvents.length;
        const attendedPast = recs.filter(r => r.studentId === studentId && r.status === 'APPROVED').length;
        users[userIdx].attendancePct = totalPast > 0 ? Math.min(100, Math.round((attendedPast / totalPast) * 100)) : 100;

        // Auto unlock badges
        const earnedBadges = [...users[userIdx].badges];
        if (!earnedBadges.includes('First Event')) earnedBadges.push('First Event');
        if (users[userIdx].nssPoints >= 10 && !earnedBadges.includes('10 Points')) earnedBadges.push('10 Points');
        if (users[userIdx].nssPoints >= 50 && !earnedBadges.includes('50 Points')) earnedBadges.push('50 Points');
        if (users[userIdx].nssPoints >= 100 && !earnedBadges.includes('100 Points')) earnedBadges.push('100 Points');
        if (users[userIdx].nssPoints >= 250 && !earnedBadges.includes('250 Points')) earnedBadges.push('250 Points');
        if (users[userIdx].nssPoints >= 500 && !earnedBadges.includes('500 Points')) earnedBadges.push('500 Points');

        // Blood Donation Check
        if (event.category.toLowerCase().includes('blood') && !earnedBadges.includes('Blood Hero')) {
          earnedBadges.push('Blood Hero');
          users[userIdx].nssPoints += rules.find(r => r.key === 'bloodDonation')?.points || 30;
        }

        // Green Warrior Check
        if (event.category.toLowerCase().includes('environmental') && !earnedBadges.includes('Green Warrior')) {
          earnedBadges.push('Green Warrior');
          users[userIdx].nssPoints += rules.find(r => r.key === 'treePlantation')?.points || 25;
        }

        users[userIdx].badges = earnedBadges;
        users[userIdx].updatedAt = new Date().toISOString();
        this.saveUsers(users);

        this.addAuditLog(
          coordinatorName,
          'APPROVED_ATTENDANCE',
          `Approved ${users[userIdx].name} for ${event.title}. Awarded ${totalAwarded} points & ${event.duration} hours.`,
          'ATTENDANCE'
        );
      }
    } else {
      this.addAuditLog(
        coordinatorName,
        'REJECTED_ATTENDANCE',
        `Rejected attendance record for ${recs[idx].studentName} in eventId: ${eventId}`,
        'ATTENDANCE'
      );
    }
  }

  public async resetDatabase(): Promise<void> {
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      if (res.ok) {
        const serverData = await res.json();
        for (const [key, val] of Object.entries(serverData)) {
          localStorage.setItem(`nss_${key}`, JSON.stringify(val));
        }
        localStorage.setItem('nss_initialized', 'true');
        return;
      }
    } catch (err) {
      console.error('Error resetting server database', err);
    }

    localStorage.removeItem('nss_users');
    localStorage.removeItem('nss_events');
    localStorage.removeItem('nss_announcements');
    localStorage.removeItem('nss_registrations');
    localStorage.removeItem('nss_attendance');
    localStorage.removeItem('nss_certificates');
    localStorage.removeItem('nss_point_rules');
    localStorage.removeItem('nss_audit_logs');
    localStorage.removeItem('nss_initialized');
    this.init();
    this.addAuditLog('Admin', 'DATABASE_RESTORED', 'Database reset to default seed data.', 'SYSTEM');
  }
}

export const db = new LocalStorageDatabase();
db.init();

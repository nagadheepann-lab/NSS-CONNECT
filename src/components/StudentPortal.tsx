/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, UserProfile, NSSEvent, Certificate, Announcement, Registration } from '../utils/db';
import { 
  Award, Calendar, CheckCircle2, Clock, Download, ExternalLink, 
  Eye, Globe, Heart, Info, MapPin, QrCode, Search, Sparkles, TrendingUp, Zap, HelpCircle, Bell
} from 'lucide-react';

interface StudentPortalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export default function StudentPortal({ user, onUpdateUser }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'badges' | 'certificates' | 'calendar'>('dashboard');
  
  // Database local states
  const [events, setEvents] = useState<NSSEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sdgFilter, setSdgFilter] = useState('All');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [gpsSimulated, setGpsSimulated] = useState({ lat: 12.7512, lng: 80.1981 });
  const [accuracySimulated, setAccuracySimulated] = useState(8);

  useEffect(() => {
    refreshDBState();
  }, [user]);

  const refreshDBState = () => {
    setEvents(db.getEvents());
    setRegistrations(db.getRegistrations());
    setCertificates(db.getCertificates().filter(c => c.studentId === user.id));
    setAnnouncements(db.getAnnouncements());
  };

  const handleRegister = (eventId: string) => {
    const res = db.registerForEvent(user.id, eventId);
    if (res.error) {
      alert(res.error);
    } else {
      // Refresh state
      refreshDBState();
      // Update local profile state from db
      const freshUser = db.getUsers().find(u => u.id === user.id);
      if (freshUser) onUpdateUser(freshUser);
    }
  };

  // Simulate scanning QR Code
  const handleSimulateScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScanStatus(null);

    if (!scannedCode.trim()) {
      setScanStatus({ success: false, msg: 'Invalid QR Code structure or payload.' });
      return;
    }

    // Typical signature structure: NSS-QR-EVENT_ID-TIMESTAMP
    const parts = scannedCode.split('-');
    if (parts[0] !== 'NSS' || parts[1] !== 'QR' || !parts[2]) {
      setScanStatus({ success: false, msg: 'Invalid QR Signature. QR replay protection triggered.' });
      return;
    }

    const targetEventId = parts[2];
    const targetEvent = events.find(ev => ev.id === targetEventId);

    if (!targetEvent) {
      setScanStatus({ success: false, msg: 'Event associated with this QR was not found.' });
      return;
    }

    if (targetEvent.status !== 'ACTIVE' && targetEvent.status !== 'OPEN') {
      setScanStatus({ success: false, msg: 'This event is not actively running. Attendance window closed.' });
      return;
    }

    // Check if duplicate attendance
    const attendanceRecords = db.getAttendance();
    const isDuplicate = attendanceRecords.some(r => r.studentId === user.id && r.eventId === targetEventId);
    if (isDuplicate) {
      setScanStatus({ success: false, msg: 'Duplicate scan blocked: Your attendance is already logged.' });
      return;
    }

    // Success - add attendance record as pending
    const recordId = `att-${Math.random().toString(36).substring(2, 11)}`;
    const newRecord = {
      id: recordId,
      eventId: targetEventId,
      eventTitle: targetEvent.title,
      studentId: user.id,
      studentName: user.name,
      studentRoll: user.rollNumber,
      timestamp: new Date().toISOString(),
      status: 'PENDING' as const,
      gpsLocation: { lat: gpsSimulated.lat, lng: gpsSimulated.lng, accuracy: accuracySimulated },
      device: `${navigator.userAgent.substring(0, 40)} (SIMULATED_SCAN)`,
      qrCodeSignature: scannedCode
    };

    const currentRecs = db.getAttendance();
    currentRecs.unshift(newRecord);
    db.saveAttendance(currentRecs);

    db.addAuditLog(user.name, 'SCAN_ATTENDANCE', `Uploaded GPS attendance signature for event ${targetEvent.title} (Pending coordinator review)`, 'ATTENDANCE');

    setScanStatus({ 
      success: true, 
      msg: 'QR verified successfully! Your GPS location coordinates & device signatures have been securely logged. Awaiting final NSS Coordinator approval.' 
    });
    
    setScannedCode('');
    refreshDBState();
  };

  const getEventRegistrationStatus = (eventId: string) => {
    const reg = registrations.find(r => r.eventId === eventId && r.studentId === user.id);
    return reg ? reg.status : null;
  };

  // Static Badges configuration
  const allBadgesDef = [
    { name: 'First Event', desc: 'Participate and get verified in your very first NSS event.', color: 'from-blue-500 to-cyan-400' },
    { name: '10 Points', desc: 'Reach 10 cumulative points on your profile tracker.', color: 'from-amber-500 to-yellow-400' },
    { name: '50 Points', desc: 'Reach 50 cumulative points on your profile tracker.', color: 'from-teal-500 to-emerald-400' },
    { name: '100 Points', desc: 'Reach 100 cumulative points on your profile tracker.', color: 'from-purple-500 to-pink-500' },
    { name: '250 Points', desc: 'Gain 250 points, entering elite tier rankings.', color: 'from-rose-500 to-orange-500' },
    { name: '500 Points', desc: 'Gain 500 points, achieving NSS Lifetime Legend tier.', color: 'from-blue-600 to-indigo-600' },
    { name: 'Blood Hero', desc: 'Donate blood during a certified NSS Medical Camp.', color: 'from-red-600 to-rose-500' },
    { name: 'Green Warrior', desc: 'Plant a sapling and take care of it in Eco-drives.', color: 'from-green-500 to-emerald-400' },
    { name: 'Consistency', desc: 'Maintain an attendance rate of 90% or above.', color: 'from-orange-500 to-yellow-500' },
    { name: 'Top Volunteer', desc: 'Logged 80+ active hours on field assignments.', color: 'from-violet-500 to-fuchsia-500' },
    { name: 'Event Organizer', desc: 'Coordinated and lead an approved NSS campaign.', color: 'from-pink-500 to-rose-400' },
  ];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    const matchesSDG = sdgFilter === 'All' || e.sdgGoal.includes(sdgFilter);
    return matchesSearch && matchesCategory && matchesSDG;
  });

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider">Student Mode</span>
          <h2 className="text-xl font-bold text-white tracking-tight">NSS Enrolled Workspace</h2>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'campaigns' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Explore campaigns</button>
          <button onClick={() => setActiveTab('badges')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'badges' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Badges ({user.badges.length})</button>
          <button onClick={() => setActiveTab('certificates')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'certificates' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>My Certificates ({certificates.length})</button>
          <button onClick={() => setActiveTab('calendar')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'calendar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Calendar</button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-950/40 border border-blue-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Active Streak: {user.streak} Days 🔥</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Welcome back, {user.name}!</h1>
              <p className="text-sm text-slate-400 mt-1">Roll Number: {user.rollNumber} | Department: {user.department} (Year {user.year})</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowScanModal(true)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/15 flex items-center gap-2 transition-all cursor-pointer">
                <QrCode className="w-4 h-4" /> Scan Attendance QR
              </button>
              <button onClick={() => setActiveTab('campaigns')} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer">
                Register Campaigns
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance %</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Min 75% req</span>
              </div>
              <div className="text-2xl font-black text-white mt-2">{user.attendancePct}%</div>
              <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${user.attendancePct}%` }}></div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NSS Points</span>
              <div className="text-2xl font-black text-blue-400 mt-2 flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                {user.nssPoints}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Lifetime points accumulated</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Volunteer Hours</span>
              <div className="text-2xl font-black text-white mt-2">{user.volunteerHours} hrs</div>
              <span className="text-[10px] text-slate-500 block mt-1">Logged on site</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leaderboard Rank</span>
              <div className="text-2xl font-black text-purple-400 mt-2">#18</div>
              <span className="text-[10px] text-slate-500 block mt-1">Among {db.getUsers().filter(u => u.role === 'Student').length + 50} students</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earned Achievements</span>
              <div className="text-2xl font-black text-white mt-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                {user.badges.length} Badges
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">({allBadgesDef.length - user.badges.length} locked remaining)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Progress Chart */}
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Monthly Progress Tracker</h3>
                  <p className="text-[11px] text-slate-400">NSS Activity engagement index for current academic term</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <TrendingUp className="w-3.5 h-3.5" /> +24% increase
                </div>
              </div>

              {/* Elegant SVG/CSS Bar Chart */}
              <div className="flex-1 flex items-end justify-between h-48 pt-4">
                {[
                  { month: 'Jan', val: 30, color: 'bg-blue-600' },
                  { month: 'Feb', val: 50, color: 'bg-blue-600' },
                  { month: 'Mar', val: 40, color: 'bg-blue-600' },
                  { month: 'Apr', val: 80, color: 'bg-blue-500' },
                  { month: 'May', val: 65, color: 'bg-blue-500' },
                  { month: 'Jun', val: 95, color: 'bg-indigo-500' },
                  { month: 'Jul', val: 75, color: 'bg-indigo-600', active: true }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex justify-center">
                      {/* Tooltip */}
                      <span className="absolute -top-8 bg-slate-900 border border-white/10 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 font-mono">
                        {item.val} pts
                      </span>
                      {/* Bar */}
                      <div 
                        style={{ height: `${item.val * 1.3}px` }}
                        className={`w-8 rounded-t-lg transition-all duration-500 ${item.active ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20' : `${item.color} opacity-40 hover:opacity-80`}`}
                      ></div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-2 font-mono">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Announcements Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-sm">NSS Bulletins</h3>
                </div>
                <div className="space-y-4 max-h-52 overflow-y-auto pr-1">
                  {announcements.filter(a => a.targetRole === 'All' || a.targetRole === 'Student').slice(0, 3).map((ann) => (
                    <div key={ann.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs hover:border-white/10 transition-all">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span className="text-blue-400 font-semibold">{ann.category}</span>
                        <span>{ann.date}</span>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{ann.title}</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div className="text-slate-500 text-xs text-center py-6">No current bulletins are posted.</div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
                <span>Verified by Dr. Aditi Iyer</span>
                <span className="font-mono">Updated today</span>
              </div>
            </div>
          </div>

          {/* Today's Schedule & My Campaigns */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">My Active Enrolments</h3>
                <p className="text-xs text-slate-400">NSS events you are registered in or waitlisted</p>
              </div>
              <button onClick={() => setActiveTab('campaigns')} className="text-xs text-blue-400 font-semibold hover:underline">Browse Campaigns &rarr;</button>
            </div>
            <div className="divide-y divide-white/5">
              {events.filter(e => registrations.some(r => r.eventId === e.id && r.studentId === user.id)).map((ev) => {
                const status = getEventRegistrationStatus(ev.id);
                return (
                  <div key={ev.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img src={ev.banner} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{ev.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ev.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {ev.venue}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {status === 'REGISTERED' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">CONFIRMED</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">WAITLISTED</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {events.filter(e => registrations.some(r => r.eventId === e.id && r.studentId === user.id)).length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  You are not registered for any upcoming campaigns. Head over to "Explore campaigns" to sign up!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE CAMPAIGNS TAB */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search active campaigns, categories, SDG goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Environmental Protection">Environmental</option>
                <option value="Health Awareness">Health</option>
                <option value="Social Service">Social Service</option>
              </select>

              <select 
                value={sdgFilter}
                onChange={(e) => setSdgFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All SDGs</option>
                <option value="SDG 3">SDG 3 Health</option>
                <option value="SDG 4">SDG 4 Education</option>
                <option value="SDG 15">SDG 15 Environment</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const regStatus = getEventRegistrationStatus(ev.id);
              const regsCount = registrations.filter(r => r.eventId === ev.id && r.status === 'REGISTERED').length;
              const isFull = regsCount >= ev.maxParticipants;
              const isExpired = new Date(ev.registrationDeadline) < new Date('2026-07-02');

              return (
                <div key={ev.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col group hover:border-white/20 transition-all duration-300">
                  <div className="relative h-44 overflow-hidden border-b border-white/5">
                    <img src={ev.banner} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[9px] font-bold text-blue-400 border border-white/10 uppercase tracking-widest">
                      {ev.category}
                    </span>
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-semibold text-slate-300">
                      {ev.sdgGoal}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">{ev.title}</h3>
                      <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">{ev.description}</p>
                      
                      <div className="space-y-2 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="line-clamp-1">{ev.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>{ev.date} | {ev.time} ({ev.duration} Hours field work)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Volunteer Lead: <strong className="text-slate-300">{ev.volunteerIncharge}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Capacity stats</span>
                        <span className="text-xs font-bold text-white font-mono">{regsCount} / {ev.maxParticipants} slots</span>
                      </div>

                      {regStatus ? (
                        <div className="flex items-center gap-1.5">
                          {regStatus === 'REGISTERED' ? (
                            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">Registered ✓</span>
                          ) : (
                            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold">Waitlisted ⏳</span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(ev.id)}
                          disabled={isExpired}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            isExpired ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed' :
                            isFull ? 'bg-amber-600 hover:bg-amber-500 text-white shadow shadow-amber-600/15' :
                            'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-600/15'
                          }`}
                        >
                          {isExpired ? 'Deadline Passed' : isFull ? 'Join Waitlist' : 'Enrol Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BADGES TAB */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/10 rounded-2xl">
            <h3 className="font-bold text-white text-base">Gamified Achievement Milestones</h3>
            <p className="text-xs text-slate-400 mt-1">NSS rewards active participants with collectible verified blockchain-ready micro-credentials. Unlock higher badges to climb global leaderboards!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {allBadgesDef.map((b, idx) => {
              const isUnlocked = user.badges.includes(b.name);
              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${
                    isUnlocked ? `bg-white/5 border-white/15 hover:border-white/20 hover:shadow-lg` : 'bg-[#0A0A0A]/30 border-white/5 opacity-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${b.color} flex items-center justify-center text-white shadow-lg`}>
                        <Award className="w-5 h-5" />
                      </div>
                      {isUnlocked ? (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">UNLOCKED</span>
                      ) : (
                        <span className="text-[9px] bg-white/5 text-slate-500 font-bold px-2 py-0.5 rounded border border-white/5">LOCKED</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{b.name}</h4>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{b.desc}</p>
                  </div>
                  {isUnlocked && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-allocated verified
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CERTIFICATES TAB */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Award className="w-5 h-5" /></span>
                    <span className="text-[10px] font-mono text-slate-500 tracking-wide">{cert.uniqueId}</span>
                  </div>
                  <h4 className="font-bold text-white text-base">{cert.eventTitle}</h4>
                  <p className="text-slate-400 text-xs mt-2">Issued to: <strong className="text-slate-200">{cert.studentName}</strong></p>
                  <p className="text-slate-400 text-xs mt-1">Logged work credits: <strong className="text-blue-400">{cert.hours} Hours</strong></p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                  <button 
                    onClick={() => setSelectedCertificate(cert)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> View Certificate
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedCertificate(cert);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            ))}

            {certificates.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-xs">No certificates are issued for your profile yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">Attendance records must be approved by the NSS Coordinator for credits to accumulate and generate certificates.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">NSS Term Calendar — July 2026</h3>
              <p className="text-xs text-slate-400">Keep track of key project dates, campaign schedules, and community meetups</p>
            </div>
            <button 
              onClick={() => {
                alert("Outlook Calendar synced successfully! All NSS Connect schedules and deadlines have been written to your university Outlook account.");
                db.addAuditLog(user.name, 'SYNC_OUTLOOK_CALENDAR', 'Synced NSS Term calendar with institutional Outlook account.', 'SYSTEM');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/15"
            >
              <Globe className="w-4 h-4" /> Sync with Outlook Calendar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* The Calendar Grid */}
            <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-4 font-mono">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              <div className="grid grid-cols-7 gap-2 h-80">
                {Array.from({ length: 31 }).map((_, idx) => {
                  const day = idx + 1;
                  const hasEvent = day === 2 || day === 5 || day === 12;
                  const isToday = day === 2;

                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-xl p-2 flex flex-col justify-between transition-colors relative ${
                        isToday ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[10px] font-bold font-mono">{day}</span>
                      {hasEvent && (
                        <span className={`w-2 h-2 rounded-full mx-auto ${day === 2 ? 'bg-amber-400 animate-ping' : day === 5 ? 'bg-emerald-400' : 'bg-purple-400'}`}></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Event Sidebar */}
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm">Active Term Highlights</h3>
              
              <div className="p-4 bg-white/5 border-l-4 border-amber-500 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono">Today • Active Now</span>
                <h4 className="text-xs font-bold text-white">Emergency Blood Donation Camp</h4>
                <p className="text-[10px] text-slate-400">10:00 AM | Medical Centre</p>
              </div>

              <div className="p-4 bg-white/5 border-l-4 border-emerald-500 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest font-mono">July 5, 2026</span>
                <h4 className="text-xs font-bold text-white">Green Campus Tree Planting Drive</h4>
                <p className="text-[10px] text-slate-400">08:00 AM | Sports Ground Ring</p>
              </div>

              <div className="p-4 bg-white/5 border-l-4 border-purple-500 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest font-mono">July 12, 2026</span>
                <h4 className="text-xs font-bold text-white">Rural Primary Education Camp</h4>
                <p className="text-[10px] text-slate-400">09:30 AM | Kalavakkam Village</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCAN ATTENDANCE QR MODAL */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 relative">
            <button 
              onClick={() => { setShowScanModal(false); setScanStatus(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              &times; Close
            </button>

            <div className="flex items-center gap-2 mb-6">
              <QrCode className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-white">Simulate Attendance QR Scan</h3>
            </div>

            {scanStatus ? (
              <div className="space-y-6 text-center py-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${scanStatus.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {scanStatus.success ? <CheckCircle2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-bold">{scanStatus.success ? 'Scan Completed' : 'Scan Blocked'}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">{scanStatus.msg}</p>
                </div>
                <button 
                  onClick={() => { setShowScanModal(false); setScanStatus(null); }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSimulateScanSubmit} className="space-y-4">
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                  Every NSS event coordinates generating a highly encrypted QR signature on site. Scan it or type/paste the active signature generated by your Volunteer lead.
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Paste/Type Event QR Signature Code</label>
                  <input 
                    type="text" 
                    placeholder="E.g., NSS-QR-e-2-1719873600"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setScannedCode('NSS-QR-e-2-1719873600')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-slate-400 rounded hover:text-white"
                    >
                      Pre-fill Active Event (Blood Camp Drive) Code
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GPS latitude (Simulated)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={gpsSimulated.lat}
                      onChange={(e) => setGpsSimulated({ ...gpsSimulated, lat: parseFloat(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GPS Longitude (Simulated)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={gpsSimulated.lng}
                      onChange={(e) => setGpsSimulated({ ...gpsSimulated, lng: parseFloat(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  <span>Device fingerprint:</span>
                  <span className="text-blue-400 font-mono">Chrome / NSS-SafeOS / Local Geofencing Active (Accuracy: {accuracySimulated} meters)</span>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/15"
                >
                  <QrCode className="w-4 h-4" /> Simulate Attendance Handshake
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DETAILED DIGITAL CERTIFICATE VIEWER MODAL */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl bg-stone-900 border-4 border-double border-amber-600/40 rounded-3xl p-8 relative shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Elegant Vintage Watermark Elements */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-600/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-600/5 rounded-full blur-2xl"></div>

            {/* Inner Border */}
            <div className="border border-amber-600/20 p-8 rounded-2xl flex flex-col items-center justify-between text-center relative z-10">
              
              {/* Seal */}
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-10 h-10 text-amber-500" />
                <div className="text-left">
                  <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest font-mono">SHIV NADAR UNIVERSITY</h4>
                  <p className="text-[10px] text-slate-400">NATIONAL SERVICE SCHEME (NSS) CELL</p>
                </div>
              </div>

              <h2 className="text-3xl font-serif text-white italic font-light my-4">Certificate of Outstanding Merit</h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">This document validates that</p>
              
              <h1 className="text-3xl font-extrabold tracking-tight text-amber-400 font-serif border-b border-amber-600/30 pb-2 px-8 my-4">
                {selectedCertificate.studentName}
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-serif my-2">
                has successfully served as an active NSS participant and logged <strong className="text-white">{selectedCertificate.hours} Hours</strong> of verified on-field volunteer duties during the approved campaign
              </p>

              <h3 className="text-xl font-bold text-white italic font-serif my-2">
                "{selectedCertificate.eventTitle}"
              </h3>

              <p className="text-xs text-slate-400 font-serif my-2">
                coordinated and executed under the strict directives of the Ministry of Youth Affairs and Sports.
              </p>

              {/* Signatures & Verification */}
              <div className="w-full grid grid-cols-3 gap-6 items-end mt-8 pt-8 border-t border-white/5">
                <div className="flex flex-col items-center">
                  <span className="text-amber-500 font-serif text-xs italic">Dr. Aditi Iyer</span>
                  <div className="w-24 border-b border-slate-500/30 my-1"></div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">NSS Programme Coordinator</span>
                </div>

                {/* QR Code Validation */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg shadow">
                    {/* Simulated validation QR */}
                    <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h6v6H2V2zm2 2v2h2V4H4zm8-2h6v6h-6V2zm2 2v2h2V4h-2zM2 12h6v6H2v-6zm2 2v2h2v-2H4zm13-2h3v1h-1v2h1v1h-3v-4zm-3 2h2v2h-2v-2zm3 2h1v1h-1v-1zm1 1h2v1h-2v-1z" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 mt-2">ID: {selectedCertificate.uniqueId}</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-slate-300 font-serif text-xs italic">{selectedCertificate.issueDate}</span>
                  <div className="w-24 border-b border-slate-500/30 my-1"></div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Date of Issuance</span>
                </div>
              </div>

            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                &larr; Return
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/15"
              >
                <Download className="w-4 h-4" /> Save Document (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

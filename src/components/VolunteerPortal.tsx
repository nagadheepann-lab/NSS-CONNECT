/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, UserProfile, NSSEvent, AttendanceRecord } from '../utils/db';
import { 
  Calendar, Check, Clock, Eye, Layers, MapPin, Plus, QrCode, 
  Send, ShieldAlert, Sparkles, Trash2, Upload, Users, AlertCircle, FileText
} from 'lucide-react';

interface VolunteerPortalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export default function VolunteerPortal({ user, onUpdateUser }: VolunteerPortalProps) {
  const [activeTab, setActiveTab] = useState<'assigned' | 'create' | 'scanner' | 'reports' | 'settings'>('assigned');
  
  // Volunteer Key Rotation States
  const [newVolKey, setNewVolKey] = useState('');
  const [currentVolKey, setCurrentVolKey] = useState(db.getVolunteerKey());
  
  // Db States
  const [events, setEvents] = useState<NSSEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<UserProfile[]>([]);
  
  // Create Event state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    banner: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    venue: '',
    date: '',
    time: '09:00 AM',
    duration: 3,
    category: 'Environmental Protection',
    sdgGoal: 'SDG 15 - Life on Land',
    maxParticipants: 100,
    registrationDeadline: ''
  });

  // QR Gen state
  const [qrEventId, setQrEventId] = useState('');
  const [qrDurationMinutes, setQrDurationMinutes] = useState(15);
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(0);

  // Scanner Simulator state
  const [scanStudentId, setScanStudentId] = useState('');
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Reports state
  const [selectedReportEventId, setSelectedReportEventId] = useState('');
  const [reportText, setReportText] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    refreshDBState();
  }, [user]);

  // QR Timer Countdown
  useEffect(() => {
    if (qrCountdown <= 0) {
      setActiveQr(null);
      return;
    }
    const timer = setInterval(() => {
      setQrCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [qrCountdown]);

  const refreshDBState = () => {
    setEvents(db.getEvents().filter(e => e.volunteerIncharge === user.name || e.volunteerIncharge === 'Rahul Dev'));
    setAttendance(db.getAttendance());
    setRegisteredStudents(db.getUsers().filter(u => u.role === 'Student'));
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventId = `e-${Math.random().toString(36).substring(2, 9)}`;
    const freshEvent: NSSEvent = {
      id: eventId,
      ...newEvent,
      volunteerIncharge: user.name,
      status: 'OPEN'
    };

    const allEvents = db.getEvents();
    allEvents.push(freshEvent);
    db.saveEvents(allEvents);

    db.addAuditLog(user.name, 'CREATED_EVENT_REQUEST', `Volunteer requested draft for event "${newEvent.title}".`, 'EVENT');
    
    alert('Campaign successfully submitted! It is now active on the Student platform.');
    setActiveTab('assigned');
    refreshDBState();
    
    // Reset form
    setNewEvent({
      title: '',
      description: '',
      banner: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      venue: '',
      date: '',
      time: '09:00 AM',
      duration: 3,
      category: 'Environmental Protection',
      sdgGoal: 'SDG 15 - Life on Land',
      maxParticipants: 100,
      registrationDeadline: ''
    });
  };

  const handleGenerateQR = (eventId: string) => {
    setQrEventId(eventId);
    const mockSignature = `NSS-QR-${eventId}-${Math.floor(Date.now() / 1000)}`;
    setActiveQr(mockSignature);
    setQrCountdown(qrDurationMinutes * 60);

    db.addAuditLog(user.name, 'GENERATED_QR_SIGNATURE', `Generated temporary encryption QR code for eventId: ${eventId} (Expires in ${qrDurationMinutes}m)`, 'ATTENDANCE');
  };

  // Simulates scanning on behalf of students in sandbox environment
  const handleSimulateSandboxScan = (e: React.FormEvent) => {
    e.preventDefault();
    setScanStatus(null);

    if (!qrEventId) {
      setScanStatus('Please generate a secure QR Signature first.');
      return;
    }

    if (!scanStudentId) {
      setScanStatus('Please select a student from the active directory first.');
      return;
    }

    const targetStudent = db.getUsers().find(u => u.id === scanStudentId);
    if (!targetStudent) return;

    // Check if duplicate
    const allAtt = db.getAttendance();
    const duplicate = allAtt.some(a => a.eventId === qrEventId && a.studentId === scanStudentId);
    if (duplicate) {
      setScanStatus(`Duplicate scan blocked. ${targetStudent.name} is already logged.`);
      return;
    }

    // Insert attendance record
    const targetEvent = db.getEvents().find(ev => ev.id === qrEventId);
    const newRecord: AttendanceRecord = {
      id: `att-${Math.random().toString(36).substring(2, 11)}`,
      eventId: qrEventId,
      eventTitle: targetEvent?.title || 'Active Campaign',
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentRoll: targetStudent.rollNumber,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      gpsLocation: { lat: 12.7513, lng: 80.1983, accuracy: 5 },
      device: 'Android Emulator - Edge Mobile Sandbox',
      qrCodeSignature: activeQr || 'SIMULATED-QR'
    };

    allAtt.unshift(newRecord);
    db.saveAttendance(allAtt);

    db.addAuditLog(user.name, 'SIMULATED_HANDSHAKE', `Simulated QR attendance scan for ${targetStudent.name} (${targetStudent.rollNumber}) in ${targetEvent?.title}`, 'ATTENDANCE');

    setScanStatus(`✓ Handshake complete! Recorded attendance for ${targetStudent.name} with GPS validation coordinates. Status pending coordinator approval.`);
    setScanStudentId('');
    refreshDBState();
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportEventId || !reportText) return;

    db.addAuditLog(user.name, 'SUBMITTED_EVENT_REPORT', `Submitted photo gallery & outcome summary report for event ${selectedReportEventId}`, 'EVENT');
    setReportSubmitted(true);
    setReportText('');
    setUploadedPhotos([]);
    setTimeout(() => {
      setReportSubmitted(false);
      setActiveTab('assigned');
    }, 2500);
  };

  const simulatePhotoUpload = () => {
    const photos = [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400'
    ];
    const picked = photos[Math.floor(Math.random() * photos.length)];
    if (!uploadedPhotos.includes(picked)) {
      setUploadedPhotos([...uploadedPhotos, picked]);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      {/* Sub Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">Volunteer Mode</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Campaign Operations</h2>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('assigned')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'assigned' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>My Events</button>
          <button onClick={() => setActiveTab('create')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'create' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Create Campaign</button>
          <button onClick={() => setActiveTab('scanner')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'scanner' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>QR & Terminal Scan</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Submit Reports</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Portal Settings</button>
        </div>
      </div>

      {/* MY EVENTS TAB */}
      {activeTab === 'assigned' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const pendingScans = attendance.filter(a => a.eventId === ev.id && a.status === 'PENDING').length;

              return (
                <div key={ev.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-bold uppercase tracking-wider">{ev.category}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {ev.id}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base line-clamp-1">{ev.title}</h3>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{ev.description}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/5 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400 shrink-0" /> {ev.venue}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400 shrink-0" /> {ev.date} | {ev.time}</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-slate-400 font-semibold px-1 mb-1">
                      <span>Pending scans approval:</span>
                      <span className={pendingScans > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>{pendingScans} pending</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setActiveTab('scanner'); handleGenerateQR(ev.id); }}
                        className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" /> Generate Attendance QR
                      </button>
                      <button 
                        onClick={() => { setSelectedReportEventId(ev.id); setActiveTab('reports'); }}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        Write Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-xs">You are not assigned to coordinate any events currently.</p>
                <p className="text-[11px] text-slate-600 mt-1">Coordinators assign events to specific volunteers to manage scanners and upload reports.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN TAB */}
      {activeTab === 'create' && (
        <div className="max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-base">Draft New Community Campaign</h3>
          </div>

          <form onSubmit={handleCreateEventSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Title</label>
                <input 
                  type="text" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="E.g., Coastal Conservation Beach Drive"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description & Impact Scope</label>
                <textarea 
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Describe the activities, benefits, goals, SDG support details..."
                  rows={4}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <select 
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                >
                  <option value="Environmental Protection">Environmental Protection</option>
                  <option value="Health Awareness">Health Awareness</option>
                  <option value="Social Service">Social Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">SDG Goal Metric</label>
                <select 
                  value={newEvent.sdgGoal}
                  onChange={(e) => setNewEvent({ ...newEvent, sdgGoal: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                >
                  <option value="SDG 3 - Good Health and Well-being">SDG 3: Good Health & Well-being</option>
                  <option value="SDG 4 - Quality Education">SDG 4: Quality Education</option>
                  <option value="SDG 15 - Life on Land">SDG 15: Life on Land</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Venue Location</label>
                <input 
                  type="text" 
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="E.g., Kalavakkam Village Square"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Scheduled</label>
                <input 
                  type="date" 
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Starting Time</label>
                <input 
                  type="text" 
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  placeholder="E.g., 08:30 AM"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (Hours Work Credits)</label>
                <input 
                  type="number" 
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) || 3 })}
                  min={1}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Capacity (Max Students Enrolled)</label>
                <input 
                  type="number" 
                  value={newEvent.maxParticipants}
                  onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: parseInt(e.target.value) || 100 })}
                  min={10}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Enrolment Deadline</label>
                <input 
                  type="date" 
                  value={newEvent.registrationDeadline}
                  onChange={(e) => setNewEvent({ ...newEvent, registrationDeadline: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button 
                type="submit" 
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/15 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Launch Campaign Active
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR & SCANNER SANDBOX */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Generator Frame */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white text-base">Generate Attendance Security QR</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose one of your assigned campaigns below to activate geofenced cryptographic QR codes on site. Students scanning this QR within the selected timeframe will automatically register coordinates.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Active Campaign</label>
                  <select 
                    value={qrEventId}
                    onChange={(e) => { setQrEventId(e.target.value); setActiveQr(null); }}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="">Select a Campaign...</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">QR Rotation Lifespan (Minutes)</label>
                  <select 
                    value={qrDurationMinutes}
                    onChange={(e) => setQrDurationMinutes(parseInt(e.target.value))}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value={5}>5 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center justify-center">
              {activeQr ? (
                <div className="space-y-4 text-center">
                  <div className="bg-white p-4 rounded-2xl shadow-xl w-48 h-48 flex items-center justify-center mx-auto">
                    {/* Crispy Simulated Custom vector QR */}
                    <svg className="w-full h-full text-stone-900" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h6v6H2V2zm2 2v2h2V4H4zm8-2h6v6h-6V2zm2 2v2h2V4h-2zM2 12h6v6H2v-6zm2 2v2h2v-2H4zm13-2h3v1h-1v2h1v1h-3v-4zm-3 2h2v2h-2v-2zm3 2h1v1h-1v-1zm1 1h2v1h-2v-1z M12 12h2v2h-2v-2zm2-10h2v2h-2V2zm4 4h2v2h-2V6zM6 14h2v2H6v-2zm12 2h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold animate-pulse">LIVE SIGNATURE SECURE</span>
                    <p className="text-xs font-semibold text-slate-300 font-mono mt-1 break-all bg-white/5 p-2 rounded-lg">{activeQr}</p>
                    <p className="text-xs text-amber-500 font-bold font-mono">
                      Expires in: {Math.floor(qrCountdown / 60)}m {qrCountdown % 60}s
                    </p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => qrEventId ? handleGenerateQR(qrEventId) : alert('Please select a campaign')}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl py-3 px-4 text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/15 cursor-pointer"
                >
                  <QrCode className="w-4.5 h-4.5" /> Initialize Cryptographic Handshake
                </button>
              )}
            </div>
          </div>

          {/* Interactive Sandbox Simulator */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Student Attendance Simulator</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Testing Sandbox Workspace:</strong> Since real mobile hardware & camera scanning can be restricted inside standard browser sandboxes, use this console to mock a student's real-time physical attendance QR sweep securely.
              </p>

              {scanStatus && (
                <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl text-xs text-slate-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{scanStatus}</span>
                </div>
              )}

              <form onSubmit={handleSimulateSandboxScan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Student Enrolled</label>
                  <select 
                    value={scanStudentId}
                    onChange={(e) => setScanStudentId(e.target.value)}
                    required
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="">Choose Student profile...</option>
                    {registeredStudents.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.rollNumber}) — Year {st.year}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-500 space-y-1">
                  <div>• GPS Target: <strong className="text-slate-300">12.7513° N, 80.1982° E</strong></div>
                  <div>• Device Fingerprint: <strong className="text-slate-300">Edge Mobile OS (Geofencing Active)</strong></div>
                  <div>• Active Signature: <strong className="text-slate-300 font-mono text-[10px]">{activeQr ? 'Active Signature Loaded ✓' : 'NO ACTIVE QR'}</strong></div>
                </div>

                <button 
                  type="submit" 
                  disabled={!activeQr}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Check className="w-4 h-4" /> Simulate Device QR Scan Handshake
                </button>
              </form>
            </div>

            <div className="text-center text-[10px] text-slate-600 leading-relaxed pt-4 border-t border-white/5">
              Secure key validation, token anti-replay filters, and strict coordinate checks are active on simulated records.
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-base">Submit On-Field Campaign Outcomes</h3>
          </div>

          {reportSubmitted ? (
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold">Report Filed Successfully</h4>
                <p className="text-slate-400 text-xs">Event photo records, logs, and summaries have been updated on coordinator ledger.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Targeted Campaign</label>
                <select 
                  value={selectedReportEventId}
                  onChange={(e) => setSelectedReportEventId(e.target.value)}
                  required
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                >
                  <option value="">Choose Campaign...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Accomplishments & Outcome Metrics</label>
                <textarea 
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Detail campaign activities. E.g., Cleaned 1.2km coast, planted 150 neem trees, 45 units blood gathered..."
                  rows={4}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Upload Gallery Photos (Simulated)</label>
                <div className="grid grid-cols-4 gap-4">
                  {uploadedPhotos.map((src, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {uploadedPhotos.length < 3 && (
                    <button 
                      type="button"
                      onClick={simulatePhotoUpload}
                      className="aspect-video bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mb-1 text-slate-500" />
                      <span className="text-[10px]">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-600/15 transition-all cursor-pointer"
                >
                  Submit Executive Review Report
                </button>
              </div>
            </form>
          )}
        </div>
       )}

      {/* PORTAL SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-base">Volunteer Key Rotation Settings</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Rotate the secure access key used to authorize and gain entrance to this Volunteer Operations Portal.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Volunteer Key</h4>
                <p className="text-sm font-black text-white font-mono mt-1">{currentVolKey}</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <input 
                type="text" 
                placeholder="Enter new access key..."
                value={newVolKey}
                onChange={(e) => setNewVolKey(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button 
                onClick={() => {
                  const trimmed = newVolKey.trim();
                  if (!trimmed) {
                    alert('Error: Key cannot be empty.');
                    return;
                  }
                  db.setVolunteerKey(trimmed);
                  setCurrentVolKey(trimmed);
                  setNewVolKey('');
                  alert('Success: Volunteer access key has been rotated.');
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
              >
                Rotate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

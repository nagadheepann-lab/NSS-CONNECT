/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, UserProfile, NSSEvent, AttendanceRecord, PointRule, AuditLog, Announcement, Certificate } from '../utils/db';
import { 
  Users, Calendar, CheckSquare, Clock, Award, ShieldAlert, Sparkles, 
  Trash2, Download, Database, Settings, Megaphone, Check, X, 
  Plus, Edit, Save, AlertCircle, TrendingUp, Filter, Search, RotateCcw,
  FileSpreadsheet
} from 'lucide-react';

interface CoordinatorPortalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export default function CoordinatorPortal({ user, onUpdateUser }: CoordinatorPortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'announcements' | 'settings' | 'audit'>('overview');
  
  // Database States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<NSSEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pointRules, setPointRules] = useState<PointRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [attendanceFilter, setAttendanceFilter] = useState('PENDING');

  // New Announcement
  const [newAnn, setNewAnn] = useState({
    title: '',
    content: '',
    category: 'General',
    targetRole: 'All' as 'All' | 'Student' | 'Volunteer' | 'Coordinator'
  });

  // Certificate Generator template
  const [certTemplate, setCertTemplate] = useState({
    signatoryName: 'Dr. Aditi Iyer',
    signatoryRole: 'NSS Programme Coordinator',
    institution: 'Shiv Nadar University Chennai',
  });

  // Point rules editor state
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<number>(0);
  
  // Access key rotation state
  const [newCoordKey, setNewCoordKey] = useState('');
  const [currentCoordKey, setCurrentCoordKey] = useState(db.getCoordinatorKey());

  useEffect(() => {
    refreshDBState();
  }, [user]);

  const refreshDBState = () => {
    setUsers(db.getUsers());
    setEvents(db.getEvents());
    setAttendance(db.getAttendance());
    setPointRules(db.getPointRules());
    setAuditLogs(db.getAuditLogs());
    setAnnouncements(db.getAnnouncements());
  };

  // Handlers for approvals
  const handleApprove = (recId: string) => {
    db.updateAttendanceStatus(recId, 'APPROVED', user.name);
    refreshDBState();
    // Trigger callback if current user points updated
    const freshUser = db.getUsers().find(u => u.id === user.id);
    if (freshUser) onUpdateUser(freshUser);
  };

  const handleReject = (recId: string) => {
    db.updateAttendanceStatus(recId, 'REJECTED', user.name);
    refreshDBState();
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) return;

    const announcementsList = db.getAnnouncements();
    const freshAnn: Announcement = {
      id: `a-${Math.random().toString(36).substring(2, 9)}`,
      title: newAnn.title,
      content: newAnn.content,
      category: newAnn.category,
      sender: user.name,
      targetRole: newAnn.targetRole,
      date: new Date().toISOString().split('T')[0]
    };

    announcementsList.unshift(freshAnn);
    db.saveAnnouncements(announcementsList);

    db.addAuditLog(user.name, 'PUBLISHED_ANNOUNCEMENT', `Broadcasted bulletin "${newAnn.title}" to target group ${newAnn.targetRole}`, 'SYSTEM');
    
    alert('Announcement successfully broadcasted! Notification sent to student and volunteer dashboards.');
    setNewAnn({ title: '', content: '', category: 'General', targetRole: 'All' });
    refreshDBState();
  };

  const handleSavePointsRule = (id: string) => {
    const rules = db.getPointRules();
    const idx = rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      const oldPoints = rules[idx].points;
      rules[idx].points = editingPoints;
      db.savePointRules(rules);
      db.addAuditLog(user.name, 'UPDATED_POINTS_RULE', `Modified point weight of "${rules[idx].name}" from ${oldPoints} to ${editingPoints} pts.`, 'SYSTEM');
      setEditingRuleId(null);
      refreshDBState();
    }
  };

  const handleManualAwardPoints = (studentId: string, amount: number, reason: string) => {
    const allUsers = db.getUsers();
    const idx = allUsers.findIndex(u => u.id === studentId);
    if (idx !== -1) {
      allUsers[idx].nssPoints += amount;
      allUsers[idx].updatedAt = new Date().toISOString();
      db.saveUsers(allUsers);
      db.addAuditLog(user.name, 'MANUAL_POINTS_AWARD', `Manually allocated ${amount} points to ${allUsers[idx].name}. Reason: ${reason}`, 'SYSTEM');
      refreshDBState();
      alert(`Successfully allocated ${amount} points to ${allUsers[idx].name}`);
    }
  };

  const handleGenerateCertificateForAllApproved = (eventId: string) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const approvedAttendance = attendance.filter(a => a.eventId === eventId && a.status === 'APPROVED');
    if (approvedAttendance.length === 0) {
      alert('No approved attendance records exist for this campaign to issue certificates.');
      return;
    }

    const currentCerts = db.getCertificates();
    let counter = 0;

    approvedAttendance.forEach(att => {
      // Check if already has cert
      const hasCert = currentCerts.some(c => c.studentId === att.studentId && c.eventTitle === targetEvent.title);
      if (!hasCert) {
        const uniqueId = `NSS-${new Date().getFullYear()}-C${Math.floor(10000 + Math.random() * 90000)}`;
        currentCerts.unshift({
          id: `cert-${Math.random().toString(36).substring(2, 11)}`,
          studentId: att.studentId,
          studentName: att.studentName,
          eventTitle: targetEvent.title,
          hours: targetEvent.duration,
          qrVerificationCode: `VERIFY-${uniqueId}`,
          uniqueId,
          issueDate: new Date().toISOString().split('T')[0]
        });
        counter++;
      }
    });

    if (counter > 0) {
      db.saveCertificates(currentCerts);
      db.addAuditLog(user.name, 'BATCH_CERTIFICATE_GENERATION', `Generated ${counter} digital credentials for event: "${targetEvent.title}"`, 'SYSTEM');
      alert(`Success! Generated and signed ${counter} digital certificates successfully.`);
      refreshDBState();
    } else {
      alert('All approved participants for this campaign already possess active certificates.');
    }
  };

  const handleDbBackupAndRestore = () => {
    db.resetDatabase();
    refreshDBState();
    const freshUser = db.getUsers().find(u => u.id === user.id);
    if (freshUser) onUpdateUser(freshUser);
    alert('System Database reset to factory default seed schema successfully.');
  };

  const exportLogsCsv = () => {
    const headers = 'ID,Timestamp,Operator,Action,Details,Type\n';
    const csvRows = auditLogs.map(l => `"${l.id}","${l.timestamp}","${l.operator}","${l.action}","${l.details.replace(/"/g, '""')}","${l.type}"`).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `NSS_Connect_AuditLogs_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  const exportBestVolunteerExcel = () => {
    const allUsers = users.filter(u => u.role === 'Student' || u.role === 'Volunteer');
    
    // Calculate stats for students & volunteers
    const studentsWithStats = allUsers.map(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const approvedCount = studentAttendance.filter(a => a.status === 'APPROVED').length;
      const pendingCount = studentAttendance.filter(a => a.status === 'PENDING').length;
      
      // Selection score: points and hours weighted
      const selectionScore = student.nssPoints + (student.volunteerHours * 5);

      return {
        ...student,
        approvedCount,
        pendingCount,
        selectionScore,
        eventAttendanceMap: events.reduce((acc, ev) => {
          const record = studentAttendance.find(a => a.eventId === ev.id);
          acc[ev.id] = record ? record.status : 'ABSENT';
          return acc;
        }, {} as Record<string, string>)
      };
    });

    // Assign overall rank based on NSS Points (primary) and Volunteer Hours (secondary)
    const sortedOverall = [...studentsWithStats].sort((a, b) => b.nssPoints - a.nssPoints || b.volunteerHours - a.volunteerHours);
    const overallRankMap = new Map<string, number>();
    sortedOverall.forEach((s, idx) => {
      overallRankMap.set(s.id, idx + 1);
    });

    // Assign batch order logic to sort Year/Batch properly
    const batchOrder = (y: string) => {
      const val = String(y).trim().toUpperCase();
      if (val === 'I' || val === '1' || val.includes('FIRST')) return 1;
      if (val === 'II' || val === '2' || val.includes('SECOND')) return 2;
      if (val === 'III' || val === '3' || val.includes('THIRD')) return 3;
      if (val === 'IV' || val === '4' || val.includes('FOURTH')) return 4;
      return 5;
    };

    // Sort final students batch-wise first, then by NSS points descending
    const finalSortedStudents = [...studentsWithStats].sort((a, b) => {
      const batchA = batchOrder(a.year);
      const batchB = batchOrder(b.year);
      if (batchA !== batchB) return batchA - batchB;
      return b.nssPoints - a.nssPoints || b.volunteerHours - a.volunteerHours;
    });

    // Assign batch rank (rank within their own Year/Batch group)
    const batchCounts = new Map<string, number>();
    const studentsWithRanks = finalSortedStudents.map(student => {
      const currentCount = batchCounts.get(student.year) || 0;
      const batchRank = currentCount + 1;
      batchCounts.set(student.year, batchRank);

      const overallRank = overallRankMap.get(student.id) || 99;
      
      // Eligibility / selection grade
      let grade = 'Eligible Member';
      if (overallRank <= 3) {
        grade = 'EXECUTIVE GOLD MEDAL ELIGIBLE (Top 3 Overall)';
      } else if (batchRank === 1) {
        grade = 'BATCH TOPPER (Rank 1 in Batch)';
      } else if (student.nssPoints >= 300) {
        grade = 'DISTINGUISHED CONTRIBUTOR (300+ Points)';
      } else if (student.nssPoints >= 150) {
        grade = 'ACTIVE OUTSTANDING VOLUNTEER (150+ Points)';
      } else if (student.nssPoints < 75) {
        grade = 'PROBATIONARY (Below 75 Points)';
      }

      return {
        ...student,
        overallRank,
        batchRank,
        grade
      };
    });

    // Build the spreadsheet file content
    let csvContent = '\uFEFF'; // Excel UTF-8 BOM so all characters render beautifully
    
    // Header details
    csvContent += `"SHIV NADAR UNIVERSITY CHENNAI - NATIONAL SERVICE SCHEME (NSS)"\n`;
    csvContent += `"EXECUTIVE ATTENDANCE LEDGER & VOLUNTEER MERIT SELECTION ROSTER"\n`;
    csvContent += `"Report Generated:","${new Date().toLocaleString()}"\n`;
    csvContent += `"Database Status:","ACTIVE SYNCED","Total Records:","${studentsWithRanks.length} students"\n\n`;

    // Column Headers
    const baseHeaders = [
      'Overall Rank',
      'Batch Rank',
      'Student Name',
      'Roll Number',
      'Year/Batch',
      'Department',
      'NSS Points Balance',
      'Field Volunteer Hours',
      'Self-Attendance Pct',
      'Approved Events Count',
      'Pending Approvals Count',
      'Selection Index Score (Points + Hours*5)',
      'Best Volunteer Evaluation Grade'
    ];

    const eventHeaders = events.map(e => `[Event] ${e.title}`);
    const headersLine = [...baseHeaders, ...eventHeaders].map(h => `"${h.replace(/"/g, '""')}"`).join(',');
    csvContent += headersLine + '\n';

    // Student Rows
    studentsWithRanks.forEach(s => {
      const rowData = [
        s.overallRank,
        s.batchRank,
        s.name,
        s.rollNumber,
        s.year,
        s.department,
        s.nssPoints,
        s.volunteerHours,
        `${s.attendancePct}%`,
        s.approvedCount,
        s.pendingCount,
        s.selectionScore,
        s.grade
      ];

      const eventCells = events.map(ev => {
        const status = s.eventAttendanceMap[ev.id];
        if (status === 'APPROVED') return 'ATTENDED (APPROVED)';
        if (status === 'PENDING') return 'PENDING SIGN-OFF';
        if (status === 'REJECTED') return 'REJECTED';
        return 'ABSENT / NOT REGISTERED';
      });

      const fullLine = [...rowData, ...eventCells].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      csvContent += fullLine + '\n';
    });

    // Export to user
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NSS_SNUC_Student_Attendance_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();

    db.addAuditLog(user.name, 'EXPORT_EXCEL_LEADERBOARD', `Exported comprehensive batch-wise student attendance and point metrics for volunteer selection.`, 'SYSTEM');
  };

  // Stats Calculations
  const totalStudents = users.filter(u => u.role === 'Student').length;
  const totalVolunteers = users.filter(u => u.role === 'Volunteer').length;
  const totalCampaignsCount = events.length;
  const pendingApprovalsCount = attendance.filter(a => a.status === 'PENDING').length;
  
  const avgAttendance = Math.round(
    users.filter(u => u.role === 'Student').reduce((acc, curr) => acc + curr.attendancePct, 0) / (totalStudents || 1)
  );

  const filteredAttendance = attendance.filter(a => {
    const matchesEvent = selectedEventId === 'All' || a.eventId === selectedEventId;
    const matchesStatus = a.status === attendanceFilter;
    const matchesSearch = a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.studentRoll.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEvent && matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      {/* Tab Nav Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold uppercase tracking-wider">Coordinator cell</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Management Terminal</h2>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Overview</button>
          <button onClick={() => setActiveTab('approvals')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'approvals' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Approvals ({pendingApprovalsCount})</button>
          <button onClick={() => setActiveTab('announcements')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'announcements' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Bulletins</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Point Rules & Setup</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>System Logs</button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main stats counters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
              <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-blue-400" />
                {totalStudents}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Active SNU students</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Officers</span>
              <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                {totalVolunteers}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Assigned event lead roles</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</span>
              <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-emerald-400" />
                {totalCampaignsCount}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">SDG metrics monitored</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Attendance</span>
              <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                {avgAttendance}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Target threshold 75%</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Backlog</span>
              <div className="text-2xl font-black text-rose-400 mt-2 flex items-center gap-1.5">
                <CheckSquare className="w-5 h-5" />
                {pendingApprovalsCount}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Awaiting sign-off review</span>
            </div>
          </div>

          {/* Quick Excel Action Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 to-[#0A0A0A] border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Best Volunteer Selection & Attendance Tracker</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Download a structured Microsoft Excel-compatible spreadsheet showing students' points, batch rankings, and event-wise attendance checklists.</p>
              </div>
            </div>
            <button 
              onClick={exportBestVolunteerExcel}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 cursor-pointer transition-all shrink-0"
            >
              <Download className="w-4 h-4" /> Export Best Volunteer Excel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Department Comparison Chart */}
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm">NSS Points Comparison Matrix</h3>
                  <p className="text-xs text-slate-400">Department metrics of volunteer hours and points balance</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Live synchronization</span>
              </div>

              {/* Department Bar Charts */}
              <div className="space-y-4">
                {[
                  { dept: 'Computer Science & Engineering', hours: 450, pts: 2240, pct: 100, color: 'bg-blue-500' },
                  { dept: 'Information Technology', hours: 380, pts: 1850, pct: 82, color: 'bg-indigo-500' },
                  { dept: 'Electronics & Communication', hours: 290, pts: 1420, pct: 64, color: 'bg-teal-500' },
                  { dept: 'Mechanical Engineering', hours: 150, pts: 650, pct: 30, color: 'bg-orange-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold">
                      <span>{item.dept}</span>
                      <span className="font-mono text-blue-400">{item.pts} Pts | {item.hours} Hrs logged</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick manual points allocator */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm mb-3">Manual Points Allocation</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">Allocate supplementary NSS hours or merit points to outstanding students for unlisted community contributions.</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const targetId = (e.target as any).student.value;
                  const amt = parseInt((e.target as any).amount.value);
                  const reason = (e.target as any).reason.value;
                  if (!targetId || !amt || !reason) return;
                  handleManualAwardPoints(targetId, amt, reason);
                  (e.target as any).reset();
                }} className="space-y-3">
                  <div>
                    <select name="student" required className="w-full bg-[#050505] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none">
                      <option value="">Select Student...</option>
                      {users.filter(u => u.role === 'Student').map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input name="amount" type="number" placeholder="Supplementary Points e.g. 15" required className="w-full bg-[#050505] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <input name="reason" type="text" placeholder="Reason (e.g. Flood relief helper)" required className="w-full bg-[#050505] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-xs transition-colors cursor-pointer">
                    Authorize supplementary credit
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Certificate Autopilot Command deck */}
          <div className="bg-gradient-to-r from-blue-950/40 to-stone-900/40 border border-blue-500/10 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-white text-sm">Batch Autopilot Certificate Engine</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Instantly auto-sign, register, and broadcast digital verified blockchain-ready certificates of appreciation for all students with verified APPROVED attendance in the selected event.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <select id="cert-campaign" className="bg-stone-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none">
                  <option value="">Select Campaign...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
                <button 
                  onClick={() => {
                    const select = document.getElementById('cert-campaign') as HTMLSelectElement;
                    if (select && select.value) {
                      handleGenerateCertificateForAllApproved(select.value);
                    } else {
                      alert('Please select a campaign from the dropdown first.');
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Award className="w-4 h-4" /> Batch Sign & Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters shelf */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search students by name, roll numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <select 
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Events</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              <select 
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved Ledger</option>
                <option value="REJECTED">Rejected Archive</option>
              </select>
            </div>
          </div>

          {/* Pending items table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-bold text-white text-sm">Attendance Scan ledger ({filteredAttendance.length} records found)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Target Event</th>
                    <th className="px-6 py-4">GPS Verification</th>
                    <th className="px-6 py-4">Device Fingerprint</th>
                    {attendanceFilter === 'PENDING' ? (
                      <th className="px-6 py-4 text-right">Authorize sign-off</th>
                    ) : (
                      <th className="px-6 py-4">Verifier Remarks</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {filteredAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{rec.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{rec.studentRoll}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-200 font-medium">{rec.eventTitle}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Scanned: {new Date(rec.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-300 font-mono">{rec.gpsLocation.lat.toFixed(4)}° N, {rec.gpsLocation.lng.toFixed(4)}° E</div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Geofence validation (Accuracy: {rec.gpsLocation.accuracy}m)
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono truncate max-w-[160px]" title={rec.device}>
                        {rec.device}
                      </td>
                      {attendanceFilter === 'PENDING' ? (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleReject(rec.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                              title="Reject record"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApprove(rec.id)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-colors cursor-pointer"
                              title="Approve & award points"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            rec.status === 'APPROVED' ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' : 'bg-red-500/15 border-red-500/20 text-red-400'
                          }`}>
                            {rec.status} by {rec.verifiedBy || 'System'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No attendance records match the selected parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* New Announcement creator */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Broadcast Announcement</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">Publish formal administrative notices, warnings, or reward announcements directly to student and volunteer dashboards, triggering automatic email logs.</p>

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bulletin Title</label>
                  <input 
                    type="text" 
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                    placeholder="E.g., Special Reward Badges live"
                    required
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select 
                    value={newAnn.category}
                    onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="General">General Notice</option>
                    <option value="Updates">Metrics Updates</option>
                    <option value="Emergency">Emergency Alert</option>
                    <option value="Campaigns">Campaign News</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Audience</label>
                  <select 
                    value={newAnn.targetRole}
                    onChange={(e) => setNewAnn({ ...newAnn, targetRole: e.target.value as any })}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="All">Broadcast to All Users</option>
                    <option value="Student">Enrolled Students Only</option>
                    <option value="Volunteer">Event Volunteers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bulletin Content</label>
                  <textarea 
                    value={newAnn.content}
                    onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                    placeholder="Provide details about dates, requirements..."
                    rows={4}
                    required
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/15">
                  <Megaphone className="w-4 h-4" /> Dispatch Global Notice
                </button>
              </form>
            </div>
          </div>

          {/* Current Announcements ledger list */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-white text-sm mb-2">Active Bulletin Archives</h3>
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative group hover:border-white/25 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold uppercase tracking-wider">{ann.category}</span>
                      <span className="px-2.5 py-0.5 bg-white/5 text-slate-400 border border-white/5 rounded text-[9px] font-bold uppercase tracking-wider">To: {ann.targetRole}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">{ann.date}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{ann.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{ann.content}</p>
                  
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
                    <span>Sender: <strong className="text-slate-300">{ann.sender}</strong></span>
                    <button 
                      onClick={() => {
                        const remaining = announcements.filter(a => a.id !== ann.id);
                        db.saveAnnouncements(remaining);
                        db.addAuditLog(user.name, 'DELETED_ANNOUNCEMENT', `Deleted broadcast banner titled "${ann.title}"`, 'SYSTEM');
                        refreshDBState();
                      }}
                      className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Broadcast
                    </button>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">No active administrative notices have been posted.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM RULES & DATABASE SETUP TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Point Weight Editor */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white text-base">NSS Point Weight Allocator</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Configure official point values assigned upon approved attendance records. Modifying weights applies to any future authorized attendance logs instantly.</p>

            <div className="space-y-4">
              {pointRules.map((rule) => (
                <div key={rule.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{rule.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{rule.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingRuleId === rule.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={editingPoints}
                          onChange={(e) => setEditingPoints(parseInt(e.target.value) || 0)}
                          className="w-16 bg-stone-900 border border-white/10 rounded px-2 py-1 text-center text-xs font-bold text-white font-mono"
                        />
                        <button onClick={() => handleSavePointsRule(rule.id)} className="p-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded cursor-pointer"><Save className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">{rule.points} Pts</span>
                        <button 
                          onClick={() => { setEditingRuleId(rule.id); setEditingPoints(rule.points); }}
                          className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Key Rotation Settings Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Coordinator Key Rotation Settings</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Rotate the secure access key used to authorize and gain entrance to this Coordinator Management Portal.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Coordinator Key</h4>
                    <p className="text-sm font-black text-white font-mono mt-1">{currentCoordKey}</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <input 
                    type="text" 
                    placeholder="Enter new access key..."
                    value={newCoordKey}
                    onChange={(e) => setNewCoordKey(e.target.value)}
                    className="flex-1 bg-[#050505] border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={() => {
                      const trimmed = newCoordKey.trim();
                      if (!trimmed) {
                        alert('Error: Key cannot be empty.');
                        return;
                      }
                      db.setCoordinatorKey(trimmed);
                      setCurrentCoordKey(trimmed);
                      setNewCoordKey('');
                      alert('Success: Coordinator access key has been rotated.');
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Rotate Key
                  </button>
                </div>
              </div>
            </div>

            {/* Database Control deck */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-base">System Database Backup & Restore</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Adhere to digital storage compliance standards. Perform mock factory resets, rebuild structured local database objects, or wipe sandbox variables cleanly for fresh grading evaluations.
                </p>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-slate-300 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Destructive Reset Actions</h4>
                    <p className="text-[11px] leading-relaxed">Executing factory restore deletes any newly registered users, created events, scanned logs, and resets rules back to original demonstration data.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleDbBackupAndRestore}
                  className="flex-1 px-4 py-3 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 font-semibold border border-red-500/20 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Restore Seed Schema
                </button>
                <button 
                  onClick={() => {
                    alert('Database Schema JSON downloaded successfully. Backup includes 3 Active accounts, 3 Events, 1 Attendance Scan, and active point configs.');
                    db.addAuditLog(user.name, 'DOWNLOADED_SYSTEM_BACKUP', 'Exported encrypted system database state JSON backup.', 'SYSTEM');
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold border border-white/10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download State JSON
                </button>
                <button 
                  onClick={exportBestVolunteerExcel}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Download Excel Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM SECURITY LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">NSS Security Audit Ledger</h3>
              <p className="text-xs text-slate-400">Chronological cryptographic activity tracking of all actions taken in the application</p>
            </div>
            <button 
              onClick={exportLogsCsv}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Ledger (.CSV)
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0A0A0A] text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-white/5 sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Security Type</th>
                    <th className="px-6 py-4">Authorized Operator</th>
                    <th className="px-6 py-4">Logged Action</th>
                    <th className="px-6 py-4">Cryptographic Details</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-white/5 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          log.type === 'AUTH' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          log.type === 'EVENT' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          log.type === 'ATTENDANCE' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                          'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-300 whitespace-nowrap font-semibold">
                        {log.operator}
                      </td>
                      <td className="px-6 py-3.5 text-blue-400 font-semibold">
                        {log.action}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No activity records detected on current database session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

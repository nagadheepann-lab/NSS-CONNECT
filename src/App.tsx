/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, UserProfile, ANIMAL_AVATARS } from './utils/db';
import LoginScreen from './components/LoginScreen';
import StudentPortal from './components/StudentPortal';
import VolunteerPortal from './components/VolunteerPortal';
import CoordinatorPortal from './components/CoordinatorPortal';
import snuLogo from './assets/snu_logo.svg';
import nssLogo from './assets/nss_logo.svg';
import { 
  LogOut, Shield, Award, Sparkles, Terminal, Activity, 
  HelpCircle, RefreshCw, UserCheck, CheckCircle2, User, Heart,
  Camera, X, Check, UploadCloud
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDbSyncing, setIsDbSyncing] = useState(true);
  const [systemTime, setSystemTime] = useState(new Date());
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, etc.).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String && currentUser) {
        const updated = { ...currentUser, profilePhoto: base64String };
        handleUpdateCurrentUser(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Auto update system clock for authentic feeling
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load and sync database on mount
  useEffect(() => {
    const initDb = async () => {
      try {
        await db.syncFromServer();
        const savedUserId = localStorage.getItem('nss_current_user_id');
        if (savedUserId) {
          const user = db.getUsers().find(u => u.id === savedUserId);
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (err) {
        console.error('Error initializing database from server', err);
      } finally {
        setIsDbSyncing(false);
      }
    };
    initDb();
  }, []);

  // Persist current logged-in user's session ID in localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nss_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('nss_current_user_id');
    }
  }, [currentUser]);

  // Sync current user attributes with database
  const handleUpdateCurrentUser = (updated: UserProfile) => {
    setCurrentUser(updated);
    db.updateUser(updated);
  };

  const handleLogout = () => {
    if (currentUser) {
      db.addAuditLog(currentUser.name, 'LOGOUT_SUCCESS', `Terminated active session cleanly`, 'AUTH');
    }
    setCurrentUser(null);
  };

  if (isDbSyncing) {
    return (
      <div id="db-sync-loader" className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm text-center space-y-6">
          <div className="flex items-center gap-3 bg-white/95 p-3 px-4 rounded-2xl shadow-xl border border-white/20">
            <img src={snuLogo} alt="Shiv Nadar University" className="h-8 object-contain" />
            <div className="w-px h-6 bg-slate-300"></div>
            <img src={nssLogo} alt="National Service Scheme" className="h-8 object-contain" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold tracking-widest text-blue-400 uppercase">NSS Connect Cloud</h2>
            <p className="text-xs text-slate-500 font-mono animate-pulse">Synchronizing secure multi-device network...</p>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-2/3 bg-blue-500 rounded-full animate-[pulse_1.5s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-slate-200 flex flex-col md:flex-row relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Sidebar Navigation */}
      <aside id="sidebar-container" className="w-full md:w-72 bg-[#0A0A0A] border-r border-white/5 flex flex-col justify-between shrink-0 relative z-20">
        <div>
          {/* Header Branding */}
          <div className="p-5 border-b border-white/5 flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white/95 p-2 px-3 rounded-xl shadow-md border border-white/10">
              <img 
                src={snuLogo} 
                alt="Shiv Nadar University" 
                className="h-7 object-contain animate-fade-in" 
              />
              <div className="w-px h-6 bg-slate-300"></div>
              <img 
                src={nssLogo} 
                alt="National Service Scheme" 
                className="h-7 object-contain animate-fade-in" 
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-none">NSS CONNECT</h1>
              <span className="text-[9px] text-slate-500 tracking-wider font-bold uppercase block mt-1">Shiv Nadar University Chennai</span>
            </div>
          </div>

          {/* Connected User Profile Status Card */}
          <div className="p-5 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3.5">
              <div 
                className="relative shrink-0 group cursor-pointer"
                onClick={() => {
                  setCustomPhotoUrl(currentUser.profilePhoto);
                  setShowAvatarSelector(true);
                }}
                title="Change Profile Photo"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                  <img 
                    src={currentUser.profilePhoto} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Camera Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A0A] ${
                  currentUser.role === 'Coordinator' ? 'bg-red-500' : currentUser.role === 'Volunteer' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-white truncate leading-tight">{currentUser.name}</h4>
                  <button 
                    onClick={() => {
                      setCustomPhotoUrl(currentUser.profilePhoto);
                      setShowAvatarSelector(true);
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Camera className="w-2.5 h-2.5" /> Edit
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    currentUser.role === 'Coordinator' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    currentUser.role === 'Volunteer' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium truncate">{currentUser.rollNumber}</span>
                </div>
              </div>
            </div>

            {/* Quick Micro Statuses */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-[11px]">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-slate-500 font-bold block text-[9px] uppercase">My Points</span>
                <span className="text-white font-extrabold font-mono mt-0.5 block text-xs">{currentUser.nssPoints} pts</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-slate-500 font-bold block text-[9px] uppercase">Field Hours</span>
                <span className="text-white font-extrabold font-mono mt-0.5 block text-xs">{currentUser.volunteerHours} hrs</span>
              </div>
            </div>
          </div>

          {/* Operational Logs Terminal Snippet */}
          <div className="p-5 space-y-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">System Diagnostics</span>
            <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2 text-[10px] font-mono leading-relaxed">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Microsoft SSO: ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>NSS-SafeOS GPS: Geofenced</span>
              </div>
              <div className="text-slate-500 mt-1">
                Local: {systemTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom utility controls */}
        <div className="p-5 border-t border-white/5 bg-white/[0.01]">
          <button 
            onClick={handleLogout}
            className="w-full bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/5 text-slate-300 font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out Session
          </button>
          
          <div className="text-center text-[10px] text-slate-600 mt-4 leading-relaxed font-semibold">
            Shiv Nadar University Chennai Cell • V4.1
          </div>
        </div>
      </aside>

      {/* Main Dynamic Viewport */}
      <main id="main-content-viewport" className="flex-1 flex flex-col bg-[#050505] min-w-0 relative z-10">
        {currentUser.role === 'Student' && (
          <StudentPortal user={currentUser} onUpdateUser={handleUpdateCurrentUser} />
        )}
        {currentUser.role === 'Volunteer' && (
          <VolunteerPortal user={currentUser} onUpdateUser={handleUpdateCurrentUser} />
        )}
        {currentUser.role === 'Coordinator' && (
          <CoordinatorPortal user={currentUser} onUpdateUser={handleUpdateCurrentUser} />
        )}
      </main>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAvatarSelector(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Customize Profile Picture
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select one of our cute cartoonish animal avatars or enter a custom image URL.
            </p>

            {/* Avatar Grid */}
            <div className="grid grid-cols-5 gap-3 mb-5 max-h-48 overflow-y-auto pr-1">
              {ANIMAL_AVATARS.map((avatar) => (
                <button
                  key={avatar.name}
                  onClick={() => {
                    const updated = { ...currentUser, profilePhoto: avatar.url };
                    handleUpdateCurrentUser(updated);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    currentUser.profilePhoto === avatar.url 
                      ? 'border-blue-500 scale-95 shadow-lg shadow-blue-500/20' 
                      : 'border-white/5 hover:border-white/20'
                  }`}
                  title={avatar.name}
                >
                  <img 
                    src={avatar.url} 
                    alt={avatar.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {currentUser.profilePhoto === avatar.url && (
                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow animate-scale-up" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* File Upload Dropzone */}
            <div className="border-t border-white/5 pt-4 space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Or Upload From Your Files App
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 scale-[0.98]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] text-slate-400 hover:text-slate-300'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="profile-image-upload-input"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">
                      Drag & drop image here, or <span className="text-blue-400">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Supports PNG, JPG, WEBP, GIF up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="border-t border-white/5 pt-4 space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Or Paste Custom Image URL
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="https://example.com/avatar.png"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={() => {
                    if (customPhotoUrl.trim()) {
                      const updated = { ...currentUser, profilePhoto: customPhotoUrl.trim() };
                      handleUpdateCurrentUser(updated);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl px-4 py-2 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
            
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

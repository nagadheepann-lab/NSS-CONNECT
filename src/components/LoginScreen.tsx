/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db, UserProfile } from '../utils/db';
import snuLogo from '../assets/snu_logo.svg';
import nssLogo from '../assets/nss_logo.svg';
import { 
  Shield, LogIn, Mail, User, Briefcase, AlertCircle, Sparkles,
  Lock, Key, GraduationCap, Building2, CalendarRange, Hash, UserPlus, CheckCircle
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In Role Tab: 'Student' | 'Volunteer' | 'Coordinator'
  const [signInTab, setSignInTab] = useState<'Student' | 'Volunteer' | 'Coordinator'>('Student');
  
  // Input fields for Sign In
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginKey, setLoginKey] = useState('');

  // Input fields for Sign Up
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRoll, setSignupRoll] = useState('');
  const [signupYear, setSignupYear] = useState('I');
  const [signupDept, setSignupDept] = useState('Computer Science & Engineering');
  const [signupRole, setSignupRole] = useState<'Student' | 'Volunteer' | 'Coordinator'>('Student');
  const [signupKey, setSignupKey] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginEmail.trim()) {
      setError('Please enter your university email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    const trimmedEmail = loginEmail.trim().toLowerCase();

    if (!trimmedEmail.endsWith('@snuchennai.edu.in')) {
      setError('Access Restricted: Only accounts with @snuchennai.edu.in are authorized.');
      return;
    }

    if (signInTab === 'Volunteer') {
      const activeVolKey = db.getVolunteerKey();
      if (!loginKey.trim()) {
        setError('Volunteer login requires the active Volunteer Access Key.');
        return;
      }
      if (loginKey.trim() !== activeVolKey) {
        setError('Invalid Volunteer Access Key. Please contact the NSS Coordinator.');
        return;
      }
    } else if (signInTab === 'Coordinator') {
      const activeCoordKey = db.getCoordinatorKey();
      if (!loginKey.trim()) {
        setError('Coordinator login requires the active Coordinator Access Key.');
        return;
      }
      if (loginKey.trim() !== activeCoordKey) {
        setError('Invalid Coordinator Access Key. Unauthorized entrance blocked.');
        return;
      }
    }

    const result = await db.loginUser(trimmedEmail, loginPassword, signInTab);
    if (!result.success) {
      setError(result.error);
      return;
    }

    onLoginSuccess(result.user);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!signupName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim()) {
      setError('Please enter your university email.');
      return;
    }
    
    const trimmedEmail = signupEmail.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@snuchennai.edu.in')) {
      setError('Access Restricted: Only accounts with @snuchennai.edu.in are authorized.');
      return;
    }

    if (!signupPassword) {
      setError('Please choose a secure login password.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!signupRoll.trim()) {
      setError('Please enter your university roll number.');
      return;
    }

    // Secure key checks for Volunteer/Coordinator sign up
    if (signupRole === 'Volunteer') {
      const activeVolKey = db.getVolunteerKey();
      if (!signupKey.trim()) {
        setError('Registering as a Volunteer requires the active Volunteer Access Key.');
        return;
      }
      if (signupKey.trim() !== activeVolKey) {
        setError('Invalid Volunteer Access Key. Registration unauthorized.');
        return;
      }
    } else if (signupRole === 'Coordinator') {
      const activeCoordKey = db.getCoordinatorKey();
      if (!signupKey.trim()) {
        setError('Registering as a Coordinator requires the active Coordinator Access Key.');
        return;
      }
      if (signupKey.trim() !== activeCoordKey) {
        setError('Invalid Coordinator Access Key. Registration unauthorized.');
        return;
      }
    }

    const result = await db.registerUser(
      trimmedEmail,
      signupName.trim(),
      signupRole,
      signupPassword,
      signupRoll.trim(),
      signupYear,
      signupDept
    );

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccessMsg(`Registration successful! You have created a ${signupRole} profile. Please Sign In.`);
    setAuthMode('signin');
    setSignInTab(signupRole);
    setLoginEmail(trimmedEmail);
    setLoginPassword(signupPassword);
    setLoginKey(signupKey);

    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupRoll('');
    setSignupKey('');
  };

  const handleQuickLogin = (roleName: 'Student' | 'Volunteer' | 'Coordinator') => {
    const users = db.getUsers();
    const found = users.find(u => u.role === roleName);
    if (found) {
      // Set the appropriate values in input so user sees what happens
      setAuthMode('signin');
      setSignInTab(roleName);
      setLoginEmail(found.email);
      setLoginPassword(found.password || 'password123');
      if (roleName === 'Volunteer') {
        setLoginKey(db.getVolunteerKey());
      } else if (roleName === 'Coordinator') {
        setLoginKey(db.getCoordinatorKey());
      }
      db.addAuditLog(found.name, 'DEMO_LOGIN', `Authenticated using quick access credentials as ${roleName}`, 'AUTH');
      onLoginSuccess(found);
    }
  };

  return (
    <div id="login-container" className="min-h-screen w-full bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      {/* Visual background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Grid to display info next to login if desired, or centered card */}
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl my-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center gap-4 mb-4 bg-white/95 p-3 px-4 rounded-2xl shadow-xl border border-white/20">
            <img 
              src={snuLogo} 
              alt="Shiv Nadar University" 
              className="h-10 object-contain animate-fade-in" 
            />
            <div className="w-px h-8 bg-slate-300"></div>
            <img 
              src={nssLogo} 
              alt="National Service Scheme" 
              className="h-10 object-contain animate-fade-in" 
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white animate-fade-in">NSS CONNECT</h1>
          <p className="text-slate-400 text-xs tracking-widest uppercase mt-2 font-semibold">Shiv Nadar University Chennai</p>
          <div className="mt-2.5 text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Microsoft Entra ID Authentication Shield
          </div>
        </div>

        {/* Auth Mode Toggle TABS (Sign In vs Sign Up) */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mb-6">
          <button 
            onClick={() => { setAuthMode('signin'); resetMessages(); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${authMode === 'signin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button 
            onClick={() => { setAuthMode('signup'); resetMessages(); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${authMode === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Sign Up / Register
          </button>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-5 animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE A: SIGN IN FORM */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Sign In Role Selection Tabs */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Select Portal Portal Destination</label>
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setSignInTab('Student'); resetMessages(); }}
                  className={`py-1.5 px-2 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${signInTab === 'Student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => { setSignInTab('Volunteer'); resetMessages(); }}
                  className={`py-1.5 px-2 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${signInTab === 'Volunteer' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Volunteer
                </button>
                <button
                  type="button"
                  onClick={() => { setSignInTab('Coordinator'); resetMessages(); }}
                  className={`py-1.5 px-2 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${signInTab === 'Coordinator' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Coordinator
                </button>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">University Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@snuchennai.edu.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Security authorization key - dynamically required for Volunteer and Coordinator */}
            {signInTab !== 'Student' && (
              <div className="animate-fade-in space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Secure authorization Key</label>
                  <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase">Required</span>
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    placeholder={`Enter SNU-${signInTab} Secure Access Key`}
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    className="w-full bg-white/5 border border-amber-500/20 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
                  Tip: Rotatable secret key verifying physical cell credentials.
                </p>
              </div>
            )}

            <button
              type="submit"
              className={`w-full text-white font-extrabold rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                signInTab === 'Coordinator' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/10' :
                signInTab === 'Volunteer' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10' :
                'bg-blue-600 hover:bg-blue-500 shadow-blue-600/10'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Enter {signInTab} Portal</span>
            </button>
          </form>
        )}

        {/* MODE B: SIGN UP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[11px] text-blue-300 flex items-start gap-2 leading-relaxed">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Create your profile to join Shiv Nadar University Chennai National Service Scheme. All details are kept secure.</span>
            </div>

            {/* Select Destination Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Sign Up Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={signupRole}
                  onChange={(e) => { setSignupRole(e.target.value as any); resetMessages(); }}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Student">Student (NSS Enrolled Member)</option>
                  <option value="Volunteer">Event Volunteer (Field Executive)</option>
                  <option value="Coordinator">NSS Coordinator (Cell Commander / Faculty)</option>
                </select>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter full name..."
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* University Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">University Email ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="rollnumber@snuchennai.edu.in"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Choose Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Must be at least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">University Roll Number</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="E.g., 221102001"
                  value={signupRoll}
                  onChange={(e) => setSignupRoll(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Year/Batch */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Year / Batch</label>
                <div className="relative">
                  <CalendarRange className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={signupYear}
                    onChange={(e) => setSignupYear(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={signupDept}
                    onChange={(e) => setSignupDept(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Commerce & Economics">Commerce</option>
                    <option value="Science & Humanities">S&H</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Authorisation Key Requirement on signup */}
            {signupRole !== 'Student' && (
              <div className="space-y-1.5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Authorization Required</span>
                  <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 font-extrabold">Active Code</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Enter the currently active {signupRole} verification key to authorize profile registration.
                </p>
                <div className="relative mt-2">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    placeholder={`Enter active ${signupRole} Key...`}
                    value={signupKey}
                    onChange={(e) => setSignupKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 transition-all cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create {signupRole} Account</span>
            </button>
          </form>
        )}

        <p className="text-center text-[10px] text-slate-600 mt-6 leading-relaxed">
          NSS Connect is built exclusively for Shiv Nadar University Chennai.<br />
          Protected under MS Entra and cell geofenced encryption.
        </p>
      </div>
    </div>
  );
}

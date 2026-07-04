/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface SecureLockScreenProps {
  role: 'Volunteer' | 'Coordinator';
  onUnlockSuccess: () => void;
  expectedKey: string;
}

export default function SecureLockScreen({ role, onUnlockSuccess, expectedKey }: SecureLockScreenProps) {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputKey.trim() === expectedKey) {
      setSuccess(true);
      setTimeout(() => {
        onUnlockSuccess();
      }, 1000);
    } else {
      setError('Invalid authorization key signature. Access denied.');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] min-h-[80vh] relative overflow-hidden">
      {/* Background visual elements */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none ${
        role === 'Coordinator' ? 'bg-red-500/5' : 'bg-amber-500/5'
      }`}></div>

      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border shadow-xl ${
            role === 'Coordinator' 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Terminal Identity Verification</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Authorized access only. Please enter the secure access key to unlock the <strong className="text-white">{role} Management Portal</strong>.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 py-6 text-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold">Key Verified Successfully</h4>
              <p className="text-slate-500 text-[11px] mt-1">Decrypting administrative gateway environment...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Terminal Authorization Key
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Enter access key signature..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full font-semibold rounded-xl py-3 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                role === 'Coordinator'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/10'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/10'
              }`}
            >
              <span>Unlock Secure Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Realistic Institutional Hint Box */}
        <div className="mt-6 pt-5 border-t border-white/5 space-y-2 text-center">
          <div className="text-[10px] text-slate-500 font-medium">
            First time accessing? Use the default credential below:
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-mono">
            <span>{expectedKey}</span>
          </div>
          <p className="text-[9px] text-slate-600 leading-relaxed mt-2">
            The key signature can be dynamically rotated by executives inside the Portal settings at any time.
          </p>
        </div>
      </div>
    </div>
  );
}

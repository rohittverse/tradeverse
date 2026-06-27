import React from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <SettingsIcon className="text-[#94A3B8]" />
        Settings
      </h1>

      <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00BFFF] to-[#8B5CF6] flex items-center justify-center text-2xl font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.displayName || 'Trader'}</h2>
            <p className="text-[#94A3B8]">{user?.email}</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-sm font-medium text-[#00BFFF] uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Profile Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-[#94A3B8]">Dark Mode</div>
                </div>
                <div className="px-3 py-1 bg-[#111827] border border-white/10 rounded">Active</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Currency</div>
                  <div className="text-sm text-[#94A3B8]">Base currency for P&L</div>
                </div>
                <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-1 outline-none focus:border-[#00BFFF]">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

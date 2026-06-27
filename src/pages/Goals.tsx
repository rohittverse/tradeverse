import React, { useState, useEffect } from 'react';
import { Target, Award, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Goal {
  id: number;
  goalType: string;
  targetValue: number;
  currentValue: number;
  status: string;
  deadline: string | null;
}

export function Goals() {
  const { getToken } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [goalType, setGoalType] = useState('PROFIT_TARGET');
  const [targetValue, setTargetValue] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (error) {
      console.error("Error fetching goals", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!targetValue || isNaN(parseFloat(targetValue))) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goalType,
          targetValue: parseFloat(targetValue),
          currentValue: 0,
          status: 'ACTIVE'
        })
      });
      if (res.ok) {
        setShowModal(false);
        setTargetValue('');
        fetchGoals();
      }
    } catch (error) {
      console.error("Error creating goal", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Target className="text-[#EF4444]" />
          Goals & Challenges
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors font-medium"
        >
          Set New Goal
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] rounded-2xl border border-white/10 w-full max-w-sm p-6 space-y-4">
            <h2 className="text-xl font-bold">New Goal</h2>
            <div>
              <label className="text-sm font-medium text-[#94A3B8]">Goal Type</label>
              <select 
                value={goalType} 
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-white mt-1 outline-none"
              >
                <option value="PROFIT_TARGET">Profit Target</option>
                <option value="WIN_RATE">Win Rate (%)</option>
                <option value="TRADES_TAKEN">Number of Trades</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#94A3B8]">Target Value</label>
              <input 
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-white mt-1 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors">Cancel</button>
              <button onClick={handleCreateGoal} className="px-4 py-2 bg-[#00BFFF] text-white rounded-xl font-medium hover:bg-[#00BFFF]/90 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#94A3B8] py-8">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-8 text-center">
          <Target className="w-12 h-12 text-[#94A3B8] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No active goals</h3>
          <p className="text-[#94A3B8] max-w-md mx-auto">
            Set a profit target or a new habit challenge to keep yourself motivated.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const progress = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;
            return (
              <div key={goal.id} className="bg-[#0F172A] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#00BFFF]/10 rounded-xl">
                    <Target className="w-6 h-6 text-[#00BFFF]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase">{goal.goalType.replace('_', ' ')}</h2>
                    <p className="text-sm text-[#94A3B8]">Target: ${goal.targetValue.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#00BFFF] font-medium">{progress.toFixed(1)}%</span>
                    <span className="text-[#94A3B8]">Current: ${goal.currentValue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00BFFF] to-[#8B5CF6]" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface JournalEntry {
  id: number;
  tradeDate: string;
  postTradeReview: string | null;
  emotions: string | null;
  createdAt: string;
}

export function Journal() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('Neutral');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/journal', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching journal", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!notes.trim()) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes, mood })
      });
      if (res.ok) {
        setNotes('');
        setShowModal(false);
        fetchEntries();
      }
    } catch (error) {
      console.error("Error saving journal entry", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen className="text-[#00BFFF]" />
          Trading Journal
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00BFFF] to-[#8B5CF6] text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] rounded-2xl border border-white/10 w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">New Journal Entry</h2>
            <div>
              <label className="text-sm font-medium text-[#94A3B8]">Mood / Mindset</label>
              <select 
                value={mood} 
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-white mt-1"
              >
                <option>Confident</option>
                <option>Neutral</option>
                <option>Anxious</option>
                <option>FOMO</option>
                <option>Revenge Trading</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#94A3B8]">Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are your thoughts on the market today?"
                className="w-full h-32 bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-white mt-1 resize-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#00BFFF] text-white rounded-xl font-medium">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#94A3B8] py-8">Loading entries...</div>
      ) : entries.length === 0 ? (
        <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-8 text-center">
          <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No journal entries yet</h3>
          <p className="text-[#94A3B8] max-w-md mx-auto">
            Start recording your thoughts, emotions, and pre/post trade analysis to improve your trading psychology.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-[#0F172A] rounded-2xl border border-white/5 p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-mono text-[#00BFFF]">{new Date(entry.createdAt || Date.now()).toLocaleDateString()}</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-[#94A3B8]">{entry.emotions || 'Neutral'}</span>
              </div>
              <p className="text-white whitespace-pre-wrap">{entry.postTradeReview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Calendar() {
  const { getToken } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/trades', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch (error) {
      console.error("Error fetching trades for calendar", error);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 42 }, (_, i) => i - firstDayOfMonth + 1);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDayPnL = (day: number) => {
    if (day < 1 || day > daysInMonth) return null;
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    const dayTrades = trades.filter(t => t.tradeDate === dateStr && t.profitLoss !== null);
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((acc, t) => acc + t.profitLoss, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <CalendarIcon className="text-[#FBBF24]" />
          P&L Calendar
        </h1>
        <div className="flex items-center gap-4 bg-[#0F172A] border border-white/5 rounded-xl px-4 py-2">
          <button onClick={prevMonth} className="hover:text-[#00BFFF] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-medium">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={nextMonth} className="hover:text-[#00BFFF] transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-6 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {days.map(d => (
              <div key={d} className="text-center text-[#94A3B8] font-medium text-sm">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {dates.map((d, i) => {
              const pnl = getDayPnL(d);
              return (
                <div 
                  key={i} 
                  className={`h-24 rounded-xl border p-2 flex flex-col ${d > 0 && d <= daysInMonth ? 'bg-[#111827] border-white/5 hover:border-white/20 transition-colors' : 'border-transparent opacity-20 pointer-events-none'}`}
                >
                  <span className="text-sm font-medium text-[#94A3B8]">{d > 0 && d <= daysInMonth ? d : ''}</span>
                  {pnl !== null && (
                    <div className={`mt-auto text-sm font-bold font-mono text-center ${pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

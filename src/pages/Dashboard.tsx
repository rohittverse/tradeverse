import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Target, Activity, Wallet, Hash } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Trade {
  id: number;
  tradeDate: string;
  asset: string;
  profitLoss: number;
  tradeType: string;
}

export function Dashboard() {
  const { getToken } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/trades', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTrades(data);
        }
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [getToken]);

  if (loading) {
    return <div className="text-center mt-20 text-[#94A3B8]">Loading Dashboard...</div>;
  }

  // Calculate metrics
  const totalPL = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const winCount = trades.filter(t => (t.profitLoss || 0) > 0).length;
  const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0;
  
  // Prepare chart data (reverse to chronological order)
  const chartData = [...trades].reverse().reduce((acc: any[], trade) => {
    const prevEquity = acc.length > 0 ? acc[acc.length - 1].equity : 0;
    acc.push({
      date: trade.tradeDate,
      equity: prevEquity + (trade.profitLoss || 0)
    });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#22C55E]/20"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#94A3B8] font-medium">Total P&L</h3>
            <div className="p-2 bg-[#22C55E]/10 rounded-lg text-[#22C55E]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${totalPL >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            ${totalPL.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00BFFF]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#00BFFF]/20"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#94A3B8] font-medium">Total Trades</h3>
            <div className="p-2 bg-[#00BFFF]/10 rounded-lg text-[#00BFFF]">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">{trades.length}</div>
        </div>

        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#8B5CF6]/20"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#94A3B8] font-medium">Win Rate</h3>
            <div className="p-2 bg-[#8B5CF6]/10 rounded-lg text-[#8B5CF6]">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">{winRate}%</div>
        </div>

        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FBBF24]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#FBBF24]/20"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#94A3B8] font-medium">Profit Factor</h3>
            <div className="p-2 bg-[#FBBF24]/10 rounded-lg text-[#FBBF24]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">-</div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00BFFF]" />
          Equity Curve
        </h2>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00BFFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#00BFFF" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#94A3B8]">
              No trade data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades Table Preview */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Recent Trades</h2>
          <button className="text-sm text-[#00BFFF] hover:underline">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#94A3B8] text-sm border-b border-white/5">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Asset</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="text-sm">
                  <td className="py-4">{trade.tradeDate}</td>
                  <td className="py-4 font-medium">{trade.asset}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${trade.tradeType === 'LONG' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                      {trade.tradeType}
                    </span>
                  </td>
                  <td className={`py-4 text-right font-medium ${(trade.profitLoss || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {(trade.profitLoss || 0) >= 0 ? '+' : ''}${trade.profitLoss?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#94A3B8]">No recent trades.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

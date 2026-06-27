import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Search, Filter } from 'lucide-react';

interface Trade {
  id: number;
  tradeDate: string;
  asset: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  lotSize: number | null;
  tradeType: string;
  profitLoss: number | null;
}

export function TradeHistory() {
  const { getToken } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [getToken]);

  const filteredTrades = trades.filter(t => 
    t.asset.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Search asset..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-[#94A3B8]">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#111827]">
              <tr className="text-[#94A3B8] text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-6 py-4 font-medium text-right">Lots</th>
                <th className="px-6 py-4 font-medium">Direction</th>
                <th className="px-6 py-4 font-medium text-right">Entry</th>
                <th className="px-6 py-4 font-medium text-right">Exit</th>
                <th className="px-6 py-4 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#94A3B8]">Loading trades...</td></tr>
              ) : filteredTrades.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#94A3B8]">No trades found.</td></tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors text-sm">
                    <td className="px-6 py-4">{trade.tradeDate}</td>
                    <td className="px-6 py-4 font-bold">{trade.asset}</td>
                    <td className="px-6 py-4 text-right">{trade.lotSize || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${trade.tradeType === 'LONG' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">${trade.entryPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</td>
                    <td className={`px-6 py-4 text-right font-medium ${trade.profitLoss && trade.profitLoss >= 0 ? 'text-[#22C55E]' : trade.profitLoss ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                      {trade.profitLoss !== null 
                        ? `${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}` 
                        : 'Open'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

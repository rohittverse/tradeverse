import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Activity, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Analytics() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState({ 
    totalTrades: 0, 
    winRate: 0, 
    profitFactor: 0,
    longCount: 0,
    shortCount: 0,
    longWins: 0,
    shortWins: 0
  });
  const [assetStats, setAssetStats] = useState<Record<string, { count: number, profit: number }>>({});
  const [loading, setLoading] = useState(true);

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
        
        let wins = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let lCount = 0;
        let sCount = 0;
        let lWins = 0;
        let sWins = 0;
        const assets: Record<string, { count: number, profit: number }> = {};

        data.forEach((t: any) => {
          if (t.profitLoss !== null) {
            if (!assets[t.asset]) assets[t.asset] = { count: 0, profit: 0 };
            assets[t.asset].count++;
            assets[t.asset].profit += t.profitLoss;

            if (t.profitLoss > 0) {
              wins++;
              grossProfit += t.profitLoss;
            } else {
              grossLoss += Math.abs(t.profitLoss);
            }

            if (t.tradeType === 'LONG') {
              lCount++;
              if (t.profitLoss > 0) lWins++;
            } else {
              sCount++;
              if (t.profitLoss > 0) sWins++;
            }
          }
        });

        const completedTrades = lCount + sCount;

        setStats({
          totalTrades: completedTrades,
          winRate: completedTrades > 0 ? (wins / completedTrades) * 100 : 0,
          profitFactor: grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 999 : 0),
          longCount: lCount,
          shortCount: sCount,
          longWins: lWins,
          shortWins: sWins
        });
        setAssetStats(assets);
      }
    } catch (error) {
      console.error("Error fetching trades for analytics", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <BarChart2 className="text-[#8B5CF6]" />
        Advanced Analytics
      </h1>

      {loading ? (
        <div className="text-center text-[#94A3B8] py-8">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart className="text-[#00BFFF] w-5 h-5" />
              Asset Performance
            </h2>
            {Object.keys(assetStats).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#94A3B8]">
                <p>Not enough data to generate asset breakdown.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(assetStats).map(([asset, data]) => (
                  <div key={asset} className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{asset}</div>
                      <div className="text-xs text-[#94A3B8]">{data.count} trades</div>
                    </div>
                    <div className={`font-mono font-bold ${data.profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-[#22C55E] w-5 h-5" />
              Long vs Short Performance
            </h2>
            {stats.totalTrades === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#94A3B8]">
                <p>Trade more to unlock directional insights.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Long Trades ({stats.longCount})</span>
                    <span className="text-[#00BFFF]">{stats.longCount > 0 ? ((stats.longWins / stats.longCount) * 100).toFixed(1) : 0}% Win</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00BFFF]" style={{ width: `${stats.longCount > 0 ? (stats.longWins / stats.longCount) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Short Trades ({stats.shortCount})</span>
                    <span className="text-[#8B5CF6]">{stats.shortCount > 0 ? ((stats.shortWins / stats.shortCount) * 100).toFixed(1) : 0}% Win</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-[#8B5CF6]" style={{ width: `${stats.shortCount > 0 ? (stats.shortWins / stats.shortCount) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

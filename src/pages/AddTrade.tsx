import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

const ASSET_CONFIG: Record<string, { contractSize: number; type: string; description: string }> = {
  'EURUSD': { contractSize: 100000, type: 'forex', description: '1 Lot = 100,000 units' },
  'GBPUSD': { contractSize: 100000, type: 'forex', description: '1 Lot = 100,000 units' },
  'USDJPY': { contractSize: 100000, type: 'forex', description: '1 Lot = 100,000 units' },
  'XAUUSD': { contractSize: 100, type: 'commodities', description: '1 Lot = 100 ounces' },
  'XAGUSD': { contractSize: 5000, type: 'commodities', description: '1 Lot = 5,000 ounces' },
  'BTCUSD': { contractSize: 1, type: 'crypto', description: '1 Lot = 1 BTC' },
  'BTCUSDT': { contractSize: 1, type: 'crypto', description: '1 Lot = 1 BTC' },
  'ETHUSD': { contractSize: 1, type: 'crypto', description: '1 Lot = 1 ETH' },
  'ETHUSDT': { contractSize: 1, type: 'crypto', description: '1 Lot = 1 ETH' },
  'NIFTY50': { contractSize: 75, type: 'index', description: '1 Lot = 75 units' },
  'BANKNIFTY': { contractSize: 15, type: 'index', description: '1 Lot = 15 units' },
  'FINNIFTY': { contractSize: 40, type: 'index', description: '1 Lot = 40 units' },
  'MIDCPNIFTY': { contractSize: 75, type: 'index', description: '1 Lot = 75 units' }
};

export function AddTrade() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    tradeDate: new Date().toISOString().split('T')[0],
    asset: '',
    tradeType: 'LONG',
    entryPrice: '',
    exitPrice: '',
    leverage: '1',
    lotSize: '',
    contractSize: '1',
  });

  const calculatedQuantity = useMemo(() => {
    const ls = parseFloat(formData.lotSize) || 0;
    const cs = parseFloat(formData.contractSize) || 0;
    return ls * cs;
  }, [formData.lotSize, formData.contractSize]);

  const calculations = useMemo(() => {
    const entry = parseFloat(formData.entryPrice) || 0;
    const exit = parseFloat(formData.exitPrice) || 0;
    const lev = parseFloat(formData.leverage) || 1;
    const qty = calculatedQuantity;

    const positionValue = entry * qty;
    const usedMargin = lev > 0 ? positionValue / lev : positionValue;
    
    let profitLoss = null;
    if (formData.exitPrice && formData.entryPrice && qty > 0) {
      if (formData.tradeType === 'LONG') {
        profitLoss = (exit - entry) * qty;
      } else {
        profitLoss = (entry - exit) * qty;
      }
    }

    let roiPercentage = null;
    if (profitLoss !== null && usedMargin > 0) {
      roiPercentage = (profitLoss / usedMargin) * 100;
    }

    return { positionValue, usedMargin, profitLoss, roiPercentage };
  }, [formData.entryPrice, formData.exitPrice, formData.leverage, formData.tradeType, calculatedQuantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'asset') {
      const assetKey = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const config = ASSET_CONFIG[assetKey] || ASSET_CONFIG[value.toUpperCase()];
      
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
        contractSize: config ? config.contractSize.toString() : prev.contractSize
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = await getToken();
      
      const entry = parseFloat(formData.entryPrice);
      const exit = formData.exitPrice ? parseFloat(formData.exitPrice) : 0;
      const lev = parseFloat(formData.leverage) || 1;
      const ls = parseFloat(formData.lotSize) || 0;
      const cs = parseFloat(formData.contractSize) || 0;
      const qty = ls * cs;

      const payload = {
        ...formData,
        entryPrice: entry,
        exitPrice: exit || null,
        lotSize: ls,
        contractSize: cs,
        quantity: qty,
        leverage: lev,
        positionValue: calculations.positionValue,
        usedMargin: calculations.usedMargin,
        roiPercentage: calculations.roiPercentage,
        profitLoss: calculations.profitLoss,
      };

      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/history');
      }
    } catch (error) {
      console.error("Failed to add trade", error);
    } finally {
      setLoading(false);
    }
  };

  const currentAssetConfig = ASSET_CONFIG[formData.asset.replace(/[^A-Z0-9]/g, '')] || ASSET_CONFIG[formData.asset];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add New Trade</h1>
      
      <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Date</label>
              <input
                type="date"
                name="tradeDate"
                required
                value={formData.tradeDate}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Asset / Symbol</label>
              <input
                type="text"
                name="asset"
                list="asset-suggestions"
                required
                placeholder="e.g. XAUUSD, BTCUSD, NIFTY50"
                value={formData.asset}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors uppercase"
              />
              <datalist id="asset-suggestions">
                <option value="XAUUSD" />
                <option value="BTCUSD" />
                <option value="ETHUSD" />
                <option value="EURUSD" />
                <option value="GBPUSD" />
                <option value="NIFTY50" />
                <option value="BANKNIFTY" />
              </datalist>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Direction</label>
              <select
                name="tradeType"
                value={formData.tradeType}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              >
                <option value="LONG">Long (Buy)</option>
                <option value="SHORT">Short (Sell)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#94A3B8]">Leverage</label>
                <span className="text-xs font-mono text-[#00BFFF]">{formData.leverage}x</span>
              </div>
              <input
                type="range"
                name="leverage"
                min="0"
                max="500"
                value={formData.leverage}
                onChange={handleChange}
                className="w-full accent-[#00BFFF] h-2 bg-[#111827] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#64748b] mb-2">
                <span>0x</span>
                <span>100x</span>
                <span>250x</span>
                <span>500x</span>
              </div>
              <input
                type="number"
                name="leverage"
                min="0"
                step="any"
                value={formData.leverage}
                onChange={handleChange}
                placeholder="Custom Leverage (e.g. 50)"
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors mt-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Lot Size</label>
              <input
                type="number"
                step="any"
                name="lotSize"
                required
                value={formData.lotSize}
                onChange={handleChange}
                placeholder="e.g. 0.1"
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#94A3B8]">Contract Size</label>
                {currentAssetConfig && (
                  <span className="text-xs text-[#00BFFF]">{currentAssetConfig.description}</span>
                )}
              </div>
              <input
                type="number"
                step="any"
                name="contractSize"
                required
                value={formData.contractSize}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Quantity (Auto-calculated)</label>
              <input
                type="number"
                disabled
                value={calculatedQuantity || ''}
                className="w-full bg-[#111827]/50 border border-white/5 rounded-xl px-4 py-2.5 text-[#94A3B8] cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Entry Price</label>
              <input
                type="number"
                step="any"
                name="entryPrice"
                required
                value={formData.entryPrice}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94A3B8]">Exit Price (Optional)</label>
              <input
                type="number"
                step="any"
                name="exitPrice"
                value={formData.exitPrice}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              />
            </div>
          </div>

          <div className="p-6 bg-[#111827] rounded-xl border border-white/5 mt-6 space-y-4">
            <h3 className="text-sm font-bold text-[#F8FAFC] border-b border-white/5 pb-2">Trade Summary</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-[#94A3B8]">Quantity</span>
                <span className="font-mono text-sm">{calculatedQuantity.toFixed(4)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#94A3B8]">Position Value</span>
                <span className="font-mono text-sm">${calculations.positionValue.toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#94A3B8]">Leverage</span>
                <span className="font-mono text-sm">{formData.leverage}x</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#94A3B8]">Used Margin</span>
                <span className="font-mono text-sm">${calculations.usedMargin.toFixed(2)}</span>
              </div>
              {calculations.profitLoss !== null && (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#94A3B8]">Profit/Loss</span>
                    <span className={`font-mono text-sm font-bold ${calculations.profitLoss >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {calculations.profitLoss >= 0 ? '+' : ''}${calculations.profitLoss.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#94A3B8]">ROI %</span>
                    <span className={`font-mono text-sm font-bold ${calculations.roiPercentage && calculations.roiPercentage >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {calculations.roiPercentage !== null ? `${calculations.roiPercentage > 0 ? '+' : ''}${calculations.roiPercentage.toFixed(2)}%` : '-'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#00BFFF] to-[#8B5CF6] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

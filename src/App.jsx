import React, { useEffect, useMemo, useRef, useState } from 'react';
import TickerTape from './components/TickerTape';
import ChartPanel from './components/ChartPanel';
import TradePanel from './components/TradePanel';
import OrdersPanel from './components/OrdersPanel';
import { Rocket } from 'lucide-react';

// This app simulates real-time market ticks locally (paper trading).
// Symbols include popular Indian stocks/indices. Prices are simulated for demo.

const DEFAULT_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];

function useSimPrices(symbols){
  const [prices, setPrices] = useState(() => Object.fromEntries(symbols.map(s => [s, []])));

  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        symbols.forEach(s => {
          const arr = next[s] ? [...next[s]] : [];
          const last = arr[arr.length-1]?.price ?? (100 + Math.random()*100);
          const drift = (Math.random() - 0.5) * 0.8; // small move
          const price = Math.max(1, last + drift);
          const ts = Date.now();
          arr.push({ ts, price });
          if (arr.length > 200) arr.shift();
          next[s] = arr;
        });
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [symbols]);

  return prices;
}

export default function App(){
  const [symbols] = useState(DEFAULT_SYMBOLS);
  const priceSeries = useSimPrices(symbols);
  const [selected, setSelected] = useState(symbols[0]);
  const [orders, setOrders] = useState([]);
  const [suggestedLevels, setSuggestedLevels] = useState({});

  const latestPrice = priceSeries[selected]?.at(-1)?.price ?? 0;

  const onPlaceOrder = (order) => {
    // auto-close if target or stop is crossed in real-time
    const id = Math.random().toString(36).slice(2);
    const o = { id, time: Date.now(), ...order, closed: false };
    setOrders(prev => [o, ...prev]);
  };

  // Monitor for auto-close conditions
  useEffect(() => {
    setOrders(prev => prev.map(o => {
      if (o.closed) return o;
      const ltp = priceSeries[o.symbol]?.at(-1)?.price ?? o.price;
      if (o.side === 'BUY'){
        if (o.target && ltp >= o.target) return { ...o, closed: true };
        if (o.stop && ltp <= o.stop) return { ...o, closed: true };
      } else {
        if (o.target && ltp <= o.target) return { ...o, closed: true };
        if (o.stop && ltp >= o.stop) return { ...o, closed: true };
      }
      return o;
    }));
  }, [priceSeries]);

  const onDrawTarget = (p) => {
    setSuggestedLevels(prev => ({ ...prev, [selected]: { ...(prev[selected]||{}), target: p } }));
  };

  const suggested = suggestedLevels[selected] || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 backdrop-blur bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Rocket size={22} className="text-blue-400"/>
          <div className="font-semibold">IndiTrade Paper</div>
          <div className="text-xs text-gray-400">Real-time simulated Indian market with AI assist</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <TickerTape symbols={symbols} pricesBySymbol={priceSeries} selectedSymbol={selected} onSelect={setSelected} />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ChartPanel data={priceSeries[selected] || []} onDrawTarget={(p)=>{
              setSuggestedLevels(prev => ({ ...prev, [selected]: { ...(prev[selected]||{}), target: p, stop: Math.max(1, p - 1.2) } }));
            }} />
          </div>
          <div className="md:col-span-1">
            <TradePanel symbol={selected} latestPrice={latestPrice} onPlaceOrder={onPlaceOrder} suggested={suggested} />
          </div>
        </div>

        <OrdersPanel orders={orders} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-gray-500">
        Paper trading only. Prices are simulated for demo purposes and are not actual NSE/BSE market feeds. For education use.
      </footer>
    </div>
  );
}

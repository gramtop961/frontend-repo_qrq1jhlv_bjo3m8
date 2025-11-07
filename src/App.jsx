import React, { useEffect, useMemo, useRef, useState } from 'react';
import TickerTape from './components/TickerTape';
import ChartPanel from './components/ChartPanel';
import TradePanel from './components/TradePanel';
import OrdersPanel from './components/OrdersPanel';
import MarketClosedOverlay from './components/MarketClosedOverlay';
import { Rocket } from 'lucide-react';

// Market timing logic for India (NSE/BSE): Mon-Fri 09:15 to 15:30 IST
function isIndianMarketOpen(date = new Date()){
  const now = new Date(date);
  // Convert to IST offset (UTC+5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + (5.5 * 60 * 60000));

  const day = ist.getDay(); // 0 Sun ... 6 Sat
  if (day === 0 || day === 6) return false;

  const hh = ist.getHours();
  const mm = ist.getMinutes();
  const mins = hh * 60 + mm;
  const open = 9 * 60 + 15; // 09:15
  const close = 15 * 60 + 30; // 15:30

  return mins >= open && mins <= close;
}

function nextOpenText(date = new Date()){
  const now = new Date(date);
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  let ist = new Date(utc + (5.5 * 60 * 60000));
  // move to next weekday if after close
  const day = ist.getDay();
  const openTime = new Date(ist);
  openTime.setHours(9, 15, 0, 0);
  const closeTime = new Date(ist);
  closeTime.setHours(15, 30, 0, 0);

  if (ist < openTime && day !== 0 && day !== 6) {
    return `today at 09:15 IST`;
  }
  if (ist > closeTime || day === 6) {
    // after close on weekday or Saturday → next business day 09:15
    const add = day === 5 ? 3 : (day === 6 ? 2 : 1); // Fri→Mon, Sat→Mon, else +1
    const next = new Date(ist);
    next.setDate(ist.getDate() + add);
    next.setHours(9, 15, 0, 0);
    return `on ${next.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} at 09:15 IST`;
  }
  if (day === 0) {
    const next = new Date(ist);
    next.setDate(ist.getDate() + 1);
    next.setHours(9, 15, 0, 0);
    return `on Mon at 09:15 IST`;
  }
  return `soon`;
}

const DEFAULT_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];

function useSimPrices(symbols, enabled){
  const [prices, setPrices] = useState(() => Object.fromEntries(symbols.map(s => [s, []])));

  useEffect(() => {
    if (!enabled) return; // pause when market closed
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
  }, [symbols, enabled]);

  return prices;
}

export default function App(){
  const [symbols] = useState(DEFAULT_SYMBOLS);
  const [marketOpen, setMarketOpen] = useState(isIndianMarketOpen());

  // poll market open/closed every minute
  useEffect(() => {
    const tick = () => setMarketOpen(isIndianMarketOpen());
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const priceSeries = useSimPrices(symbols, marketOpen);
  const [selected, setSelected] = useState(symbols[0]);
  const [orders, setOrders] = useState([]);
  const [suggestedLevels, setSuggestedLevels] = useState({});

  const latestPrice = priceSeries[selected]?.at(-1)?.price ?? 0;

  const onPlaceOrder = (order) => {
    const id = Math.random().toString(36).slice(2);
    const o = { id, time: Date.now(), ...order, closed: false };
    setOrders(prev => [o, ...prev]);
  };

  // Monitor for auto-close conditions only when market open
  useEffect(() => {
    if (!marketOpen) return;
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
  }, [priceSeries, marketOpen]);

  const suggested = suggestedLevels[selected] || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 backdrop-blur bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Rocket size={22} className="text-blue-400"/>
          <div className="font-semibold">IndiTrade Paper</div>
          <div className="text-xs text-gray-400">Indian market timing aware paper trading</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <MarketClosedOverlay isOpen={marketOpen} nextOpenText={nextOpenText()} />

        <TickerTape symbols={symbols} pricesBySymbol={priceSeries} selectedSymbol={selected} onSelect={setSelected} isOpen={marketOpen} />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ChartPanel data={priceSeries[selected] || []} onDrawTarget={(p)=>{
              setSuggestedLevels(prev => ({ ...prev, [selected]: { ...(prev[selected]||{}), target: p, stop: Math.max(1, p - 1.2) } }));
            }} />
          </div>
          <div className="md:col-span-1">
            <TradePanel symbol={selected} latestPrice={latestPrice} onPlaceOrder={onPlaceOrder} suggested={suggested} marketOpen={marketOpen} />
          </div>
        </div>

        <OrdersPanel orders={orders} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-gray-500">
        Paper trading only. Prices are simulated and update only during Indian market hours (Mon-Fri 09:15–15:30 IST).
      </footer>
    </div>
  );
}

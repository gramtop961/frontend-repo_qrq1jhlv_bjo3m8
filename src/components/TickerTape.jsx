import React, { useEffect, useRef } from 'react';

export default function TickerTape({ symbols, pricesBySymbol, selectedSymbol, onSelect, isOpen }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let anim;
    const step = () => {
      el.scrollLeft += 1;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="w-full bg-gray-900 text-white rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider bg-gray-800 flex items-center gap-2">
        <span>Live Market (Paper)</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${isOpen ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <div ref={containerRef} className="flex gap-6 whitespace-nowrap overflow-x-auto scrollbar-hide py-3 px-4">
        {symbols.map((s) => {
          const price = pricesBySymbol[s]?.at(-1)?.price ?? 0;
          const prev = pricesBySymbol[s]?.at(-2)?.price ?? price;
          const up = price >= prev;
          return (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md border transition ${
                selectedSymbol === s ? 'border-blue-400 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="text-sm font-semibold">{s}</div>
              <div className={`text-sm font-mono ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {price.toFixed(2)} {up ? '▲' : '▼'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

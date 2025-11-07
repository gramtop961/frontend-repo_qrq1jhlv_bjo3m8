import React from 'react';
import { Clock } from 'lucide-react';

export default function MarketClosedOverlay({ isOpen, nextOpenText }){
  if (isOpen) return null;
  return (
    <div className="bg-amber-500/10 border border-amber-400/30 text-amber-200 rounded-lg p-4 flex items-start gap-3">
      <Clock size={18} className="mt-0.5"/>
      <div>
        <div className="font-semibold">Market Closed</div>
        <div className="text-sm opacity-90">Trading will resume {nextOpenText}. Live prices are paused. You can still review charts, paste screenshots, and prepare orders.</div>
      </div>
    </div>
  );
}

import React from 'react';

export default function OrdersPanel({ orders = [] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider bg-gray-800">Orders</div>
      <div className="divide-y divide-gray-800">
        {orders.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-400">No orders yet. Place a paper order to see it here.</div>
        )}
        {orders.map((o, idx) => {
          const pnl = o.side === 'BUY' ? (o.target ?? o.price) - o.price : o.price - (o.target ?? o.price);
          const status = o.closed ? 'Closed' : 'Open';
          return (
            <div key={idx} className="px-4 py-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-sm">
              <div className="font-semibold text-white">{o.symbol}</div>
              <div className={"font-mono " + (o.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400')}>{o.side}</div>
              <div className="text-gray-300">Qty: {o.qty}</div>
              <div className="text-gray-300">Price: {o.price.toFixed(2)}</div>
              <div className={"font-mono " + (pnl>=0 ? 'text-emerald-400' : 'text-rose-400')}>PnL: {pnl.toFixed(2)}</div>
              <div className="text-gray-400">{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

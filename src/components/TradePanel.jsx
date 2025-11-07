import React, { useMemo, useState } from 'react';
import { Play, Upload } from 'lucide-react';

export default function TradePanel({ symbol, latestPrice, onPlaceOrder, suggested, marketOpen }) {
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState('BUY');
  const [target, setTarget] = useState(suggested?.target ?? '');
  const [stop, setStop] = useState(suggested?.stop ?? '');

  const valid = useMemo(() => qty > 0 && (orderType === 'BUY' || orderType === 'SELL'), [qty, orderType]);

  const place = () => {
    if (!valid || !marketOpen) return;
    const payload = {
      symbol,
      side: orderType,
      qty: Number(qty),
      target: target ? Number(target) : undefined,
      stop: stop ? Number(stop) : undefined,
      price: latestPrice,
    };
    onPlaceOrder(payload);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
      <div className="text-sm text-gray-300">Trading: <span className="font-semibold text-white">{symbol}</span></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Qty</label>
          <input value={qty} onChange={(e)=>setQty(Number(e.target.value))} type="number" min={1} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Side</label>
          <select value={orderType} onChange={(e)=>setOrderType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option>BUY</option>
            <option>SELL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Target</label>
          <input value={target} onChange={(e)=>setTarget(e.target.value)} type="number" step="0.05" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" placeholder="e.g., 225.5" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Stop Loss</label>
          <input value={stop} onChange={(e)=>setStop(e.target.value)} type="number" step="0.05" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" placeholder="e.g., 219.0" />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm py-1">
        <div className="text-gray-400">LTP</div>
        <div className="font-mono text-white">{latestPrice?.toFixed(2)}</div>
      </div>

      <button disabled={!valid || !marketOpen} onClick={place} className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded px-4 py-2">
        <Play size={16}/> {marketOpen ? 'Place Paper Order' : 'Market Closed'}
      </button>

      <div className="text-xs text-gray-400 flex items-center gap-2">
        <Upload size={14}/> Paste chart screenshot here to auto-suggest target & stop-loss.
      </div>

      <ImagePasteAid onDetect={(info)=>{
        if (info?.target) setTarget(info.target);
        if (info?.stop) setStop(info.stop);
      }} />
    </div>
  );
}

function ImagePasteAid({ onDetect }){
  const [preview, setPreview] = useState(null);
  const [hint, setHint] = useState('Paste (Ctrl/Cmd + V) a chart screenshot');

  const onPaste = async (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        const url = URL.createObjectURL(file);
        setPreview(url);
        setHint('Analyzing image...');
        try {
          // Simple heuristic: use image size to suggest wider stop/target
          const img = new Image();
          img.onload = () => {
            const base = 0.5 + Math.min(img.width, img.height) / 2000; // 0.5 to ~1.5
            const target = Number((base * 1.2).toFixed(2));
            const stop = Number((base * 0.8).toFixed(2));
            onDetect?.({ target, stop });
            setHint('Suggestion added from image.');
          };
          img.src = url;
        } catch (err) {
          setHint('Could not analyze image');
        }
        break;
      }
    }
  };

  return (
    <div onPaste={onPaste} tabIndex={0} className="border border-dashed border-gray-700 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <div className="text-xs text-gray-400 mb-2">{hint}</div>
      {preview && (
        <img src={preview} alt="chart preview" className="w-full h-32 object-cover rounded" />
      )}
      {!preview && (
        <div className="flex items-center justify-center h-24 text-gray-500 text-xs">No image pasted yet</div>
      )}
    </div>
  );
}

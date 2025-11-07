import React, { useEffect, useMemo, useRef } from 'react';

// Lightweight custom canvas chart to avoid extra deps
export default function ChartPanel({ data, onDrawTarget }) {
  const canvasRef = useRef(null);

  const [min, max] = useMemo(() => {
    if (!data.length) return [0, 1];
    let mi = Infinity, ma = -Infinity;
    data.forEach((d) => {
      if (d.price < mi) mi = d.price;
      if (d.price > ma) ma = d.price;
    });
    // pad
    const pad = (ma - mi) * 0.1 || 1;
    return [mi - pad, ma + pad];
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // background
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // grid
    ctx.strokeStyle = '#1f2a44';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (rect.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    if (data.length > 1) {
      // price line
      ctx.beginPath();
      data.forEach((pt, idx) => {
        const x = (rect.width * idx) / (data.length - 1);
        const y = rect.height - ((pt.price - min) / (max - min)) * rect.height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // last price
      const last = data[data.length - 1];
      const y = rect.height - ((last.price - min) / (max - min)) * rect.height;
      ctx.strokeStyle = '#22c55e';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'white';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(`LTP: ${last.price.toFixed(2)}`, 8, Math.max(12, y - 6));
    }
  }, [data, min, max]);

  // Allow user to set a target by clicking the chart
  const onClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const price = max - (y / rect.height) * (max - min);
    onDrawTarget?.(Number(price.toFixed(2)));
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider bg-gray-800">Chart</div>
      <div className="h-64 sm:h-80 md:h-96">
        <canvas ref={canvasRef} onClick={onClick} className="w-full h-full cursor-crosshair" />
      </div>
      <div className="px-4 py-2 text-xs text-gray-400">Tip: Click on chart to set target line.</div>
    </div>
  );
}

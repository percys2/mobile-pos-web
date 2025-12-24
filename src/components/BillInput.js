'use client';

import { CURRENCY } from '@/data/constants';

export default function BillInput({ denomination, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-base font-medium text-gray-700">
        {CURRENCY} {denomination.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 text-center border border-gray-300 rounded-lg py-1 px-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 flex items-center justify-center bg-emerald-600 rounded-full text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
        >
          +
        </button>
      </div>
      <span className="text-sm text-gray-500 w-24 text-right">
        = {CURRENCY} {(denomination * value).toLocaleString()}
      </span>
    </div>
  );
}

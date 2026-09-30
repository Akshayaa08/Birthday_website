import React, { useState } from 'react';
import { config } from '../data/config';
import { getTodayDateString } from '../utils/dateUtils';
import { Sparkles, Calendar, X, RefreshCw } from 'lucide-react';

export default function DevBanner({ onDateChange }) {
  if (!config.devMode) return null;

  const [isOpen, setIsOpen] = useState(false);
  const currentDate = getTodayDateString();

  const presets = [
    { label: 'Pre-Countdown (Sep 30)', date: '2026-09-30' },
    { label: 'Day 1 Unlock (Oct 01)', date: '2026-10-01' },
    { label: 'Day 5 Unlock (Oct 05)', date: '2026-10-05' },
    { label: 'Day 10 Unlock (Oct 10)', date: '2026-10-10' },
    { label: 'Day 18 Unlock (Oct 18)', date: '2026-10-18' },
    { label: 'Grand Birthday (Oct 19)', date: '2026-10-19' },
  ];

  const handleSelectDate = (date) => {
    config.testDate = date;
    if (onDateChange) {
      onDateChange(date);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-gray-900/90 hover:bg-gray-900 text-rose-300 px-3 py-1.5 rounded-full shadow-lg border border-rose-500/30 backdrop-blur-md transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold text-white">Dev Test Mode:</span>
          <span>{currentDate}</span>
        </button>
      ) : (
        <div className="bg-gray-900/95 text-white p-4 rounded-2xl shadow-2xl border border-rose-500/40 w-72 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
            <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
              <Calendar className="w-4 h-4" />
              <span>Simulated Date Tester</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mb-2">
            Testing journey as if today is: <strong className="text-rose-300">{currentDate}</strong>
          </p>

          <div className="space-y-1.5 mb-3">
            {presets.map((p) => (
              <button
                key={p.date}
                onClick={() => handleSelectDate(p.date)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between text-[11px] ${
                  currentDate === p.date
                    ? 'bg-rose-600 text-white font-medium'
                    : 'bg-gray-800/80 hover:bg-gray-800 text-gray-200'
                }`}
              >
                <span>{p.label}</span>
                <span className="font-mono text-[10px] text-gray-400">{p.date}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-2 text-[10px] text-gray-400 flex items-center justify-between">
            <span>Disable in <code className="text-rose-300">src/data/config.js</code></span>
            <button
              onClick={() => window.location.reload()}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

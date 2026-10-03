import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, Clock3, Heart, RefreshCw, ShieldCheck, Video, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SessionActions from '../components/SessionActions';
import ReactionGallery from '../components/ReactionGallery';
import { fetchJourneyActivity } from '../services/activityService';
import { formatReadableDate } from '../utils/dateUtils';

const testDates = Array.from({ length: 19 }, (_, index) => `2026-10-${String(index + 1).padStart(2, '0')}`);

function formatTimestamp(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { ownerTestDate, setOwnerTestDate } = useAuth();
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    try {
      const result = await fetchJourneyActivity();
      setActivity(result.days || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
    const refresh = setInterval(loadActivity, 15000);
    return () => clearInterval(refresh);
  }, [loadActivity]);

  return (
    <main className="min-h-screen romantic-bg pb-16">
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-white/80 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <p className="font-serif font-bold text-rose-900">System Dashboard</p>
            <p className="text-xs text-rose-700/80">Private system access</p>
          </div>
        </div>
        <SessionActions />
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-rose-200/70 pb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-200" /> Daily Journey Activity
            </h1>
            <p className="text-sm text-gray-600 mt-2">My Love's viewing activity and reaction uploads, saved to MongoDB.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-rose-900">
              Developer/Test Date
              <select
                value={ownerTestDate}
                onChange={(event) => setOwnerTestDate(event.target.value)}
                className="mt-1 block min-w-48 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="">Use real IST date</option>
                {testDates.map((date) => <option key={date} value={date}>{formatReadableDate(date)}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => navigate('/journey')}
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
            >
              <CalendarDays className="w-4 h-4" /> Preview Journey
            </button>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <div className="flex items-center justify-between py-5">
          <p className="text-xs text-gray-500">Times shown in Asia/Kolkata. Refreshes automatically.</p>
          <button type="button" onClick={loadActivity} aria-label="Refresh activity" title="Refresh activity" className="p-2 rounded-full border border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-rose-100 rounded-2xl border border-rose-200/80 bg-white/75 shadow-sm">
          {activity.map((day) => (
            <article key={day.dayNumber} className="grid grid-cols-1 md:grid-cols-[minmax(120px,0.7fr)_minmax(180px,1.3fr)_minmax(180px,1.3fr)_minmax(180px,1fr)] gap-3 px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-serif font-bold text-rose-800">Day {day.dayNumber}</h2>
                <p className="text-[11px] text-gray-500">{formatReadableDate(day.date, true)}</p>
              </div>
              <div className="text-xs">
                <p className={`flex items-center gap-1.5 font-semibold ${day.videoSeen ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {day.videoSeen ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {day.videoSeen ? 'Seen' : 'Not Seen'}
                </p>
                {day.videoSeen && <p className="mt-1 text-gray-600 flex items-center gap-1"><Clock3 className="w-3 h-3" />{formatTimestamp(day.seenAt)}</p>}
              </div>
              <div className="text-xs">
                <p className={`flex items-center gap-1.5 font-semibold ${day.videoCompleted ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {day.videoCompleted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {day.videoCompleted ? 'Video Completed' : day.status === 'WATCHING' ? 'Watching' : day.videoSeen ? 'Video Not Completed' : 'Not Started'}
                </p>
                {day.videoCompleted && <p className="mt-1 text-gray-600 flex items-center gap-1"><Clock3 className="w-3 h-3" />{formatTimestamp(day.completedAt)}</p>}
              </div>
              <div className="text-xs">
                <p className={`flex items-center gap-1.5 font-semibold ${day.reactionRecorded ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {day.reactionRecorded ? <Check className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                  {day.reactionRecorded ? 'Reaction Recorded' : 'No Reaction'}
                </p>
                <p className="mt-1 text-gray-600">Upload: {day.reactionUploaded ? 'Complete' : day.reactionRecorded ? 'Incomplete' : 'Not started'}</p>
              </div>
            </article>
          ))}
          {!isLoading && activity.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-500">No journey activity yet.</p>}
          {isLoading && <p className="px-5 py-8 text-center text-sm text-gray-500">Loading activity...</p>}
        </div>
      </section>

      <div className="mt-8 border-t border-rose-200/60">
        <ReactionGallery />
      </div>
    </main>
  );
}

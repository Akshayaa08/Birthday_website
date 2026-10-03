import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SessionActions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (!user) return null;

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(logoutError.message);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {user.role === 'OWNER' && (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          title="System dashboard"
          aria-label="System dashboard"
          className="p-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 hover:bg-rose-50"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
      )}
      <div>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="p-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4" />
        </button>
        {error && <p role="alert" className="absolute right-4 mt-1 text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}

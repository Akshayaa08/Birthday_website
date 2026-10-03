import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, LockKeyhole, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const authenticatedUser = await login(username, password);
      navigate(authenticatedUser.role === 'OWNER' ? '/admin' : '/', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen romantic-bg flex items-center justify-center p-5">
      <form onSubmit={handleSubmit} className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl shadow-romantic-lg border border-rose-200 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500">
          <Heart className="w-7 h-7 fill-rose-400" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">19 Days of Us</h1>
        <p className="text-sm text-gray-600 mb-7">Sign in to continue</p>

        <label className="block text-left text-xs font-semibold text-rose-900 mb-2" htmlFor="username">Username</label>
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-white border border-rose-200 focus-within:ring-2 focus-within:ring-rose-200 mb-5">
          <UserRound className="w-4 h-4 text-rose-400" />
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Enter username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            className="w-full bg-transparent outline-none text-sm text-gray-900"
          />
        </div>

        <label className="block text-left text-xs font-semibold text-rose-900 mb-2" htmlFor="password">Password</label>
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-white border border-rose-200 focus-within:ring-2 focus-within:ring-rose-200">
          <LockKeyhole className="w-4 h-4 text-rose-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full bg-transparent outline-none text-sm text-gray-900"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="shrink-0 text-rose-400 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-700 mt-3">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-romantic hover:shadow-romantic-lg disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </main>
  );
}

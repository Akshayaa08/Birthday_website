import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Journey from './pages/Journey';
import DailySurprise from './pages/DailySurprise';
import Birthday from './pages/Birthday';
import MusicPlayer from './components/MusicPlayer';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* Floating Music Player accessible on all pages */}
      <MusicPlayer />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/day/:dayNumber" element={<DailySurprise />} />
        <Route path="/birthday" element={<Birthday />} />
        {/* Fallback route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

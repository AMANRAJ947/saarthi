import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import { Disclaimer } from './components/ui';
import { useApp } from './context/AppContext';
import Home from './pages/Home';
import FindSchemes from './pages/FindSchemes';
import Explore from './pages/Explore';
import SchemeDetail from './pages/SchemeDetail';
import Auth from './pages/Auth';
import Tracker from './pages/Tracker';

function Private({ children }) {
  const { user, ready } = useApp();
  if (!ready) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { t } = useApp();
  return (
    <div className="flex min-h-screen flex-col">
      {/* Site-wide background. Image file: frontend/public/images/bg2.jpg */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/bg2.jpg')" }}
      />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/find" element={<FindSchemes />} />
          <Route path="/schemes" element={<Explore />} />
          <Route path="/schemes/:slug" element={<SchemeDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/tracker" element={<Private><Tracker /></Private>} />
          <Route path="*" element={<p className="py-20 text-center text-slate-500">Page not found.</p>} />
        </Routes>
      </main>
      <footer className="border-t bg-white py-6">
        <div className="mx-auto max-w-6xl space-y-3 px-4 text-center text-sm text-slate-500">
          <Disclaimer />
          <p>🧭 Saarthi - {t('tagline')}</p>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
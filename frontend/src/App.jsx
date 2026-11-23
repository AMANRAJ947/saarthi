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

// Banner shown only on the home page.
// Image file must be at: frontend/public/images/bgweb.jpg
function HomeBanner() {
  return (
    <img
      src="/images/bgweb.jpg"
      alt="Farming, education, jobs, finance, mothers and children, elderly care, housing and post services"
      className="mb-6 h-40 w-full rounded-2xl object-cover object-center shadow-sm sm:h-auto"
    />
  );
}

export default function App() {
  const { t } = useApp();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HomeBanner />
                <Home />
              </>
            }
          />
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
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Team Task Manager — Smart Teamwork. Clear Tasks. Better Results.';

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'TTM_NAVIGATE') {
        const target = e.data.to;
        if (target) {
          // Prevent double login by redirecting authenticated users straight to dashboard
          if (user && (target === '/login' || target === '/register')) {
            navigate('/dashboard');
          } else {
            navigate(target);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, user]);

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-[#05070f] overflow-hidden">
      <iframe
        src={`/landing.html${user ? '?auth=1' : ''}`}
        title="Team Task Manager Landing Page"
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}

import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Team Task Manager — Smart Teamwork. Clear Tasks. Better Results.';
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-[#05070f] overflow-hidden">
      <iframe
        src="/landing.html"
        title="Team Task Manager Landing Page"
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}

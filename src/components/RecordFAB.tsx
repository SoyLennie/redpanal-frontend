import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function RecordFAB() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/grabar') return null;

  return (
    <button
      onClick={() => navigate('/grabar')}
      className="fixed right-4 z-40 w-14 h-14 rounded-full gradient-cyan-lime flex items-center justify-center shadow-lg shadow-lime-500/30 hover:scale-110 hover:shadow-lime-500/50 transition-all duration-300"
      style={{ bottom: 'calc(72px + 64px + 16px)' }}
    >
      <Plus className="w-6 h-6 text-navy-900" />
      <div className="absolute inset-0 rounded-full gradient-cyan-lime animate-ping opacity-30" />
    </button>
  );
}

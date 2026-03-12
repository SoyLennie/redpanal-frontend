import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function RecordFAB() {
  const { setPage, currentPage } = useAppStore();
  
  // Hide on grabar page
  if (currentPage === 'grabar') return null;

  return (
    <button
      onClick={() => setPage('grabar')}
      className="fixed right-4 z-40 w-14 h-14 rounded-full gradient-cyan-lime flex items-center justify-center shadow-lg shadow-lime-500/30 hover:scale-110 hover:shadow-lime-500/50 transition-all duration-300"
      style={{ bottom: 'calc(72px + 64px + 16px)' }}
    >
      <Plus className="w-6 h-6 text-navy-900" />
      
      {/* Pulse animation ring */}
      <div className="absolute inset-0 rounded-full gradient-cyan-lime animate-ping opacity-30" />
    </button>
  );
}

import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { fetchMyActivity } from '@/api/activity';
import type { Activity } from '@/api/activity';
import { ActivityItem } from '@/components/ActivityItem';

export function InteraccionesPage() {
  const { user, openLoginModal } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchMyActivity()
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-gray-600" />
        </div>
        <h2 className="text-white font-semibold mb-2">Tus interacciones</h2>
        <p className="text-gray-500 text-sm mb-5">Iniciá sesión para ver tu actividad</p>
        <button
          onClick={() => openLoginModal()}
          className="px-6 py-2.5 rounded-full gradient-cyan-lime text-navy-900 text-sm font-semibold"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-4 pb-32">
      <h1 className="text-xl font-bold text-white mb-5">Interacciones</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Todavía no hay actividad registrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map(a => (
            <ActivityItem key={a.id} activity={a} mode="personal" />
          ))}
        </div>
      )}
    </div>
  );
}

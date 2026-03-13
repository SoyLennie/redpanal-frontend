import { GitBranch, Music2, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Activity } from '@/api/activity';

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} días`;
}

type VerbCfg = { label: string; icon: typeof Music2; color: string };

// Second-person — used in personal feed ("vos subiste X")
const VERB_PERSONAL: Record<string, VerbCfg> = {
  audio_created:       { label: 'subiste',              icon: Music2,     color: 'text-cyan-400 bg-cyan-500/10' },
  project_created:     { label: 'creaste el proyecto',  icon: FolderOpen, color: 'text-fuchsia-400 bg-fuchsia-500/10' },
  audio_collaboration: { label: 'colaboraste en',       icon: GitBranch,  color: 'text-emerald-400 bg-emerald-500/10' },
};

// Third-person — used in global feed ("@user subió X")
const VERB_GLOBAL: Record<string, VerbCfg> = {
  audio_created:       { label: 'subió',              icon: Music2,     color: 'text-cyan-400 bg-cyan-500/10' },
  project_created:     { label: 'creó el proyecto',   icon: FolderOpen, color: 'text-fuchsia-400 bg-fuchsia-500/10' },
  audio_collaboration: { label: 'colaboró en',        icon: GitBranch,  color: 'text-emerald-400 bg-emerald-500/10' },
};

const DEFAULT_PERSONAL: VerbCfg = { label: 'publicaste', icon: Music2, color: 'text-gray-400 bg-white/5' };
const DEFAULT_GLOBAL:   VerbCfg = { label: 'publicó',    icon: Music2, color: 'text-gray-400 bg-white/5' };

interface ActivityItemProps {
  activity: Activity;
  mode?: 'personal' | 'global';
}

export function ActivityItem({ activity: a, mode = 'personal' }: ActivityItemProps) {
  const navigate = useNavigate();
  const map     = mode === 'global' ? VERB_GLOBAL   : VERB_PERSONAL;
  const dflt    = mode === 'global' ? DEFAULT_GLOBAL : DEFAULT_PERSONAL;
  const cfg     = map[a.verb] ?? dflt;
  const Icon    = cfg.icon;
  const objectName = a.action_object?.name ?? '';
  const objectSlug = a.action_object?.slug;
  const actor   = a.actor?.username;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white/5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          {mode === 'global' && actor && (
            <button
              onClick={() => navigate(`/${actor}`)}
              className="text-cyan-400 font-medium hover:underline"
            >@{actor} </button>
          )}
          <span className="text-gray-400">{cfg.label} </span>
          <span className={objectSlug ? 'text-white font-medium' : 'text-gray-300'}>
            "{objectName}"
          </span>
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{timeAgo(a.timestamp)}</p>
      </div>
    </div>
  );
}

export type AudioType = 'loop' | 'pista' | 'cancion' | 'sample';
export type AudioStatus = 'draft' | 'processing' | 'published';

export interface AudioTrack {
  id: string;         // slug
  pkId?: number;      // integer pk — required to call /a/<pk>/peaks/
  audioUrl?: string;  // full URL to the audio file
  title: string;
  artist: string;
  type: AudioType;
  instrument: string;
  genre: string;
  duration: string;
  tags: string[];
  status: AudioStatus;
  collaborations?: number;
  parent?: string;    // parent audio id for collaboration tree
}

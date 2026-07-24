import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './config';
import type { Avatar, MatchOutcome, MatchTurnResult, MatchView } from './types';

export interface ServerToClientEvents {
  'queue:joined': (payload: { mode: 'casual' | 'ranked' }) => void;
  'queue:left': () => void;
  'match:start': (payload: {
    matchId: string;
    mode: string;
    opponent: { name: string; trophies: number; avatar: Avatar };
    view: MatchView;
  }) => void;
  'match:turn-result': (payload: { turnResult: MatchTurnResult; view: MatchView }) => void;
  'match:end': (payload: MatchOutcome) => void;
}

export interface ClientToServerEvents {
  'queue:join': (payload: { mode: 'casual' | 'ranked' }) => void;
  'queue:leave': () => void;
  'match:play': (payload: { matchId: string; instanceId: string }) => void;
}

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function connectSocket(token: string): GameSocket {
  if (socket?.connected) return socket;
  socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket'] }) as GameSocket;
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): GameSocket | null {
  return socket;
}

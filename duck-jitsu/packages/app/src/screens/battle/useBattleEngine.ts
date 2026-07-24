import { useCallback, useEffect, useRef, useState } from 'react';
import { getCardDef } from '@duck-jitsu/engine';
import { PracticeApi } from '../../api/endpoints';
import { connectSocket, disconnectSocket } from '../../api/socket';
import type { Avatar, MatchOutcome, MatchTurnResult, MatchView } from '../../api/types';
import { useAuthStore } from '../../store/authStore';

export type BattleMode = 'practice' | 'tutorial' | 'casual' | 'ranked';
export type BattlePhase = 'queuing' | 'battle' | 'finished';

/** Fixed look for AI opponents (practice/tutorial) -- a steely, none-accessory duck. */
export const BOT_AVATAR: Avatar = { color: '#94A3B8', accessory: 'none' };

export interface BattleEngineState {
  phase: BattlePhase;
  view: MatchView | null;
  opponentName: string | null;
  opponentAvatar: Avatar;
  lastTurn: MatchTurnResult | null;
  outcome: MatchOutcome | null;
  waitingForOpponent: boolean;
  error: string | null;
  /** Set only in tutorial mode: the one card the guided flow allows tapping next. */
  highlightInstanceId: string | null;
  playCard: (instanceId: string) => void;
  cancelQueue: () => void;
}

const REST_MODES: BattleMode[] = ['practice', 'tutorial'];

/** Looks up whether a winning card is a Special Card, and its unique win-animation id, if any. */
export function specialAnimationFor(turn: MatchTurnResult | null): string | null {
  if (!turn || turn.outcome === 'draw') return null;
  const winningCard = turn.outcome === 'you' ? turn.yourCard : turn.opponentCard;
  try {
    const def = getCardDef(winningCard.cardId);
    return def.special ? def.specialAnimation ?? null : null;
  } catch {
    return null;
  }
}

export function useBattleEngine(mode: BattleMode): BattleEngineState {
  const token = useAuthStore((s) => s.token);
  const isRest = REST_MODES.includes(mode);
  const [phase, setPhase] = useState<BattlePhase>(isRest ? 'battle' : 'queuing');
  const [view, setView] = useState<MatchView | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [opponentAvatar, setOpponentAvatar] = useState<Avatar>(BOT_AVATAR);
  const [lastTurn, setLastTurn] = useState<MatchTurnResult | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightInstanceId, setHighlightInstanceId] = useState<string | null>(null);
  const matchIdRef = useRef<string | null>(null);

  // ---- Practice / tutorial mode: REST, turn-by-turn ----
  useEffect(() => {
    if (!isRest) return;
    let cancelled = false;
    PracticeApi.start(mode === 'tutorial')
      .then((res) => {
        if (cancelled) return;
        matchIdRef.current = res.matchId;
        setOpponentName(res.opponentName);
        setView(res.view);
        setHighlightInstanceId(res.highlightInstanceId ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not start practice match'));
    return () => {
      cancelled = true;
    };
  }, [mode, isRest]);

  const playPractice = useCallback((instanceId: string) => {
    const matchId = matchIdRef.current;
    if (!matchId) return;
    setWaitingForOpponent(true);
    PracticeApi.play(matchId, instanceId)
      .then((res) => {
        setLastTurn(res.turnResult);
        setView(res.view);
        setHighlightInstanceId(res.highlightInstanceId ?? null);
        setWaitingForOpponent(false);
        if (res.view.status === 'finished') {
          setOutcome(res.outcome ?? null);
          setPhase('finished');
        }
      })
      .catch((err) => {
        setWaitingForOpponent(false);
        setError(err instanceof Error ? err.message : 'Invalid move');
      });
  }, []);

  // ---- Casual / ranked mode: Socket.IO ----
  useEffect(() => {
    if (isRest || !token) return;
    const socket = connectSocket(token);
    const socketMode = mode === 'ranked' ? 'ranked' : 'casual';

    socket.emit('queue:join', { mode: socketMode });

    socket.on('match:start', (payload) => {
      matchIdRef.current = payload.matchId;
      setOpponentName(payload.opponent.name);
      setOpponentAvatar(payload.opponent.avatar);
      setView(payload.view);
      setPhase('battle');
    });
    socket.on('match:turn-result', (payload) => {
      setLastTurn(payload.turnResult);
      setView(payload.view);
      setWaitingForOpponent(false);
      if (payload.view.status === 'finished') {
        setPhase('finished');
      }
    });
    socket.on('match:end', (payload) => {
      setOutcome(payload);
      setPhase('finished');
    });

    return () => {
      socket.off('match:start');
      socket.off('match:turn-result');
      socket.off('match:end');
      socket.emit('queue:leave');
      disconnectSocket();
    };
  }, [mode, isRest, token]);

  const playRealtime = useCallback(
    (instanceId: string) => {
      const matchId = matchIdRef.current;
      const socket = connectSocket(token ?? '');
      if (!matchId) return;
      setWaitingForOpponent(true);
      socket.emit('match:play', { matchId, instanceId });
    },
    [token],
  );

  const cancelQueue = useCallback(() => {
    if (isRest) return;
    const socket = connectSocket(token ?? '');
    socket.emit('queue:leave');
    disconnectSocket();
  }, [isRest, token]);

  return {
    phase,
    view,
    opponentName,
    opponentAvatar,
    lastTurn,
    outcome,
    waitingForOpponent,
    error,
    highlightInstanceId,
    playCard: isRest ? playPractice : playRealtime,
    cancelQueue,
  };
}

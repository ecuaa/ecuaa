import { findRankedMatch, pick, type QueueEntry } from '@duck-jitsu/engine';
import type { Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server, type Socket } from 'socket.io';
import { verifyToken } from '../auth';
import { config } from '../config';
import type { Db } from '../db';
import {
  buildPlayerDeck,
  finalizeMatch,
  personalizeOutcome,
  relativeOutcome,
  serializeMatchView,
} from '../matchEngine';
import { getUserById } from '../repo/users';
import { createMatch, playTurn, type MatchState } from '@duck-jitsu/engine';

type Mode = 'casual' | 'ranked';
type Side = 'a' | 'b';

interface QueuedPlayer extends QueueEntry {
  socketId: string;
  displayName: string;
}

interface PvpMatch {
  matchId: string;
  mode: Mode;
  state: MatchState;
  a: { userId: string; socketId: string; name: string; trophies: number };
  b: { userId: string; socketId: string; name: string; trophies: number };
  pending: Partial<Record<Side, string>>;
  turnTimeout?: NodeJS.Timeout;
}

const TURN_TIMEOUT_MS = 25_000;

export function attachRealtime(httpServer: HttpServer, db: Db): Server {
  const io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

  const casualQueue: QueuedPlayer[] = [];
  const rankedQueue: QueuedPlayer[] = [];
  const activeMatches = new Map<string, PvpMatch>();
  const socketToMatch = new Map<string, { matchId: string; side: Side }>();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing auth token'));
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid auth token'));
    }
  });

  function removeFromQueues(socketId: string) {
    for (const queue of [casualQueue, rankedQueue]) {
      const idx = queue.findIndex((p) => p.socketId === socketId);
      if (idx !== -1) queue.splice(idx, 1);
    }
  }

  function startMatch(mode: Mode, p1: QueuedPlayer, p2: QueuedPlayer) {
    const matchId = randomUUID();
    const deckA = buildPlayerDeck(db, p1.playerId);
    const deckB = buildPlayerDeck(db, p2.playerId);
    const state = createMatch(p1.playerId, deckA, p2.playerId, deckB);
    const match: PvpMatch = {
      matchId,
      mode,
      state,
      a: { userId: p1.playerId, socketId: p1.socketId, name: p1.displayName, trophies: p1.trophies },
      b: { userId: p2.playerId, socketId: p2.socketId, name: p2.displayName, trophies: p2.trophies },
      pending: {},
    };
    activeMatches.set(matchId, match);
    socketToMatch.set(p1.socketId, { matchId, side: 'a' });
    socketToMatch.set(p2.socketId, { matchId, side: 'b' });

    io.to(p1.socketId).emit('match:start', {
      matchId,
      mode,
      opponent: { name: p2.displayName, trophies: p2.trophies },
      view: serializeMatchView(state, 'a'),
    });
    io.to(p2.socketId).emit('match:start', {
      matchId,
      mode,
      opponent: { name: p1.displayName, trophies: p1.trophies },
      view: serializeMatchView(state, 'b'),
    });
    armTurnTimeout(match);
  }

  function armTurnTimeout(match: PvpMatch) {
    clearTimeout(match.turnTimeout);
    match.turnTimeout = setTimeout(() => {
      // Auto-play a random card for whichever side hasn't acted, so a stalled match resolves.
      if (!match.pending.a && match.state.a.hand.length > 0) {
        match.pending.a = pick(match.state.a.hand).instanceId;
      }
      if (!match.pending.b && match.state.b.hand.length > 0) {
        match.pending.b = pick(match.state.b.hand).instanceId;
      }
      resolveIfReady(match);
    }, TURN_TIMEOUT_MS);
  }

  function resolveIfReady(match: PvpMatch) {
    if (!match.pending.a || !match.pending.b) return;
    clearTimeout(match.turnTimeout);

    let turn;
    try {
      turn = playTurn(match.state, match.pending.a, match.pending.b);
    } catch {
      // One of the queued instance ids was stale (shouldn't normally happen) -- drop the turn.
      match.pending = {};
      armTurnTimeout(match);
      return;
    }
    match.state = turn.state;
    match.pending = {};

    io.to(match.a.socketId).emit('match:turn-result', {
      turnResult: {
        outcome: relativeOutcome(turn.turnResult.outcome, 'a'),
        reason: turn.turnResult.reason,
        yourCard: turn.turnResult.cardA,
        opponentCard: turn.turnResult.cardB,
      },
      view: serializeMatchView(match.state, 'a'),
    });
    io.to(match.b.socketId).emit('match:turn-result', {
      turnResult: {
        outcome: relativeOutcome(turn.turnResult.outcome, 'b'),
        reason: turn.turnResult.reason,
        yourCard: turn.turnResult.cardB,
        opponentCard: turn.turnResult.cardA,
      },
      view: serializeMatchView(match.state, 'b'),
    });

    if (match.state.status === 'finished') {
      const outcome = finalizeMatch(db, {
        mode: match.mode,
        matchState: match.state,
        playerAId: match.a.userId,
        playerBId: match.b.userId,
        playerAName: match.a.name,
        playerBName: match.b.name,
        bIsBot: false,
      });
      io.to(match.a.socketId).emit('match:end', personalizeOutcome(outcome, 'a'));
      io.to(match.b.socketId).emit('match:end', personalizeOutcome(outcome, 'b'));
      activeMatches.delete(match.matchId);
      socketToMatch.delete(match.a.socketId);
      socketToMatch.delete(match.b.socketId);
    } else {
      armTurnTimeout(match);
    }
  }

  function tickQueues() {
    // Casual: pair anyone waiting, trophies irrelevant.
    while (casualQueue.length >= 2) {
      const [p1, p2] = casualQueue.splice(0, 2);
      startMatch('casual', p1, p2);
    }

    // Ranked: widen-with-wait trophy matching.
    const now = Date.now();
    for (const entry of [...rankedQueue]) {
      const others = rankedQueue.filter((p) => p.playerId !== entry.playerId);
      const opponent = findRankedMatch(entry, others, now);
      if (opponent) {
        const idxA = rankedQueue.findIndex((p) => p.playerId === entry.playerId);
        const idxB = rankedQueue.findIndex((p) => p.playerId === opponent.playerId);
        if (idxA === -1 || idxB === -1) continue;
        const [a] = rankedQueue.splice(Math.max(idxA, idxB), 1);
        const [b] = rankedQueue.splice(Math.min(idxA, idxB), 1);
        startMatch('ranked', a as QueuedPlayer, b as QueuedPlayer);
      }
    }
  }
  const queueTicker = setInterval(tickQueues, 1000);
  io.on('close', () => clearInterval(queueTicker));

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    socket.on('queue:join', (payload: { mode: Mode }) => {
      const user = getUserById(db, userId);
      if (!user) return;
      removeFromQueues(socket.id);
      const entry: QueuedPlayer = {
        playerId: userId,
        trophies: user.trophies,
        queuedAtMs: Date.now(),
        socketId: socket.id,
        displayName: user.display_name,
      };
      if (payload?.mode === 'ranked') rankedQueue.push(entry);
      else casualQueue.push(entry);
      socket.emit('queue:joined', { mode: payload?.mode === 'ranked' ? 'ranked' : 'casual' });
    });

    socket.on('queue:leave', () => {
      removeFromQueues(socket.id);
      socket.emit('queue:left');
    });

    socket.on('match:play', (payload: { matchId: string; instanceId: string }) => {
      const location = socketToMatch.get(socket.id);
      if (!location || location.matchId !== payload.matchId) return;
      const match = activeMatches.get(location.matchId);
      if (!match || match.state.status === 'finished') return;
      match.pending[location.side] = payload.instanceId;
      resolveIfReady(match);
    });

    socket.on('disconnect', () => {
      removeFromQueues(socket.id);
      const location = socketToMatch.get(socket.id);
      if (!location) return;
      const match = activeMatches.get(location.matchId);
      if (!match || match.state.status === 'finished') return;
      // Forfeit: the remaining connected side wins outright.
      const winner: Side = location.side === 'a' ? 'b' : 'a';
      match.state = { ...match.state, status: 'finished', winner, winReason: 'forfeit' };
      const outcome = finalizeMatch(db, {
        mode: match.mode,
        matchState: match.state,
        playerAId: match.a.userId,
        playerBId: match.b.userId,
        playerAName: match.a.name,
        playerBName: match.b.name,
        bIsBot: false,
      });
      const remainingSocketId = winner === 'a' ? match.a.socketId : match.b.socketId;
      io.to(remainingSocketId).emit('match:end', { ...personalizeOutcome(outcome, winner), opponentDisconnected: true });
      clearTimeout(match.turnTimeout);
      activeMatches.delete(match.matchId);
      socketToMatch.delete(match.a.socketId);
      socketToMatch.delete(match.b.socketId);
    });
  });

  return io;
}

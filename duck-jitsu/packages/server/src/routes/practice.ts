import {
  AI_DIFFICULTIES,
  buildDeck,
  createMatch,
  pickAiCard,
  pickScriptedCard,
  playTurn,
  TUTORIAL_AI_DECK_IDS,
  TUTORIAL_PLAYER_DECK_IDS,
  type Element,
  type MatchState,
} from '@duck-jitsu/engine';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import {
  arenaTierFor,
  buildAiDeck,
  buildPlayerDeck,
  finalizeMatch,
  personalizeOutcome,
  relativeOutcome,
  serializeMatchView,
} from '../matchEngine';
import { getUserById } from '../repo/users';

interface PracticeSession {
  matchId: string;
  userId: string;
  isTutorial: boolean;
  state: MatchState;
  lastPlayerElement?: Element;
}

const sessions = new Map<string, PracticeSession>();

function highlightFor(session: PracticeSession): string | undefined {
  if (!session.isTutorial) return undefined;
  return session.state.a.hand[0]?.instanceId;
}

const startSchema = z.object({ tutorial: z.boolean().optional() });
const playSchema = z.object({ instanceId: z.string() });

export function practiceRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/start', (req, res) => {
    const parsed = startSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isTutorial = parsed.data.tutorial ?? false;
    let playerDeck;
    let aiDeck;
    if (isTutorial) {
      playerDeck = buildDeck(TUTORIAL_PLAYER_DECK_IDS.map((cardId) => ({ cardId, level: 1, duplicates: 0 })));
      aiDeck = buildDeck(TUTORIAL_AI_DECK_IDS.map((cardId) => ({ cardId, level: 1, duplicates: 0 })));
    } else {
      try {
        playerDeck = buildPlayerDeck(db, user.id);
      } catch {
        res.status(400).json({ error: 'You need at least one card to play -- open your starter pack first' });
        return;
      }
      aiDeck = buildAiDeck(arenaTierFor(db, user.id), Date.now() ^ Math.floor(Math.random() * 1e9));
    }

    const matchId = randomUUID();
    const state = createMatch(user.id, playerDeck, 'ai', aiDeck);
    const session: PracticeSession = { matchId, userId: user.id, isTutorial, state };
    sessions.set(matchId, session);

    res.status(201).json({
      matchId,
      opponentName: isTutorial ? 'Sensei Bot' : 'Practice Bot',
      view: serializeMatchView(state, 'a'),
      highlightInstanceId: highlightFor(session),
    });
  });

  router.post('/:matchId/play', (req, res) => {
    const parsed = playSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const session = sessions.get(req.params.matchId);
    if (!session || session.userId !== req.userId) {
      res.status(404).json({ error: 'No active practice match with that id' });
      return;
    }
    if (session.state.status === 'finished') {
      res.status(409).json({ error: 'Match already finished' });
      return;
    }

    const aiCard = session.isTutorial
      ? pickScriptedCard(session.state.b.hand)
      : pickAiCard(session.state.b.hand, session.lastPlayerElement, Math.random, AI_DIFFICULTIES.practice);

    let turn;
    try {
      turn = playTurn(session.state, parsed.data.instanceId, aiCard.instanceId);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid move' });
      return;
    }

    session.lastPlayerElement = turn.turnResult.cardA.element;
    session.state = turn.state;

    let outcome;
    if (turn.state.status === 'finished') {
      const user = getUserById(db, session.userId)!;
      const rawOutcome = finalizeMatch(db, {
        mode: 'practice',
        matchState: turn.state,
        playerAId: session.userId,
        playerBId: 'AI',
        playerAName: user.display_name,
        playerBName: session.isTutorial ? 'Sensei Bot' : 'Practice Bot',
        bIsBot: true,
      });
      outcome = personalizeOutcome(rawOutcome, 'a'); // the human player is always side 'a' here
      // Note: winning the scripted tutorial battle is only the middle of onboarding (starter
      // pack + arena walkthrough steps still follow) -- tutorialCompleted is set later, by the
      // client explicitly calling POST /me/tutorial-complete once the whole flow finishes.
      sessions.delete(req.params.matchId);
    }

    res.json({
      turnResult: {
        outcome: relativeOutcome(turn.turnResult.outcome, 'a'),
        reason: turn.turnResult.reason,
        yourCard: turn.turnResult.cardA,
        opponentCard: turn.turnResult.cardB,
      },
      view: serializeMatchView(turn.state, 'a'),
      highlightInstanceId: highlightFor(session),
      outcome,
    });
  });

  return router;
}

import type { CardDef, OwnedCard, PlayableCard, RarityBand, ShopOffer } from '@duck-jitsu/engine';

export type { ShopOffer, RarityBand };

export interface Avatar {
  color: string;
  accessory: string;
}

export interface Profile {
  id: string;
  displayName: string;
  isGuest: boolean;
  avatar: Avatar;
  softCurrency: number;
  premiumCurrency: number;
  trophies: number;
  arena: { tier: number; id: string; name: string };
  adsRemoved: boolean;
  starterPackClaimed: boolean;
  tutorialCompleted: boolean;
  ownedCards: OwnedCard[];
}

export interface AuthResponse {
  token: string;
  profile: Profile;
}

export interface RevealedCard extends CardDef {
  rarityBand: RarityBand;
}

export interface PackOpenResponse {
  cards: RevealedCard[];
  profile: Profile;
}

export interface ArenaSummary {
  tier: number;
  id: string;
  name: string;
  trophyRequirement: number;
  description?: string;
}

export interface ArenaMineResponse {
  current: ArenaSummary & { unlocksCardIds: string[] };
  next: (ArenaSummary & { newCardCount: number }) | null;
  trophies: number;
}

export type RelativeOutcome = 'you' | 'opponent' | 'draw';

export interface MatchTurnResult {
  outcome: RelativeOutcome;
  reason: string;
  yourCard: PlayableCard;
  opponentCard: PlayableCard;
}

export interface MatchSideView {
  hand?: PlayableCard[];
  handCount?: number;
  deckCount: number;
  collected: PlayableCard[];
  discardedCount: number;
}

export interface MatchView {
  status: 'in_progress' | 'finished';
  turnNumber: number;
  winner?: RelativeOutcome;
  winReason?: string;
  you: MatchSideView & { hand: PlayableCard[] };
  opponent: MatchSideView & { handCount: number };
}

export interface MatchOutcome {
  winner: RelativeOutcome;
  winReason: string;
  trophyDelta: number;
  softCurrencyDelta: number;
  opponentDisconnected?: boolean;
}

export interface PracticeStartResponse {
  matchId: string;
  opponentName: string;
  view: MatchView;
  highlightInstanceId?: string;
}

export interface PracticePlayResponse {
  turnResult: MatchTurnResult;
  view: MatchView;
  highlightInstanceId?: string;
  outcome?: MatchOutcome;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  trophies: number;
  arena: string;
  avatar: Avatar;
}

export interface MatchHistoryEntry {
  id: string;
  mode: string;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  trophyDelta: number;
  winReason: string;
  createdAt: string;
}

export interface IapProduct {
  id: string;
  kind: 'remove_ads' | 'premium_currency';
  name: string;
  priceUsd: number;
  premiumCurrencyAmount?: number;
}

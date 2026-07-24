import type { BeltColor, CardDef, OwnedCard, PlayableCard, RarityBand, ShopOffer } from '@duck-jitsu/engine';

export type { ShopOffer, RarityBand, BeltColor };

export interface Avatar {
  color: string;
  accessory: string;
}

export interface ProfileClan {
  id: string;
  name: string;
  bannerColor: string;
  role: string;
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
  belt: BeltColor;
  hasDefeatedSensei: boolean;
  senseiUnlocked: boolean;
  level: number;
  xp: number;
  xpToNextLevel: number;
  clan: ProfileClan | null;
  unclaimedMailCount: number;
  pendingFriendRequestCount: number;
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
  xpGained: number;
  leveledUp: boolean;
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
  belt: BeltColor;
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

export interface MissionReward {
  softCurrency?: number;
  premiumCurrency?: number;
  xp?: number;
}

export interface MissionView {
  id: string;
  description: string;
  target: number;
  progress: number;
  claimed: boolean;
  reward: MissionReward;
}

export interface DailyRewardStatus {
  claimable: boolean;
  hoursUntilNextClaim: number;
  nextStreakDay: number;
  streak: number;
}

export interface DailyRewardClaimResponse {
  streakDay: number;
  reward: { softCurrency: number; premiumCurrency: number };
  profile: Profile;
}

export interface SpinWheelSegment {
  id: string;
  label: string;
  weight: number;
  reward: { softCurrency?: number; premiumCurrency?: number };
}

export interface SpinWheelStatus {
  segments: SpinWheelSegment[];
  claimable: boolean;
  hoursUntilNextSpin: number;
}

export interface SpinWheelResult {
  segment: SpinWheelSegment;
  profile: Profile;
}

export interface ClanMember {
  userId: string;
  displayName: string;
  role: string;
  trophies: number;
  joinedAt: string;
}

export interface ClanDetail {
  id: string;
  name: string;
  bannerColor: string;
  description: string;
  leaderId: string;
  members: ClanMember[];
}

export interface ClanSummary {
  id: string;
  name: string;
  bannerColor: string;
  description: string;
  memberCount: number;
}

export interface MailMessage {
  id: string;
  title: string;
  body: string;
  rewardSoft: number;
  rewardPremium: number;
  claimed: boolean;
  createdAt: string;
}

export interface FriendEntry {
  linkId: string;
  userId: string;
  displayName: string;
  trophies: number;
  avatar: Avatar;
}

export interface FriendsResponse {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

export interface FriendSearchResult {
  userId: string;
  displayName: string;
  trophies: number;
}

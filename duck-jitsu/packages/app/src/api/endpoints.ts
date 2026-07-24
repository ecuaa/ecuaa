import type { CardDef, PackDef } from '@duck-jitsu/engine';
import { api } from './client';
import type {
  ArenaMineResponse,
  AuthResponse,
  ClanDetail,
  ClanSummary,
  DailyRewardClaimResponse,
  DailyRewardStatus,
  FriendSearchResult,
  FriendsResponse,
  IapProduct,
  LeaderboardEntry,
  MailMessage,
  MatchHistoryEntry,
  MissionView,
  PackOpenResponse,
  PracticePlayResponse,
  PracticeStartResponse,
  Profile,
  ShopOffer,
  SpinWheelResult,
  SpinWheelStatus,
} from './types';

export const AuthApi = {
  register: (email: string, password: string, displayName: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, displayName }),
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  guest: (displayName?: string) => api.post<AuthResponse>('/auth/guest', { displayName }),
  me: () => api.get<{ profile: Profile }>('/auth/me'),
};

export const ProfileApi = {
  get: () => api.get<{ profile: Profile }>('/me'),
  updateAvatar: (color: string, accessory: string) =>
    api.patch<{ profile: Profile }>('/me/avatar', { color, accessory }),
  completeTutorial: () => api.post<{ profile: Profile }>('/me/tutorial-complete'),
};

export const CatalogApi = {
  mine: () => api.get<{ cards: CardDef[] }>('/catalog/mine'),
  arenas: () => api.get<{ arenas: ArenaMineResponse['current'][] }>('/catalog/arenas'),
  arenasMine: () => api.get<ArenaMineResponse>('/catalog/arenas/mine'),
};

export const PacksApi = {
  list: () => api.get<{ packs: Record<string, PackDef> }>('/packs'),
  openStarter: () => api.post<PackOpenResponse>('/packs/starter/open'),
  open: (packId: string) => api.post<PackOpenResponse>('/packs/open', { packId }),
};

export const ShopApi = {
  offers: () => api.get<{ offers: ShopOffer[]; refreshesInHours: number }>('/shop/offers'),
  purchase: (offerId: string) => api.post<{ profile: Profile }>('/shop/purchase', { offerId }),
};

export const CardsApi = {
  levelUp: (cardId: string) => api.post<{ profile: Profile }>(`/cards/${cardId}/level-up`),
};

export const LeaderboardApi = {
  top: (limit = 50) => api.get<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`),
};

export const MatchHistoryApi = {
  recent: (limit = 20) => api.get<{ history: MatchHistoryEntry[] }>(`/match-history?limit=${limit}`),
};

export const IapApi = {
  products: () => api.get<{ products: IapProduct[] }>('/iap/products'),
  purchase: (productId: string) => api.post<{ profile: Profile }>('/iap/purchase', { productId }),
};

export const PracticeApi = {
  start: (opts: { tutorial?: boolean; sensei?: boolean } = {}) =>
    api.post<PracticeStartResponse>('/practice/start', opts),
  play: (matchId: string, instanceId: string) =>
    api.post<PracticePlayResponse>(`/practice/${matchId}/play`, { instanceId }),
};

export const MissionsApi = {
  today: () => api.get<{ missions: MissionView[] }>('/missions/today'),
  claim: (missionId: string) => api.post<{ missions: MissionView[]; profile: Profile }>('/missions/claim', { missionId }),
};

export const DailyRewardApi = {
  status: () => api.get<DailyRewardStatus>('/daily-reward'),
  claim: () => api.post<DailyRewardClaimResponse>('/daily-reward/claim'),
};

export const SpinWheelApi = {
  status: () => api.get<SpinWheelStatus>('/spin-wheel'),
  spin: () => api.post<SpinWheelResult>('/spin-wheel/spin'),
};

export const ClansApi = {
  list: () => api.get<{ clans: ClanSummary[] }>('/clans'),
  mine: () => api.get<{ clan: ClanDetail | null }>('/clans/mine'),
  create: (name: string, bannerColor: string, description?: string) =>
    api.post<{ clan: ClanDetail }>('/clans', { name, bannerColor, description }),
  join: (clanId: string) => api.post<{ clan: ClanDetail }>(`/clans/${clanId}/join`),
  leave: () => api.post<{ clan: null }>('/clans/leave'),
};

export const MailApi = {
  list: () => api.get<{ mail: MailMessage[] }>('/mail'),
  claim: (mailId: string) => api.post<{ mail: MailMessage[]; profile: Profile }>(`/mail/${mailId}/claim`),
};

export const FriendsApi = {
  list: () => api.get<FriendsResponse>('/friends'),
  search: (q: string) => api.get<{ results: FriendSearchResult[] }>(`/friends/search?q=${encodeURIComponent(q)}`),
  request: (targetUserId: string) => api.post<{ ok: true }>('/friends/request', { targetUserId }),
  accept: (linkId: string) => api.post<{ ok: true }>(`/friends/${linkId}/accept`),
  decline: (linkId: string) => api.post<{ ok: true }>(`/friends/${linkId}/decline`),
  remove: (linkId: string) => api.delete<{ ok: true }>(`/friends/${linkId}`),
};

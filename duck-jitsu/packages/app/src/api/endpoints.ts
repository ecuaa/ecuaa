import type { CardDef, PackDef } from '@duck-jitsu/engine';
import { api } from './client';
import type {
  ArenaMineResponse,
  AuthResponse,
  IapProduct,
  LeaderboardEntry,
  MatchHistoryEntry,
  PackOpenResponse,
  PracticePlayResponse,
  PracticeStartResponse,
  Profile,
  ShopOffer,
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
  start: (tutorial: boolean) => api.post<PracticeStartResponse>('/practice/start', { tutorial }),
  play: (matchId: string, instanceId: string) =>
    api.post<PracticePlayResponse>(`/practice/${matchId}/play`, { instanceId }),
};

import { arenaForTrophies, isSenseiUnlocked, playerBelt, xpToNextLevel } from '@duck-jitsu/engine';
import type { Db } from './db';
import { getClanById, getClanMembership } from './repo/clans';
import { countPendingIncoming } from './repo/friends';
import { countUnclaimedMail } from './repo/mail';
import { getOwnedCards } from './repo/ownedCards';
import type { UserRow } from './repo/users';

export function serializeProfile(db: Db, user: UserRow) {
  const arena = arenaForTrophies(user.trophies);
  const hasDefeatedSensei = Boolean(user.has_defeated_sensei);
  const membership = getClanMembership(db, user.id);
  const clan = membership ? getClanById(db, membership.clan_id) : undefined;
  return {
    id: user.id,
    displayName: user.display_name,
    isGuest: Boolean(user.is_guest),
    avatar: { color: user.avatar_color, accessory: user.avatar_accessory },
    softCurrency: user.soft_currency,
    premiumCurrency: user.premium_currency,
    trophies: user.trophies,
    arena: { tier: arena.tier, id: arena.id, name: arena.name },
    adsRemoved: Boolean(user.ads_removed),
    starterPackClaimed: Boolean(user.starter_pack_claimed),
    tutorialCompleted: Boolean(user.tutorial_completed),
    ownedCards: getOwnedCards(db, user.id),
    belt: playerBelt(arena.tier, hasDefeatedSensei),
    hasDefeatedSensei,
    senseiUnlocked: isSenseiUnlocked(user.trophies),
    level: user.level,
    xp: user.xp,
    xpToNextLevel: xpToNextLevel(user.level),
    clan: clan ? { id: clan.id, name: clan.name, bannerColor: clan.banner_color, role: membership!.role } : null,
    unclaimedMailCount: countUnclaimedMail(db, user.id),
    pendingFriendRequestCount: countPendingIncoming(db, user.id),
  };
}

export type PublicProfile = ReturnType<typeof serializeProfile>;

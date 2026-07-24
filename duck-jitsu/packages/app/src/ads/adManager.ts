/**
 * Mock ad SDK. Stands in for a real integration (e.g. Google AdMob / Unity Ads) so the natural
 * ad-break points in the game (after a match, never mid-battle) are already wired up. Swapping
 * in a real SDK later only means replacing the body of `showInterstitialAd`.
 */

export function shouldShowAds(adsRemoved: boolean): boolean {
  return !adsRemoved;
}

export interface InterstitialAdResult {
  /** True if the simulated ad played to completion (vs. being skipped early). */
  completed: boolean;
}

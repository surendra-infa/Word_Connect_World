import { AdMob, AdmobConsentStatus, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Google's official test IDs. Replace via env vars (VITE_ADMOB_REWARDED_ID /
// VITE_ADMOB_INTERSTITIAL_ID) or below once your AdMob account is approved —
// never ship with test IDs set to `true`-traffic production builds.
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

const REWARDED_ID = import.meta.env.VITE_ADMOB_REWARDED_ID || TEST_REWARDED_ID;
const INTERSTITIAL_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || TEST_INTERSTITIAL_ID;

// Ads only exist inside the native app build, never in the browser.
export const adsAvailable = Capacitor.isNativePlatform();

let initialized = false;

export async function initAds(): Promise<void> {
  if (!adsAvailable || initialized) return;
  initialized = true;

  await AdMob.initialize();

  // EU/UK consent (GDPR) — required before serving personalized ads there.
  try {
    const { status } = await AdMob.requestConsentInfo();
    if (status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
  } catch {
    // Consent lookup is best-effort; never block gameplay on it.
  }
}

/** Preloads the next interstitial so level transitions stay instant. */
export async function preloadAds(): Promise<void> {
  if (!adsAvailable) return;
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
  } catch {
    // Load failures are non-fatal; retried at next use.
  }
}

let lastInterstitialLevel = 0;

/** Shows a full-screen ad between levels, at most every 3rd level. */
export async function maybeShowInterstitial(levelId: number): Promise<boolean> {
  if (!adsAvailable || levelId - lastInterstitialLevel < 3) return false;
  lastInterstitialLevel = levelId;
  try {
    await AdMob.showInterstitial();
    await preloadAds();
    return true;
  } catch {
    return false;
  }
}

export type AdResult = 'rewarded' | 'dismissed' | 'unavailable';

/** Watch-to-earn ad. Resolves 'rewarded' only when the reward is granted. */
export async function showRewardedAd(): Promise<AdResult> {
  if (!adsAvailable) return 'unavailable';

  let rewarded = false;
  const rewardHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
    rewarded = true;
  });
  try {
    await AdMob.prepareRewardVideoAd({ adId: REWARDED_ID });
    await AdMob.showRewardVideoAd();
    return rewarded ? 'rewarded' : 'dismissed';
  } catch {
    return 'unavailable';
  } finally {
    void rewardHandle.remove();
  }
}

import { useState, useEffect, useCallback } from 'react';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { API_CONFIG } from '@/constants/config';
import { Alert } from 'react-native';

const adUnitId = __DEV__ ? TestIds.REWARDED : API_CONFIG.ADMOB_IDS.REWARDED_AD_UNIT_ID;

export function useRewardedAd() {
  const [ad, setAd] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const loadAd = useCallback(() => {
    try {
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        keywords: ['resume', 'job', 'career'],
      });
      
      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
      });
      
      const unsubscribeEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log('User earned reward of ', reward);
          setLoaded(false);
        },
      );

      rewarded.load();
      setAd(rewarded);

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
      };
    } catch (e) {
      console.log('AdMob Rewarded not available');
    }
  }, []);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
  }, [loadAd]);

  const showAd = useCallback(async (onEarned: () => void) => {
    if (!ad || !loaded) {
      Alert.alert("Ad Loading", "The ad is still loading, please try again in a moment.");
      loadAd();
      return false;
    }

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        onEarned();
      },
    );

    try {
      await ad.show();
      setLoaded(false);
      loadAd();
      return true;
    } catch (e) {
      console.error('Failed to show ad', e);
      return false;
    }
  }, [ad, loaded, loadAd]);

  return { loaded, showAd };
}

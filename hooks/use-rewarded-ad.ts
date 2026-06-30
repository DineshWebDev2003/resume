export function useRewardedAd() {
  return {
    loaded: true,
    showAd: async (onEarned: () => void) => {
      onEarned();
      return true;
    },
  };
}

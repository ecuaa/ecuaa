export type RootStackParamList = {
  MainTabs: undefined;
  Tutorial: undefined;
  Battle: { mode: 'practice' | 'casual' | 'ranked' };
  PackOpening: { source: 'starter' | 'basic' | 'premium' };
};

export type MainTabsParamList = {
  Arena: undefined;
  Shop: undefined;
  Rankings: undefined;
  Profile: undefined;
};

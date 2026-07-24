export type RootStackParamList = {
  MainTabs: undefined;
  Tutorial: undefined;
  Battle: { mode: 'practice' | 'casual' | 'ranked' | 'sensei' };
  PackOpening: { source: 'starter' | 'basic' | 'premium' };
};

export type MainTabsParamList = {
  Arena: undefined;
  Shop: undefined;
  Rankings: undefined;
  Profile: undefined;
};

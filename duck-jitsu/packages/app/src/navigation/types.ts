import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabsParamList = {
  Shop: undefined;
  Cards: undefined;
  Arena: undefined;
  Clan: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  Tutorial: undefined;
  Battle: { mode: 'practice' | 'casual' | 'ranked' | 'sensei' };
  PackOpening: { source: 'starter' | 'basic' | 'premium' };
  Missions: undefined;
  SpinWheel: undefined;
  Mail: undefined;
  Friends: undefined;
  Rankings: undefined;
};

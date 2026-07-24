import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ArenaHomeScreen } from '../screens/ArenaHomeScreen';
import { CardsCollectionScreen } from '../screens/CardsCollectionScreen';
import { ClanScreen } from '../screens/ClanScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { colors } from '../theme/colors';
import type { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ICONS: Record<keyof MainTabsParamList, string> = {
  Shop: '🛍️',
  Cards: '🎴',
  Arena: '⛩️',
  Clan: '🚩',
  Profile: '⚙️',
};

const LABELS: Record<keyof MainTabsParamList, string> = {
  Shop: 'Shop',
  Cards: 'Cards',
  Arena: 'Home',
  Clan: 'Clan',
  Profile: 'Settings',
};

export function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.bambooDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: LABELS[route.name as keyof MainTabsParamList],
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name as keyof MainTabsParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Cards" component={CardsCollectionScreen} />
      <Tab.Screen name="Arena" component={ArenaHomeScreen} />
      <Tab.Screen name="Clan" component={ClanScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

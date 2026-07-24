import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '../screens/AuthScreen';
import { BattleScreen } from '../screens/battle/BattleScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { MailScreen } from '../screens/MailScreen';
import { MissionsScreen } from '../screens/MissionsScreen';
import { PackOpeningScreen } from '../screens/pack/PackOpeningScreen';
import { RankingsScreen } from '../screens/RankingsScreen';
import { SpinWheelScreen } from '../screens/SpinWheelScreen';
import { TutorialFlowScreen } from '../screens/tutorial/TutorialFlowScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { MainTabsNavigator } from './MainTabsNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status, profile } = useAuthStore();

  if (status === 'hydrating') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (status === 'signed-out' || !profile) {
    return <AuthScreen />;
  }

  if (!profile.tutorialCompleted) {
    return <TutorialFlowScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
      <Stack.Screen name="Battle" component={BattleScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="PackOpening" component={PackOpeningScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Missions" component={MissionsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SpinWheel" component={SpinWheelScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Mail" component={MailScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Friends" component={FriendsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Rankings" component={RankingsScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

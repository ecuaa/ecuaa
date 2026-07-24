import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '../screens/AuthScreen';
import { BattleScreen } from '../screens/battle/BattleScreen';
import { PackOpeningScreen } from '../screens/pack/PackOpeningScreen';
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
    </Stack.Navigator>
  );
}

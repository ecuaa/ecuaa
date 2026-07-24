import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { PackOpeningFlow } from './PackOpeningFlow';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PackRoute = RouteProp<RootStackParamList, 'PackOpening'>;

export function PackOpeningScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PackRoute>();
  return <PackOpeningFlow source={route.params.source} onDone={() => navigation.goBack()} />;
}

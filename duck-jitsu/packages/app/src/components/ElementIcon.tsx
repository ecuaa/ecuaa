import Svg, { Circle, Path } from 'react-native-svg';
import type { Element } from '@duck-jitsu/engine';
import { colors } from '../theme/colors';

interface Props {
  element: Element;
  size?: number;
  color?: string;
}

export function ElementIcon({ element, size = 24, color }: Props) {
  const tint = color ?? colors[element];
  if (element === 'fire') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-2-1-2 1.5 1 3 3 3 5.5A6.5 6.5 0 0 1 5 12.5C5 8 9 5 12 2Z"
          fill={tint}
        />
      </Svg>
    );
  }
  if (element === 'water') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 2c4 5 7 9 7 13a7 7 0 1 1-14 0c0-4 3-8 7-13Z" fill={tint} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2v20M4 6l16 12M20 6 4 18M2 12h20M6.5 4l11 16M17.5 4l-11 16"
        stroke={tint}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={12} r={2.4} fill={tint} />
    </Svg>
  );
}

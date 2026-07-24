import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Element } from '@duck-jitsu/engine';
import { colors, elementColors } from '../theme/colors';

interface Props {
  element: Element;
  color: string;
  special?: boolean;
  width: number;
  height: number;
}

const ELEMENT_TONES: Record<Element, { base: string; dark: string }> = {
  fire: { base: colors.fire, dark: colors.fireDark },
  water: { base: colors.water, dark: colors.waterDark },
  ice: { base: colors.ice, dark: colors.iceDark },
};

/** Full-bleed illustrated card face: radial-burst backdrop, a duck-ninja bust, and an element FX flourish. */
export function CardIllustration({ element, color, special, width, height }: Props) {
  const accent = elementColors[element];
  const gi = colors.cardColors[color] ?? colors.textMuted;
  const tone = ELEMENT_TONES[element];
  const cx = width / 2;
  const gradId = `bg-${element}-${special ? 'sp' : 'std'}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <RadialGradient id={gradId} cx="50%" cy="36%" r="75%">
          <Stop offset="0%" stopColor={tone.base} stopOpacity={1} />
          <Stop offset="100%" stopColor={tone.dark} stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gradId})`} />

      <G opacity={special ? 0.55 : 0.22}>
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const x2 = cx + Math.cos(angle) * width * 1.1;
          const y2 = height * 0.34 + Math.sin(angle) * width * 1.1;
          return (
            <Path
              key={i}
              d={`M${cx} ${height * 0.34} L${x2} ${y2}`}
              stroke={special ? colors.gold : '#ffffff'}
              strokeWidth={special ? width * 0.035 : width * 0.02}
            />
          );
        })}
      </G>

      <Rect x={0} y={height * 0.82} width={width} height={height * 0.18} fill={colors.textDark} opacity={0.18} />

      {element === 'fire' && (
        <Path
          d={`M${cx - width * 0.22} ${height * 0.66}
              C ${cx - width * 0.24} ${height * 0.5} ${cx - width * 0.08} ${height * 0.46} ${cx + width * 0.02} ${height * 0.3}
              C ${cx + width * 0.06} ${height * 0.44} ${cx + width * 0.2} ${height * 0.42} ${cx + width * 0.2} ${height * 0.56}
              C ${cx + width * 0.2} ${height * 0.7} ${cx + width * 0.08} ${height * 0.76} ${cx - width * 0.02} ${height * 0.76}
              C ${cx - width * 0.14} ${height * 0.76} ${cx - width * 0.22} ${height * 0.72} ${cx - width * 0.22} ${height * 0.66} Z`}
          fill={colors.gold}
          opacity={0.85}
        />
      )}
      {element === 'water' && (
        <Path
          d={`M${cx - width * 0.34} ${height * 0.6}
              C ${cx - width * 0.16} ${height * 0.48} ${cx + width * 0.16} ${height * 0.48} ${cx + width * 0.34} ${height * 0.6}
              C ${cx + width * 0.2} ${height * 0.7} ${cx - width * 0.2} ${height * 0.7} ${cx - width * 0.34} ${height * 0.6} Z`}
          fill="#ffffff"
          opacity={0.32}
        />
      )}
      {element === 'ice' && (
        <G opacity={0.5}>
          <Path d={`M${cx} ${height * 0.42} L${cx + width * 0.1} ${height * 0.56} L${cx} ${height * 0.7} L${cx - width * 0.1} ${height * 0.56} Z`} fill="#ffffff" />
          <Path d={`M${cx - width * 0.22} ${height * 0.58} L${cx - width * 0.14} ${height * 0.66} L${cx - width * 0.22} ${height * 0.74} L${cx - width * 0.28} ${height * 0.66} Z`} fill="#ffffff" opacity={0.7} />
          <Path d={`M${cx + width * 0.22} ${height * 0.58} L${cx + width * 0.3} ${height * 0.66} L${cx + width * 0.22} ${height * 0.74} L${cx + width * 0.16} ${height * 0.66} Z`} fill="#ffffff" opacity={0.7} />
        </G>
      )}

      <Ellipse cx={cx} cy={height * 0.74} rx={width * 0.29} ry={height * 0.16} fill={gi} stroke={colors.textDark} strokeWidth={width * 0.022} />
      <Rect x={cx - width * 0.29} y={height * 0.71} width={width * 0.58} height={height * 0.045} fill={colors.textDark} opacity={0.85} />

      <Circle cx={cx} cy={height * 0.46} r={width * 0.23} fill={colors.gold} stroke={colors.textDark} strokeWidth={width * 0.022} />
      <Path
        d={`M${cx + width * 0.15} ${height * 0.47}
            C ${cx + width * 0.27} ${height * 0.46} ${cx + width * 0.29} ${height * 0.5} ${cx + width * 0.27} ${height * 0.53}
            C ${cx + width * 0.22} ${height * 0.55} ${cx + width * 0.16} ${height * 0.53} ${cx + width * 0.15} ${height * 0.47} Z`}
        fill={tone.dark}
        stroke={colors.textDark}
        strokeWidth={width * 0.016}
      />
      <Rect
        x={cx - width * 0.25}
        y={height * 0.36}
        width={width * 0.5}
        height={width * 0.09}
        fill={accent}
        stroke={colors.textDark}
        strokeWidth={width * 0.018}
      />
      <Circle cx={cx - width * 0.08} cy={height * 0.46} r={width * 0.03} fill={colors.textDark} />
      <Circle cx={cx + width * 0.04} cy={height * 0.46} r={width * 0.03} fill={colors.textDark} />

      {special && (
        <G>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <Circle
                key={i}
                cx={cx + Math.cos(angle) * width * 0.4}
                cy={height * 0.3 + Math.sin(angle) * height * 0.22}
                r={width * 0.028}
                fill={colors.gold}
              />
            );
          })}
        </G>
      )}
    </Svg>
  );
}

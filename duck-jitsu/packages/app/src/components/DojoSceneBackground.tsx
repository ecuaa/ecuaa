import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const STARS = [
  [30, 60], [70, 40], [120, 90], [200, 50], [250, 30], [310, 70], [350, 45], [40, 130], [180, 20], [280, 110],
  [20, 200], [340, 160], [90, 25], [230, 140], [370, 210],
];

/** Full-bleed night-time dojo courtyard: sky, moon, mountains, torii gate, pagoda, pond, path. */
export function DojoSceneBackground({ width, height }: { width: number; height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#071B2E" />
            <Stop offset="55%" stopColor="#0E3A52" />
            <Stop offset="100%" stopColor="#1B6178" />
          </SvgLinearGradient>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFF9E6" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#FFF9E6" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="lantern" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFB84D" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#FFB84D" stopOpacity={0} />
          </RadialGradient>
          <SvgLinearGradient id="pond" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2C7A94" stopOpacity={0.7} />
            <Stop offset="100%" stopColor="#0E3A52" stopOpacity={0.4} />
          </SvgLinearGradient>
        </Defs>

        <Rect x={0} y={0} width={400} height={700} fill="url(#sky)" />

        {STARS.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#fff" opacity={0.5 + (i % 4) * 0.12} />
        ))}

        <Circle cx={90} cy={110} r={70} fill="url(#moonGlow)" />
        <Circle cx={90} cy={110} r={34} fill="#FFF9E6" />

        {/* distant mountains */}
        <Path d="M0 300 L60 240 L110 285 L170 220 L230 270 L300 210 L360 260 L400 235 L400 340 L0 340 Z" fill="#0B2C42" opacity={0.9} />
        <Path d="M0 330 L50 300 L100 320 L160 280 L220 315 L290 275 L350 310 L400 290 L400 380 L0 380 Z" fill="#123B54" opacity={0.9} />

        {/* pagoda, right side */}
        <Path d="M255 380 L255 520 L345 520 L345 380 Z" fill="#241914" />
        <Path d="M245 380 L300 340 L355 380 Z" fill="#3A241A" />
        <Path d="M235 400 L300 355 L365 400 L345 400 L300 368 L255 400 Z" fill="#4A2E1F" />
        <Rect x={275} y={420} width={16} height={30} rx={2} fill="#FFB84D" opacity={0.85} />
        <Rect x={305} y={420} width={16} height={30} rx={2} fill="#FFB84D" opacity={0.85} />
        <Circle cx={340} cy={470} r={18} fill="url(#lantern)" />
        <Ellipse cx={340} cy={470} rx={7} ry={10} fill="#E8574A" opacity={0.9} />
        <Circle cx={260} cy={500} r={18} fill="url(#lantern)" />
        <Ellipse cx={260} cy={500} rx={7} ry={10} fill="#E8574A" opacity={0.9} />

        {/* torii gate, left side */}
        <Rect x={55} y={380} width={14} height={140} fill="#8A2E22" />
        <Rect x={145} y={380} width={14} height={140} fill="#8A2E22" />
        <Rect x={40} y={370} width={140} height={16} rx={3} fill="#A8402F" />
        <Rect x={50} y={392} width={120} height={10} rx={2} fill="#8A2E22" />
        <Rect x={40} y={368} width={140} height={5} fill="#241914" />

        {/* ground path */}
        <Path d="M0 560 Q200 520 400 560 L400 700 L0 700 Z" fill="#2A4A3E" />
        <Path d="M0 585 Q200 555 400 585 L400 700 L0 700 Z" fill="#3E6B54" opacity={0.9} />
        <Path d="M60 700 Q140 610 200 620 Q260 630 340 700 Z" fill="#4B4038" opacity={0.55} />

        {/* pond */}
        <Ellipse cx={110} cy={630} rx={90} ry={30} fill="url(#pond)" />
        <Ellipse cx={110} cy={630} rx={90} ry={30} fill="none" stroke="#BFE9EF" strokeOpacity={0.25} strokeWidth={2} />
      </Svg>
    </View>
  );
}

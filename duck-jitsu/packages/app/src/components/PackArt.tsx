import { Image, View } from 'react-native';

// Source artwork is 1086x1448 (~0.75 aspect ratio).
const ART_RATIO = 1086 / 1448;

const PACK_ART = require('../../assets/packs/duck-jitsu-pack.png');

const SIZES = {
  small: { height: 76 },
  medium: { height: 150 },
  large: { height: 300 },
};

export type PackArtSize = keyof typeof SIZES;

interface Props {
  size?: PackArtSize;
  style?: object;
}

/** Full foil-pack artwork, uncut. Used for shop listings and the pack-opening summary state. */
export function PackArt({ size = 'medium', style }: Props) {
  const height = SIZES[size].height;
  const width = height * ART_RATIO;
  return (
    <View style={[{ width, height, borderRadius: height * 0.06, overflow: 'hidden' }, style]}>
      <Image source={PACK_ART} style={{ width, height }} resizeMode="cover" />
    </View>
  );
}

/**
 * The same artwork split into a top "flap" and a bottom "body" via clipped, offset
 * copies of the same image -- lets the flap be torn away independently of the body.
 */
export function PackArtHalf({
  width,
  height,
  part,
  splitAt,
  style,
}: {
  width: number;
  height: number;
  part: 'top' | 'bottom';
  splitAt: number;
  style?: object;
}) {
  const sliceHeight = part === 'top' ? splitAt : height - splitAt;
  const offset = part === 'top' ? 0 : -splitAt;
  return (
    <View style={[{ width, height: sliceHeight, overflow: 'hidden' }, style]}>
      <Image source={PACK_ART} style={{ width, height, position: 'absolute', top: offset, left: 0 }} resizeMode="cover" />
    </View>
  );
}

export const packArtSource = PACK_ART;

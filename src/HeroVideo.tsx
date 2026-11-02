import React from 'react';
import { StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

// Looping, muted Higgsfield clip that sits behind the aurora. It is only rendered when
// assets.heroVideo is set, so the screen works fine without it.
export function HeroVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  );
}
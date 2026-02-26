/**
 * OilFlowBackground
 * Subtle animated oil-flow effect using React Native Animated API.
 * Renders several translucent "oil blob" circles that slowly drift
 * and pulse, giving the impression of thick golden oil in motion.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Blob {
    x: number;
    y: number;
    size: number;
    color: string;
    driftX: Animated.Value;
    driftY: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    duration: number;
}

const BLOBS_CONFIG = [
    { x: -40, y: height * 0.05, size: 220, color: '#F5C800', dur: 7000 },
    { x: width - 100, y: height * 0.15, size: 160, color: '#E3001B', dur: 9000 },
    { x: width * 0.2, y: height * 0.5, size: 260, color: '#1A3C8F', dur: 11000 },
    { x: width * 0.6, y: height * 0.65, size: 180, color: '#F5C800', dur: 8500 },
    { x: -30, y: height * 0.75, size: 200, color: '#1E4DB7', dur: 10000 },
    { x: width * 0.75, y: height * 0.35, size: 140, color: '#E3001B', dur: 7500 },
];

const OilFlowBackground: React.FC = () => {
    const blobs = useRef<Blob[]>(
        BLOBS_CONFIG.map(cfg => ({
            x: cfg.x,
            y: cfg.y,
            size: cfg.size,
            color: cfg.color,
            driftX: new Animated.Value(0),
            driftY: new Animated.Value(0),
            scale: new Animated.Value(1),
            opacity: new Animated.Value(0),
            duration: cfg.dur,
        }))
    ).current;

    useEffect(() => {
        blobs.forEach((blob, i) => {
            // Fade in
            Animated.timing(blob.opacity, {
                toValue: 0.12 + (i % 3) * 0.03,
                duration: 1500,
                delay: i * 200,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start();

            // Drift loop
            const drift = (forward: boolean) => {
                Animated.parallel([
                    Animated.timing(blob.driftX, {
                        toValue: forward ? 30 + (i % 3) * 15 : 0,
                        duration: blob.duration,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.sin),
                    }),
                    Animated.timing(blob.driftY, {
                        toValue: forward ? 20 + (i % 2) * 20 : 0,
                        duration: blob.duration * 0.85,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.sin),
                    }),
                    Animated.timing(blob.scale, {
                        toValue: forward ? 1.12 + (i % 3) * 0.05 : 1,
                        duration: blob.duration,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.sin),
                    }),
                ]).start(() => drift(!forward));
            };
            drift(true);
        });
    }, [blobs]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {blobs.map((blob, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.blob,
                        {
                            left: blob.x,
                            top: blob.y,
                            width: blob.size,
                            height: blob.size,
                            borderRadius: blob.size / 2,
                            backgroundColor: blob.color,
                            opacity: blob.opacity,
                            transform: [
                                { translateX: blob.driftX },
                                { translateY: blob.driftY },
                                { scale: blob.scale },
                            ],
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    blob: {
        position: 'absolute',
    },
});

export default OilFlowBackground;

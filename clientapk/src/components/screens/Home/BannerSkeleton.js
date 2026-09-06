import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';

const HORIZONTAL_PADDING = 16;

const BannerSkeleton = ({ theme, bannerHeight }) => {
    const { width } = useWindowDimensions();
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const bannerWidth = width - HORIZONTAL_PADDING * 2;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );

        loop.start();

        return () => loop.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.85],
    });

    return (
        <View style={[styles.container, { marginHorizontal: HORIZONTAL_PADDING }]}>
            <Animated.View
                style={[
                    styles.skeletonBox,
                    {
                        width: bannerWidth,
                        height: bannerHeight,
                        backgroundColor: theme?.card || '#1C1F24',
                        opacity,
                    },
                ]}
            />

            <View style={styles.dotsRow}>
                {[0, 1, 2].map((i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: theme?.card || '#1C1F24',
                                opacity,
                            },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 14,
        marginBottom: 18,
    },
    skeletonBox: {
        borderRadius: 18,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 999,
    },
});

export default BannerSkeleton;
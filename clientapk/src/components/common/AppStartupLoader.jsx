import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    StatusBar,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const AppStartupLoader = () => {
    const logoScale = useRef(new Animated.Value(0.88)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0.28)).current;
    const textTranslate = useRef(new Animated.Value(12)).current;
    const dot1 = useRef(new Animated.Value(0.25)).current;
    const dot2 = useRef(new Animated.Value(0.25)).current;
    const dot3 = useRef(new Animated.Value(0.25)).current;
    const ringScale = useRef(new Animated.Value(0.94)).current;
    const ringOpacity = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 650,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(textTranslate, {
                toValue: 0,
                duration: 700,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(glowOpacity, {
                        toValue: 0.52,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringScale, {
                        toValue: 1.06,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacity, {
                        toValue: 0.18,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(glowOpacity, {
                        toValue: 0.28,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringScale, {
                        toValue: 0.94,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacity, {
                        toValue: 0.35,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(dot1, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2, {
                        toValue: 0.25,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3, {
                        toValue: 0.25,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(dot1, {
                        toValue: 0.25,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3, {
                        toValue: 0.25,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(dot1, {
                        toValue: 0.25,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2, {
                        toValue: 0.25,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, [dot1, dot2, dot3, glowOpacity, logoOpacity, logoScale, ringOpacity, ringScale, textTranslate]);

    return (
        <LinearGradient
            colors={['#020303', '#07110F', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="#020303" />

            <View style={styles.bgLayerTop} />
            <View style={styles.bgLayerBottom} />

            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            <Animated.View
                style={[
                    styles.outerRing,
                    {
                        opacity: ringOpacity,
                        transform: [{ scale: ringScale }],
                    },
                ]}
            />

            <Animated.View
                style={[
                    styles.centerWrap,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <View style={styles.logoShell}>
                    <Image
                        source={require('../../assets/images/ic_launcher-playstore.png')}
                        style={styles.logoImage}
                        resizeMode="cover"
                    />
                </View>

                <Animated.View
                    style={[
                        styles.textWrap,
                        {
                            transform: [{ translateY: textTranslate }],
                        },
                    ]}
                >
                    <Text style={styles.title}>TradeHub</Text>
                    <Text style={styles.subtitle}>
                        Smart investing. Daily wallet earnings. Fast execution.
                    </Text>
                </Animated.View>

                <View style={styles.loaderRow}>
                    <Animated.View style={[styles.dot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3 }]} />
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Loading your market experience...</Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    bgLayerTop: {
        position: 'absolute',
        top: -120,
        left: -70,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(0, 200, 150, 0.06)',
    },

    bgLayerBottom: {
        position: 'absolute',
        bottom: -140,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 230, 168, 0.05)',
    },

    glow: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(0, 200, 150, 0.13)',
    },

    outerRing: {
        position: 'absolute',
        width: 210,
        height: 210,
        borderRadius: 105,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.12)',
    },

    centerWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoShell: {
        width: 120,
        height: 120,
        borderRadius: 34,
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#00C8B4',
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 16,
    },

    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },

    textWrap: {
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 24,
    },

    title: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    subtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        color: 'rgba(255,255,255,0.70)',
        textAlign: 'center',
        maxWidth: 280,
    },

    loaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 26,
    },

    dot: {
        width: 9,
        height: 9,
        borderRadius: 999,
        backgroundColor: '#12D6C5',
        marginHorizontal: 6,
    },

    footer: {
        position: 'absolute',
        bottom: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },

    footerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});

export default AppStartupLoader;
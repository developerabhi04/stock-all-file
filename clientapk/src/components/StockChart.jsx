import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    PanResponder,
    Animated,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;
const CHART_HEIGHT = 240;
const PADDING_VERTICAL = 40;

// Enhanced realistic data with timestamps
const generateChartData = (period) => {
    const baseData = {
        '1D': [
            { value: 25763.35, time: '9:15 AM' },
            { value: 25720.50, time: '9:30 AM' },
            { value: 25690.20, time: '10:00 AM' },
            { value: 25650.80, time: '10:30 AM' },
            { value: 25678.20, time: '11:00 AM' },
            { value: 25640.15, time: '11:30 AM' },
            { value: 25610.90, time: '12:00 PM' },
            { value: 25650.40, time: '12:30 PM' },
            { value: 25597.65, time: '1:00 PM' },
        ],
        '1W': [
            { value: 25900.00, time: 'Mon' },
            { value: 25850.00, time: 'Tue' },
            { value: 25800.00, time: 'Wed' },
            { value: 25700.00, time: 'Thu' },
            { value: 25597.65, time: 'Fri' },
        ],
        '1M': [
            { value: 26200.00, time: '1 Nov' },
            { value: 26100.00, time: '5 Nov' },
            { value: 25950.00, time: '10 Nov' },
            { value: 25800.00, time: '15 Nov' },
            { value: 25700.00, time: '20 Nov' },
            { value: 25650.00, time: '25 Nov' },
            { value: 25597.65, time: '30 Nov' },
        ],
        '3M': [
            { value: 26500.00, time: 'Sep' },
            { value: 26200.00, time: 'Oct' },
            { value: 25900.00, time: 'Nov' },
            { value: 25597.65, time: 'Dec' },
        ],
        '6M': [
            { value: 27000.00, time: 'Jun' },
            { value: 26800.00, time: 'Jul' },
            { value: 26500.00, time: 'Aug' },
            { value: 26200.00, time: 'Sep' },
            { value: 25900.00, time: 'Oct' },
            { value: 25597.65, time: 'Nov' },
        ],
        '1Y': [
            { value: 24000.00, time: 'Dec 23' },
            { value: 24500.00, time: 'Feb 24' },
            { value: 25000.00, time: 'Apr 24' },
            { value: 25500.00, time: 'Jun 24' },
            { value: 26000.00, time: 'Aug 24' },
            { value: 25800.00, time: 'Oct 24' },
            { value: 25597.65, time: 'Nov 24' },
        ],
        '5Y': [
            { value: 18000.00, time: '2020' },
            { value: 20000.00, time: '2021' },
            { value: 22000.00, time: '2022' },
            { value: 24000.00, time: '2023' },
            { value: 25597.65, time: '2024' },
        ],
        'All': [
            { value: 12000.00, time: '2015' },
            { value: 15000.00, time: '2017' },
            { value: 18000.00, time: '2019' },
            { value: 22000.00, time: '2021' },
            { value: 24000.00, time: '2023' },
            { value: 25597.65, time: '2024' },
        ],
    };
    return baseData[period] || baseData['1D'];
};

const StockChart = ({ stockName = 'NIFTY 50', currentPrice, change, isPositive }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('1D');
    const [touchedPoint, setTouchedPoint] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const data = generateChartData(selectedPeriod);
    const values = data.map(d => d.value);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const periodChange = ((lastValue - firstValue) / firstValue * 100).toFixed(2);
    const absoluteChange = (lastValue - firstValue).toFixed(2);
    const isPeriodPositive = periodChange >= 0;

    // Dynamic colors based on performance
    const chartColor = isPeriodPositive ? '#00C896' : '#FF5252';
    const bgColor = isPeriodPositive ? '#E8F9F5' : '#FFE8E8';

    // Calculate chart points
    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * CHART_WIDTH;
        const normalizedY = (item.value - minValue) / range;
        const y = CHART_HEIGHT - PADDING_VERTICAL - (normalizedY * (CHART_HEIGHT - 2 * PADDING_VERTICAL));
        return { x, y, value: item.value, time: item.time, index };
    });

    // Touch handler
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e) => handleTouch(e.nativeEvent.locationX),
            onPanResponderMove: (e) => handleTouch(e.nativeEvent.locationX),
            onPanResponderRelease: () => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => setTouchedPoint(null));
            },
        })
    ).current;

    const handleTouch = (touchX) => {
        let closestPoint = points[0];
        let minDistance = Math.abs(touchX - points[0].x);

        points.forEach(point => {
            const distance = Math.abs(touchX - point.x);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        });

        setTouchedPoint(closestPoint);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
        }).start();
    };

    // Smooth Catmull-Rom curve
    const createSmoothPath = () => {
        const segments = [];

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            const steps = 25;

            for (let t = 0; t < steps; t++) {
                const t1 = t / steps;
                const t2 = (t + 1) / steps;

                const x1 = catmullRom(t1, p0.x, p1.x, p2.x, p3.x);
                const y1 = catmullRom(t1, p0.y, p1.y, p2.y, p3.y);
                const x2 = catmullRom(t2, p0.x, p1.x, p2.x, p3.x);
                const y2 = catmullRom(t2, p0.y, p1.y, p2.y, p3.y);

                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

                segments.push(
                    <View
                        key={`${i}-${t}`}
                        style={[
                            styles.pathSegment,
                            {
                                width: length + 1,
                                left: x1,
                                top: y1,
                                backgroundColor: chartColor,
                                transform: [{ rotate: `${angle}deg` }],
                            }
                        ]}
                    />
                );
            }
        }

        return segments;
    };

    const catmullRom = (t, p0, p1, p2, p3) => {
        const v0 = (p2 - p0) * 0.5;
        const v1 = (p3 - p1) * 0.5;
        const t2 = t * t;
        const t3 = t * t2;
        return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
            (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
            v0 * t + p1;
    };

    const displayPoint = touchedPoint || points[points.length - 1];
    const displayValue = displayPoint.value;
    const displayTime = displayPoint.time;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Icon name="clock-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Icon name="bookmark-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stock Info */}
            <View style={styles.stockInfo}>
                <View style={styles.stockIcon}>
                    <Icon name="star-four-points" size={28} color="#FFB800" />
                </View>
                <Text style={styles.stockName}>{stockName}</Text>
            </View>

            {/* Price Info */}
            <View style={styles.priceContainer}>
                <Text style={styles.mainPrice}>{displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <View style={styles.changeRow}>
                    <Text style={[styles.changeValue, { color: chartColor }]}>
                        {isPeriodPositive ? '+' : ''}{absoluteChange} ({isPeriodPositive ? '+' : ''}{periodChange}%)
                    </Text>
                    <Text style={styles.periodLabel}>{selectedPeriod}</Text>
                    {touchedPoint && (
                        <Text style={styles.touchTime}> | {displayTime}</Text>
                    )}
                </View>
                <TouchableOpacity style={styles.linkBtn}>
                    <Icon name="link-variant" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Interactive Chart */}
            <View style={styles.chartWrapper}>
                <View
                    style={styles.chartCanvas}
                    {...panResponder.panHandlers}>

                    {/* Smooth line path */}
                    {createSmoothPath()}

                    {/* Dotted reference line */}
                    <View style={styles.dottedLine} />

                    {/* Touch value indicator */}
                    {touchedPoint && (
                        <>
                            <Animated.View
                                style={[
                                    styles.valueBox,
                                    {
                                        left: touchedPoint.x - 50,
                                        top: touchedPoint.y - 40,
                                        opacity: fadeAnim,
                                    }
                                ]}>
                                <Text style={styles.valueBoxText}>
                                    {displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.valueBoxTime}>{displayTime}</Text>
                            </Animated.View>

                            <Animated.View
                                style={[
                                    styles.touchIndicator,
                                    {
                                        left: touchedPoint.x - 5,
                                        top: touchedPoint.y - 5,
                                        opacity: fadeAnim,
                                    }
                                ]}>
                                <View style={[styles.touchDot, { backgroundColor: chartColor, borderColor: chartColor }]} />
                            </Animated.View>

                            <Animated.View
                                style={[
                                    styles.verticalLine,
                                    {
                                        left: touchedPoint.x - 0.5,
                                        opacity: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 0.4],
                                        }),
                                    }
                                ]}
                            />
                        </>
                    )}
                </View>
            </View>

            {/* Period Selector */}
            <View style={styles.periodContainer}>
                {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'All'].map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodBtn,
                            selectedPeriod === period && styles.periodBtnActive
                        ]}
                        onPress={() => {
                            setSelectedPeriod(period);
                            setTouchedPoint(null);
                        }}
                        activeOpacity={0.7}>
                        <Text style={[
                            styles.periodText,
                            selectedPeriod === period && styles.periodTextActive
                        ]}>
                            {period}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.moreBtn}>
                    <Icon name="tune-variant" size={20} color="#00C896" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 62,
    },

    backBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerRight: {
        flexDirection: 'row',
        gap: 16,
    },

    iconBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    stockIcon: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    stockName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    priceContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },

    mainPrice: {
        fontSize: 40,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -1,
        marginBottom: 8,
    },

    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    changeValue: {
        fontSize: 16,
        fontWeight: '600',
    },

    periodLabel: {
        fontSize: 14,
        color: '#999999',
        marginLeft: 4,
    },

    touchTime: {
        fontSize: 14,
        color: '#999999',
    },

    linkBtn: {
        position: 'absolute',
        right: 16,
        top: 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    chartWrapper: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },

    chartCanvas: {
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        position: 'relative',
    },

    pathSegment: {
        position: 'absolute',
        height: 2.5,
        borderRadius: 1.5,
    },

    dottedLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: CHART_HEIGHT / 2,
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#333333',
    },

    valueBox: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },

    valueBoxText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000000',
    },

    valueBoxTime: {
        fontSize: 11,
        color: '#666666',
        marginTop: 2,
    },

    touchIndicator: {
        position: 'absolute',
        width: 10,
        height: 10,
    },

    touchDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    verticalLine: {
        position: 'absolute',
        width: 1,
        height: CHART_HEIGHT,
        backgroundColor: '#FFFFFF',
        top: 0,
    },

    periodContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 4,
    },

    periodBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'transparent',
    },

    periodBtnActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#333333',
    },

    periodText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666666',
    },

    periodTextActive: {
        color: '#FFFFFF',
    },

    moreBtn: {
        marginLeft: 'auto',
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default StockChart;

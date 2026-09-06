import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';

const COLORS = {
    background: '#050505',
    surface: '#0E0F11',
    surface2: '#141518',
    card: '#111214',
    overlay: 'rgba(0,0,0,0.68)',
    text: '#FFFFFF',
    textSecondary: '#C7CBD1',
    textMuted: '#8C929C',
    textFaint: '#666C75',
    border: '#24272D',
    primary: '#10B981',
    primaryLight: 'rgba(16, 185, 129, 0.14)',
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.14)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.14)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.14)',
    blue: '#3B82F6',
    blueLight: 'rgba(59, 130, 246, 0.14)',
    white: '#FFFFFF',
    skeleton: '#22252B',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 30000;

const EMPTY_SUMMARY = {
    totalInvestments: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    cancelledInvestments: 0,
    unlockedInvestments: 0,
    totalPrincipalInvested: 0,
    totalInterestEarned: 0,
    totalDailyEarning: 0,
    totalCurrentValue: 0,
};

const PortfolioScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const refreshIntervalRef = useRef(null);

    const [sortBy, setSortBy] = useState('latest');
    const [selectedTab, setSelectedTab] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [backgroundUpdating, setBackgroundUpdating] = useState(false);
    const [cancelLoadingId, setCancelLoadingId] = useState(null);
    const [unlockLoadingId, setUnlockLoadingId] = useState(null);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [portfolioSummary, setPortfolioSummary] = useState(EMPTY_SUMMARY);
    const [error, setError] = useState('');
    const [modalState, setModalState] = useState({
        visible: false,
        type: '',
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        item: null,
        action: null,
        loading: false,
    });

    const formatCurrency = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatCompactCurrency = (value) => {
        const num = Number(value || 0);
        return num.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (value) => {
        if (!value) return '--';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '--';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getTimestamp = (value) => {
        if (!value) return 0;
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
    };

    const extractPortfolioArray = (response) => {
        const data = response?.data;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.investments)) return data.investments;
        if (Array.isArray(data?.portfolio)) return data.portfolio;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.orders)) return data.orders;
        return [];
    };

    const extractSummary = (response) => {
        const summary = response?.data?.summary || {};
        return {
            totalInvestments: Number(summary?.totalInvestments || 0),
            activeInvestments: Number(summary?.activeInvestments || 0),
            completedInvestments: Number(summary?.completedInvestments || 0),
            cancelledInvestments: Number(summary?.cancelledInvestments || 0),
            unlockedInvestments: Number(summary?.unlockedInvestments || 0),
            totalPrincipalInvested: Number(summary?.totalPrincipalInvested || 0),
            totalInterestEarned: Number(summary?.totalInterestEarned || 0),
            totalDailyEarning: Number(summary?.totalDailyEarning || 0),
            totalCurrentValue: Number(summary?.totalCurrentValue || 0),
        };
    };

    const startOfDay = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const getValidDate = (...values) => {
        for (const value of values) {
            if (!value) continue;
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }
        return null;
    };

    const diffInDaysFloor = (fromDate, toDate) => {
        const from = startOfDay(fromDate).getTime();
        const to = startOfDay(toDate).getTime();
        return Math.floor((to - from) / DAY_MS);
    };

    const diffInDaysCeil = (fromDate, toDate) => {
        const from = startOfDay(fromDate).getTime();
        const to = startOfDay(toDate).getTime();
        return Math.ceil((to - from) / DAY_MS);
    };

    const normalizeInvestmentItem = (item = {}) => {
        const amount = Number(item?.amount ?? item?.investedAmount ?? 0);

        const effectiveDailyRate = Number(
            item?.effectiveDailyRate ??
            item?.dailyRate ??
            item?.rate ??
            0
        );

        const dailyInterestAmount = Number(
            item?.dailyInterestAmount ??
            item?.dailyEarning ??
            item?.perDayReturn ??
            item?.dailyReturnAmount ??
            (amount > 0 && effectiveDailyRate > 0 ? (amount * effectiveDailyRate) / 100 : 0)
        );

        const rawLockPeriodDays = item?.lockPeriodDays ?? item?.lockDays ?? null;
        const parsedLockPeriodDays =
            rawLockPeriodDays === null || typeof rawLockPeriodDays === 'undefined'
                ? null
                : Number(rawLockPeriodDays);

        const lockPeriodDays =
            Number.isFinite(parsedLockPeriodDays) && parsedLockPeriodDays > 0
                ? parsedLockPeriodDays
                : null;

        const totalInterestEarned = Number(item?.totalInterestEarned ?? item?.earned ?? 0);

        const currentValueSnapshot = Number(
            item?.currentValueSnapshot ??
            amount + totalInterestEarned
        );

        const status = String(item?.status || 'active').toLowerCase();

        const lockStartDate = getValidDate(
            item?.approvedAt,
            item?.orderPlacedAt,
            item?.createdAt
        );

        const backendLockEndsAt = getValidDate(item?.lockEndsAt);
        const now = new Date();

        let calculatedLockEndsAt = null;
        if (backendLockEndsAt) {
            calculatedLockEndsAt = backendLockEndsAt;
        } else if (lockStartDate && lockPeriodDays) {
            calculatedLockEndsAt = new Date(lockStartDate.getTime() + lockPeriodDays * DAY_MS);
        }

        let daysCompleted =
            typeof item?.daysCompleted === 'number'
                ? Number(item.daysCompleted)
                : null;

        let daysRemaining =
            typeof item?.daysRemaining === 'number'
                ? Number(item.daysRemaining)
                : null;

        if (lockStartDate && lockPeriodDays) {
            const elapsedDays = Math.max(diffInDaysFloor(lockStartDate, now), 0);
            daysCompleted = Math.min(elapsedDays, lockPeriodDays);
        }

        if (calculatedLockEndsAt && lockPeriodDays) {
            if (now >= calculatedLockEndsAt) {
                daysRemaining = 0;
                daysCompleted = lockPeriodDays;
            } else {
                daysRemaining = Math.max(diffInDaysCeil(now, calculatedLockEndsAt), 0);
                daysCompleted = Math.min(Math.max(lockPeriodDays - daysRemaining, 0), lockPeriodDays);
            }
        } else if (lockPeriodDays && daysCompleted !== null && daysRemaining === null) {
            daysRemaining = Math.max(lockPeriodDays - Math.min(daysCompleted, lockPeriodDays), 0);
        } else if (lockPeriodDays && daysRemaining !== null && daysCompleted === null) {
            daysCompleted = Math.min(Math.max(lockPeriodDays - daysRemaining, 0), lockPeriodDays);
        }

        const isLockCompleted =
            typeof item?.isLockCompleted === 'boolean'
                ? item.isLockCompleted
                : lockPeriodDays && daysRemaining !== null
                    ? daysRemaining <= 0
                    : false;

        const isUnlockedStatus = status === 'unlocked';

        const isLocked =
            typeof item?.isLocked === 'boolean'
                ? item.isLocked
                : status === 'active' && !isLockCompleted;

        const isMatured =
            typeof item?.isMatured === 'boolean'
                ? item.isMatured
                : status === 'active' && isLockCompleted;

        const canUnlock =
            typeof item?.canUnlock === 'boolean'
                ? item.canUnlock
                : status === 'active' && isLockCompleted;

        const canRenew =
            typeof item?.canRenew === 'boolean'
                ? item.canRenew
                : isUnlockedStatus;

        const canReinvest =
            typeof item?.canReinvest === 'boolean'
                ? item.canReinvest
                : isUnlockedStatus;

        const canCancel =
            typeof item?.canCancel === 'boolean'
                ? item.canCancel
                : status === 'active' && isLockCompleted;

        const indexData = item?.index || item?.indexId || item?.indexSnapshot || {};
        const indexName = indexData?.name || item?.indexName || item?.name || 'Investment';
        const indexSymbol = indexData?.symbol || item?.indexSymbol || item?.symbol || 'INDEX';

        const orderDate =
            item?.orderPlacedAt ||
            item?.createdAt ||
            item?.approvedAt ||
            item?.completedAt ||
            item?.cancelledAt ||
            null;

        const fallbackId =
            item?._id ||
            item?.id ||
            item?.investmentId ||
            item?.orderNumber ||
            `${indexSymbol}-${amount}-${orderDate || 'item'}`;

        return {
            _id: String(fallbackId),
            amount,
            status,
            effectiveDailyRate,
            dailyInterestAmount,
            totalInterestEarned,
            currentValueSnapshot,
            lockPeriodDays,
            daysCompleted,
            daysRemaining,
            isLockCompleted,
            isLocked,
            isUnlocked: isUnlockedStatus,
            isMatured,
            canCancel,
            canUnlock,
            canRenew,
            canReinvest,
            createdAt: item?.createdAt || null,
            orderDate,
            approvedAt: item?.approvedAt || null,
            cancelledAt: item?.cancelledAt || null,
            completedAt: item?.completedAt || null,
            unlockedAt: item?.unlockedAt || null,
            lockEndsAt: calculatedLockEndsAt ? calculatedLockEndsAt.toISOString() : item?.lockEndsAt || null,
            lockStartDate: lockStartDate ? lockStartDate.toISOString() : null,
            rateSource: item?.rateSource || '',
            indexId: item?.indexId?._id || item?.indexId || indexData?._id || null,
            indexName,
            indexSymbol,
            raw: item,
        };
    };

    const stopRefreshInterval = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    const applyPortfolioData = useCallback((response) => {
        const extracted = extractPortfolioArray(response);
        const normalized = extracted.filter(Boolean).map(normalizeInvestmentItem);
        const backendSummary = extractSummary(response);

        const fallbackSummary = {
            totalInvestments: normalized.length,
            activeInvestments: normalized.filter((item) => item.status === 'active').length,
            completedInvestments: normalized.filter((item) => item.isLockCompleted).length,
            cancelledInvestments: normalized.filter((item) => item.status === 'cancelled').length,
            unlockedInvestments: normalized.filter((item) => item.status === 'unlocked').length,
            totalPrincipalInvested: normalized
                .filter((item) => item.status === 'active')
                .reduce((sum, item) => sum + item.amount, 0),
            totalInterestEarned: normalized.reduce((sum, item) => sum + item.totalInterestEarned, 0),
            totalDailyEarning: normalized
                .filter((item) => item.status === 'active')
                .reduce((sum, item) => sum + item.dailyInterestAmount, 0),
            totalCurrentValue: normalized
                .filter((item) => item.status === 'active')
                .reduce((sum, item) => sum + item.currentValueSnapshot, 0),
        };

        const finalSummary = {
            totalInvestments: Number(backendSummary.totalInvestments || fallbackSummary.totalInvestments),
            activeInvestments: Number(backendSummary.activeInvestments || fallbackSummary.activeInvestments),
            completedInvestments: Number(backendSummary.completedInvestments || fallbackSummary.completedInvestments),
            cancelledInvestments: Number(backendSummary.cancelledInvestments || fallbackSummary.cancelledInvestments),
            unlockedInvestments: Number(backendSummary.unlockedInvestments || fallbackSummary.unlockedInvestments),
            totalPrincipalInvested: Number(
                backendSummary.totalPrincipalInvested > 0
                    ? backendSummary.totalPrincipalInvested
                    : fallbackSummary.totalPrincipalInvested
            ),
            totalInterestEarned: Number(
                backendSummary.totalInterestEarned > 0
                    ? backendSummary.totalInterestEarned
                    : fallbackSummary.totalInterestEarned
            ),
            totalDailyEarning: Number(
                backendSummary.totalDailyEarning > 0
                    ? backendSummary.totalDailyEarning
                    : fallbackSummary.totalDailyEarning
            ),
            totalCurrentValue: Number(
                backendSummary.totalCurrentValue > 0
                    ? backendSummary.totalCurrentValue
                    : fallbackSummary.totalCurrentValue
            ),
        };

        setPortfolioSummary(finalSummary);
        setPortfolioItems(normalized);
    }, []);

    const fetchPortfolio = useCallback(async ({
        isRefresh = false,
        preferCache = true,
        backgroundRefresh = true,
        showLoader = false,
    } = {}) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (showLoader) {
                setLoading(true);
            } else {
                setBackgroundUpdating(true);
            }

            setError('');

            let response = null;
            let extracted = [];

            if (typeof ApiService.getMyPortfolio === 'function') {
                response = await ApiService.getMyPortfolio(
                    { page: 1, limit: 100 },
                    { preferCache, backgroundRefresh }
                );

                if (response?.success) {
                    extracted = extractPortfolioArray(response);
                }
            }

            if ((!response?.success || extracted.length === 0) && typeof ApiService.getMyInvestments === 'function') {
                const fallbackResponse = await ApiService.getMyInvestments(
                    { page: 1, limit: 100 },
                    { preferCache, backgroundRefresh }
                );

                if (fallbackResponse?.success) {
                    const fallbackExtracted = extractPortfolioArray(fallbackResponse);
                    if (fallbackExtracted.length > 0) {
                        response = fallbackResponse;
                        extracted = fallbackExtracted;
                    } else if (!response?.success) {
                        response = fallbackResponse;
                    }
                } else if (!response?.success) {
                    response = fallbackResponse;
                }
            }

            if (!response?.success) {
                throw new Error(response?.message || 'Unable to fetch portfolio');
            }

            applyPortfolioData({
                ...response,
                data: {
                    ...(response?.data || {}),
                    investments:
                        extracted ||
                        response?.data?.investments ||
                        response?.data?.portfolio ||
                        response?.data?.items ||
                        response?.data?.orders ||
                        [],
                },
            });

            setHasLoadedOnce(true);
        } catch (err) {
            console.error('❌ Portfolio fetch error:', err);

            if (portfolioItems.length === 0) {
                setError(err?.message || 'Unable to load portfolio.');
                setPortfolioItems([]);
                setPortfolioSummary(EMPTY_SUMMARY);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            setBackgroundUpdating(false);
        }
    }, [applyPortfolioData, portfolioItems.length]);

    const refreshPortfolioData = useCallback(async ({
        isRefresh = false,
        preferCache = true,
        backgroundRefresh = true,
        silent = false,
    } = {}) => {
        const shouldShowInitialLoader =
            !hasLoadedOnce &&
            !silent &&
            !isRefresh &&
            portfolioItems.length === 0;

        await fetchPortfolio({
            isRefresh,
            preferCache,
            backgroundRefresh,
            showLoader: shouldShowInitialLoader,
        });
    }, [hasLoadedOnce, portfolioItems.length, fetchPortfolio]);

    useFocusEffect(
        useCallback(() => {
            refreshPortfolioData({
                isRefresh: false,
                preferCache: true,
                backgroundRefresh: true,
                silent: false,
            });

            refreshIntervalRef.current = setInterval(() => {
                refreshPortfolioData({
                    isRefresh: false,
                    preferCache: true,
                    backgroundRefresh: true,
                    silent: true,
                });
            }, AUTO_REFRESH_INTERVAL_MS);

            return () => {
                stopRefreshInterval();
            };
        }, [refreshPortfolioData, stopRefreshInterval])
    );

    useEffect(() => {
        return () => {
            stopRefreshInterval();
        };
    }, [stopRefreshInterval]);

    const handleRefresh = () => {
        refreshPortfolioData({
            isRefresh: true,
            preferCache: false,
            backgroundRefresh: false,
            silent: true,
        });
    };

    const closeModal = () => {
        if (modalState.loading) return;
        setModalState({
            visible: false,
            type: '',
            title: '',
            message: '',
            confirmText: 'OK',
            cancelText: 'Cancel',
            item: null,
            action: null,
            loading: false,
        });
    };

    const openModal = ({
        type,
        title,
        message,
        confirmText = 'OK',
        cancelText = 'Cancel',
        item = null,
        action = null,
    }) => {
        setModalState({
            visible: true,
            type,
            title,
            message,
            confirmText,
            cancelText,
            item,
            action,
            loading: false,
        });
    };

    const activeItems = portfolioItems.filter((item) => item.status === 'active');
    const cancelledItems = portfolioItems.filter((item) => item.status === 'cancelled');
    const rejectedItems = portfolioItems.filter((item) => item.status === 'rejected' || item.status === 'failed');
    const unlockedItems = portfolioItems.filter((item) => item.status === 'unlocked');
    const maturedItems = activeItems.filter((item) => item.isMatured || item.canUnlock);
    const totalUnlocked = maturedItems.length;

    const getItemBucketRank = (item) => {
        if (item.status === 'cancelled' || item.status === 'rejected' || item.status === 'failed') return 4;
        if (item.status === 'unlocked') return 3;
        if (item.status === 'active' && item.isMatured) return 2;
        return 1;
    };

    const filteredItems = useMemo(() => {
        if (selectedTab === 'active') {
            return portfolioItems.filter((item) => item.status === 'active' && !item.isMatured);
        }

        if (selectedTab === 'completed') {
            return portfolioItems.filter(
                (item) => (item.status === 'active' && item.isMatured) || item.status === 'unlocked'
            );
        }

        if (selectedTab === 'closed') {
            return portfolioItems.filter(
                (item) => item.status === 'cancelled' || item.status === 'rejected' || item.status === 'failed'
            );
        }

        return portfolioItems;
    }, [portfolioItems, selectedTab]);

    const sortedItems = useMemo(() => {
        const items = [...filteredItems];
        return items.sort((a, b) => {
            if (selectedTab === 'all') {
                const bucketDiff = getItemBucketRank(a) - getItemBucketRank(b);
                if (bucketDiff !== 0) return bucketDiff;
            }

            if (sortBy === 'latest') return getTimestamp(b.orderDate) - getTimestamp(a.orderDate);
            if (sortBy === 'amount') return b.amount - a.amount;
            if (sortBy === 'earned') return b.totalInterestEarned - a.totalInterestEarned;
            if (sortBy === 'remaining') {
                return (a.daysRemaining ?? Number.MAX_SAFE_INTEGER) - (b.daysRemaining ?? Number.MAX_SAFE_INTEGER);
            }
            return 0;
        });
    }, [filteredItems, sortBy, selectedTab]);

    const getStatusMeta = (item) => {
        if (item.status === 'cancelled') {
            return {
                label: 'Closed',
                color: COLORS.warning,
                bg: COLORS.warningLight,
                icon: 'close-circle-outline',
            };
        }

        if (item.status === 'rejected' || item.status === 'failed') {
            return {
                label: 'Failed',
                color: COLORS.danger,
                bg: COLORS.dangerLight,
                icon: 'alert-circle-outline',
            };
        }

        if (item.status === 'unlocked') {
            return {
                label: 'Unlocked',
                color: COLORS.success,
                bg: COLORS.successLight,
                icon: 'lock-open-variant-outline',
            };
        }

        if (item.status === 'active' && item.isMatured) {
            return {
                label: 'Completed',
                color: COLORS.blue,
                bg: COLORS.blueLight,
                icon: 'lock-check-outline',
            };
        }

        return {
            label: 'Active',
            color: COLORS.warning,
            bg: COLORS.warningLight,
            icon: 'lock-outline',
        };
    };

    const getDaysText = (item) => {
        if (!item?.lockPeriodDays) return 'Awaiting lock details';
        if (item?.isLockCompleted || item?.daysRemaining === 0) return 'Completed';
        if (typeof item?.daysRemaining !== 'number') return 'Awaiting lock details';
        return `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'} left`;
    };

    const handleCancelInvestment = (item) => {
        openModal({
            type: 'cancelConfirm',
            title: 'Close Investment',
            message: 'The principal will be returned to your wallet and future daily earnings for this position will stop.',
            confirmText: 'Close Position',
            cancelText: 'Back',
            item,
            action: 'cancel',
        });
    };

    const performCancelInvestment = async (item) => {
        try {
            setCancelLoadingId(item._id);
            setModalState((prev) => ({ ...prev, loading: true }));

            const response = await ApiService.cancelInvestment(item._id);

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to cancel investment');
            }

            await refreshPortfolioData({
                isRefresh: true,
                preferCache: false,
                backgroundRefresh: false,
                silent: true,
            });

            setModalState({
                visible: true,
                type: 'success',
                title: 'Investment Closed',
                message: 'This investment has been closed and moved to the Closed section.',
                confirmText: 'OK',
                cancelText: 'Cancel',
                item: null,
                action: null,
                loading: false,
            });
        } catch (err) {
            console.error('❌ Cancel investment error:', err);
            setModalState({
                visible: true,
                type: 'error',
                title: 'Close Failed',
                message: err?.message || 'Unable to close this investment right now.',
                confirmText: 'Close',
                cancelText: 'Cancel',
                item: null,
                action: null,
                loading: false,
            });
        } finally {
            setCancelLoadingId(null);
        }
    };

    const handleUnlockInvestment = (item) => {
        openModal({
            type: 'unlockConfirm',
            title: 'Unlock Investment',
            message: `Your principal of ₹${formatCurrency(item.amount)} and earned interest of ₹${formatCurrency(item.totalInterestEarned)} will be credited to your wallet. You can then choose to renew or reinvest.`,
            confirmText: 'Unlock Now',
            cancelText: 'Cancel',
            item,
            action: 'unlock',
        });
    };

    const performUnlockInvestment = async (item) => {
        try {
            setUnlockLoadingId(item._id);
            setModalState((prev) => ({ ...prev, loading: true }));

            const response = await ApiService.unlockInvestment(item._id);

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to unlock investment');
            }

            await refreshPortfolioData({
                isRefresh: true,
                preferCache: false,
                backgroundRefresh: false,
                silent: true,
            });

            closeModal();

            navigation.navigate('UnlockAction', {
                investmentId: item._id,
                indexId: item.indexId,
                indexName: item.indexName,
                indexSymbol: item.indexSymbol,
                amount: item.amount,
                lockPeriodDays: item.lockPeriodDays,
                totalInterestEarned: item.totalInterestEarned,
            });
        } catch (err) {
            console.error('❌ Unlock investment error:', err);
            setModalState({
                visible: true,
                type: 'error',
                title: 'Unlock Failed',
                message: err?.message || 'Unable to unlock this investment right now.',
                confirmText: 'Close',
                cancelText: 'Cancel',
                item: null,
                action: null,
                loading: false,
            });
        } finally {
            setUnlockLoadingId(null);
        }
    };

    const handleModalConfirm = async () => {
        if (!modalState.item || !modalState.action) {
            closeModal();
            return;
        }

        if (modalState.action === 'cancel') {
            await performCancelInvestment(modalState.item);
            return;
        }

        if (modalState.action === 'unlock') {
            await performUnlockInvestment(modalState.item);
            return;
        }

        closeModal();
    };

    const handleGoToUnlockAction = (item) => {
        navigation.navigate('UnlockAction', {
            investmentId: item._id,
            indexId: item.indexId,
            indexName: item.indexName,
            indexSymbol: item.indexSymbol,
            amount: item.amount,
            lockPeriodDays: item.lockPeriodDays,
            totalInterestEarned: item.totalInterestEarned,
        });
    };

    const renderSummaryCard = () => (
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Total Investment</Text>
                    <Text style={styles.summaryValue}>
                        ₹{formatCurrency(portfolioSummary.totalPrincipalInvested)}
                    </Text>
                    <Text style={styles.summarySubtext}>
                        {portfolioSummary.activeInvestments} active • {totalUnlocked} completed
                    </Text>
                </View>

                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>
                        {backgroundUpdating ? 'Updating' : 'Live'}
                    </Text>
                </View>
            </View>

            <View style={styles.compactStatsRow}>
                <View style={styles.compactStatCard}>
                    <Text style={styles.compactStatLabel}>Daily</Text>
                    <Text style={[styles.compactStatValue, { color: COLORS.success }]}>
                        ₹{formatCompactCurrency(portfolioSummary.totalDailyEarning)}
                    </Text>
                </View>

                <View style={styles.compactStatCard}>
                    <Text style={styles.compactStatLabel}>Earned</Text>
                    <Text style={styles.compactStatValue}>
                        ₹{formatCompactCurrency(portfolioSummary.totalInterestEarned)}
                    </Text>
                </View>

                <View style={styles.compactStatCard}>
                    <Text style={styles.compactStatLabel}>Closed</Text>
                    <Text style={styles.compactStatValue}>
                        {cancelledItems.length + rejectedItems.length}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderCategoryTabs = () => {
        const tabs = [
            { key: 'all', label: `All (${portfolioItems.length})` },
            { key: 'active', label: `Active (${activeItems.filter((item) => !item.isMatured).length})` },
            { key: 'completed', label: `Completed (${maturedItems.length + unlockedItems.length})` },
            { key: 'closed', label: `Closed (${cancelledItems.length + rejectedItems.length})` },
        ];

        return (
            <View style={styles.tabSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabButtons}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabButton, selectedTab === tab.key && styles.tabButtonActive]}
                            onPress={() => setSelectedTab(tab.key)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.tabButtonText,
                                    selectedTab === tab.key && styles.tabButtonTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderSortBar = () => (
        <View style={styles.sortContainer}>
            <Text style={styles.sectionTitle}>Investments</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortButtons}
            >
                {[
                    { key: 'latest', label: 'Latest' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'earned', label: 'Earned' },
                    { key: 'remaining', label: 'Days Left' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.sortButton, sortBy === item.key && styles.sortButtonActive]}
                        onPress={() => setSortBy(item.key)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.sortButtonText,
                                sortBy === item.key && styles.sortButtonTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderSkeletonLoader = () => (
        <>
            <View style={styles.summaryCard}>
                <View style={[styles.skeletonLine, { width: 90, height: 10 }]} />
                <View style={[styles.skeletonLine, { width: '65%', height: 28, marginTop: 10 }]} />
                <View style={[styles.skeletonLine, { width: '40%', height: 10, marginTop: 8 }]} />

                <View style={styles.compactStatsRow}>
                    {[1, 2, 3].map((id) => (
                        <View key={id} style={styles.compactStatCard}>
                            <View style={[styles.skeletonLine, { width: 36, height: 10 }]} />
                            <View style={[styles.skeletonLine, { width: '70%', height: 16, marginTop: 8 }]} />
                        </View>
                    ))}
                </View>
            </View>

            {[1, 2, 3].map((id) => (
                <View key={id} style={[styles.holdingCard, { marginBottom: 10 }]}>
                    <View style={styles.holdingHeader}>
                        <View style={styles.holdingLeft}>
                            <View style={[styles.skeletonCircle, { width: 34, height: 34, borderRadius: 17 }]} />
                            <View style={{ flex: 1 }}>
                                <View style={[styles.skeletonLine, { width: '55%', height: 12 }]} />
                                <View style={[styles.skeletonLine, { width: '34%', height: 10, marginTop: 6 }]} />
                            </View>
                        </View>
                        <View style={[styles.skeletonPill, { width: 62, height: 22 }]} />
                    </View>
                    <View style={[styles.skeletonLine, { width: '44%', height: 20, marginBottom: 10 }]} />
                    <View style={[styles.skeletonLine, { width: '100%', height: 46, marginBottom: 10 }]} />
                    <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
                </View>
            ))}
        </>
    );

    const renderInvestmentCard = ({ item }) => {
        const statusMeta = getStatusMeta(item);
        const isCancelled = item.status === 'cancelled';
        const isRejected = item.status === 'rejected' || item.status === 'failed';
        const isActive = item.status === 'active';
        const isUnlockedStatus = item.status === 'unlocked';
        const hasLockData = item.lockPeriodDays && item.lockPeriodDays > 0;

        return (
            <View style={styles.holdingCard}>
                <View style={styles.holdingHeader}>
                    <View style={styles.holdingLeft}>
                        <View style={[styles.holdingIcon, { backgroundColor: statusMeta.bg }]}>
                            <Icon name="chart-line" size={15} color={statusMeta.color} />
                        </View>

                        <View style={styles.holdingInfo}>
                            <Text numberOfLines={1} style={styles.holdingName}>{item.indexName}</Text>
                            <Text numberOfLines={1} style={styles.holdingTicker}>
                                {item.indexSymbol} • {formatDate(item.orderDate)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                            {statusMeta.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.amountLabel}>Invested</Text>
                        <Text numberOfLines={1} style={styles.amountValue}>₹{formatCurrency(item.amount)}</Text>
                    </View>
                </View>

                <View style={styles.metricsRow}>
                    <View style={styles.metricPill}>
                        <Text style={styles.metricPillLabel}>Daily</Text>
                        <Text style={styles.metricPillValue}>₹{formatCompactCurrency(item.dailyInterestAmount)}</Text>
                    </View>

                    <View style={styles.metricPill}>
                        <Text style={styles.metricPillLabel}>Earned</Text>
                        <Text style={styles.metricPillValue}>₹{formatCompactCurrency(item.totalInterestEarned)}</Text>
                    </View>

                    <View style={styles.metricPill}>
                        <Text style={styles.metricPillLabel}>Rate</Text>
                        <Text style={styles.metricPillValue}>
                            {item.effectiveDailyRate ? `${item.effectiveDailyRate}%` : '--'}
                        </Text>
                    </View>
                </View>

                {isActive || isUnlockedStatus ? (
                    <View style={styles.daysSection}>
                        <View style={styles.daysTopRow}>
                            <Text style={styles.daysLabel}>Duration</Text>
                            <Text style={styles.daysValue}>
                                {isUnlockedStatus ? 'Unlocked' : getDaysText(item)}
                            </Text>
                        </View>

                        {hasLockData ? (
                            <Text style={styles.daysSubtext}>
                                {isUnlockedStatus
                                    ? 'Choose to renew or reinvest'
                                    : `${item.daysCompleted ?? 0}/${item.lockPeriodDays} days completed`}
                            </Text>
                        ) : (
                            <Text style={styles.daysSubtext}>
                                Lock period details are not available yet
                            </Text>
                        )}
                    </View>
                ) : null}

                {isRejected ? (
                    <View style={styles.infoBannerError}>
                        <Icon name="alert-circle-outline" size={14} color={COLORS.danger} />
                        <Text style={styles.infoBannerErrorText}>
                            This position could not be completed.
                        </Text>
                    </View>
                ) : null}

                {isCancelled ? (
                    <View style={styles.infoBannerNeutral}>
                        <Icon name="information-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.infoBannerNeutralText}>
                            This position has been closed.
                        </Text>
                    </View>
                ) : null}

                {isActive && !isRejected && !isCancelled && item.isMatured ? (
                    <>
                        <View style={styles.infoBannerSuccess}>
                            <Icon name="lock-check-outline" size={14} color={COLORS.success} />
                            <Text style={styles.infoBannerSuccessText}>
                                Lock period completed. Unlock to access your funds.
                            </Text>
                        </View>

                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={[styles.unlockButton, { flex: 1 }]}
                                activeOpacity={0.88}
                                disabled={unlockLoadingId === item._id}
                                onPress={() => handleUnlockInvestment(item)}
                            >
                                {unlockLoadingId === item._id ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Icon name="lock-open-variant-outline" size={16} color={COLORS.white} />
                                        <Text style={styles.unlockButtonText}>Unlock Investment</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.cancelButton, { flex: 1 }]}
                                activeOpacity={0.88}
                                disabled={cancelLoadingId === item._id}
                                onPress={() => handleCancelInvestment(item)}
                            >
                                {cancelLoadingId === item._id ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Icon name="close-circle-outline" size={16} color={COLORS.white} />
                                        <Text style={styles.cancelButtonText}>Close</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                ) : null}

                {isUnlockedStatus ? (
                    <>
                        <View style={styles.infoBannerSuccess}>
                            <Icon name="check-circle-outline" size={14} color={COLORS.success} />
                            <Text style={styles.infoBannerSuccessText}>
                                Principal credited to wallet. Choose your next step.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.renewButton}
                            activeOpacity={0.88}
                            onPress={() => handleGoToUnlockAction(item)}
                        >
                            <Icon name="autorenew" size={16} color={COLORS.white} />
                            <Text style={styles.renewButtonText}>Renew or Reinvest</Text>
                        </TouchableOpacity>
                    </>
                ) : null}
            </View>
        );
    };

    const renderEmptyState = () => {
        if (loading && portfolioItems.length === 0) {
            return (
                <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                    {renderSkeletonLoader()}
                </View>
            );
        }

        if (error && portfolioItems.length === 0) {
            return (
                <View style={styles.emptyWrap}>
                    <Icon name="alert-circle-outline" size={44} color={COLORS.danger} />
                    <Text style={styles.emptyTitle}>Unable to load portfolio</Text>
                    <Text style={styles.emptySubtitle}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh} activeOpacity={0.85}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyWrap}>
                <Icon name="briefcase-outline" size={46} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No investments found</Text>
                <Text style={styles.emptySubtitle}>
                    {selectedTab === 'all'
                        ? 'Your portfolio will appear here once you place your first investment.'
                        : `No items found in the ${selectedTab} section.`}
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.retryButtonText}>Explore Market</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const modalIconMeta = (() => {
        if (modalState.type === 'cancelConfirm') {
            return { icon: 'close-circle-outline', color: COLORS.danger, bg: COLORS.dangerLight };
        }
        if (modalState.type === 'unlockConfirm') {
            return { icon: 'lock-open-variant-outline', color: COLORS.primary, bg: COLORS.primaryLight };
        }
        if (modalState.type === 'success') {
            return { icon: 'check-circle-outline', color: COLORS.success, bg: COLORS.successLight };
        }
        if (modalState.type === 'error') {
            return { icon: 'alert-circle-outline', color: COLORS.danger, bg: COLORS.dangerLight };
        }
        return { icon: 'information-outline', color: COLORS.blue, bg: COLORS.blueLight };
    })();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerEyebrow}>Investments</Text>
                        <Text style={styles.headerTitle}>Portfolio</Text>
                    </View>

                    <View style={styles.headerActions}>
                        {backgroundUpdating && !refreshing ? (
                            <View style={styles.headerUpdatingBadge}>
                                <View style={styles.headerUpdatingDot} />
                                <Text style={styles.headerUpdatingText}>Updating</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity style={styles.headerButton} activeOpacity={0.8} onPress={handleRefresh}>
                            {refreshing ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Icon name="refresh" size={20} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <FlatList
                data={loading && portfolioItems.length === 0 ? [] : sortedItems}
                keyExtractor={(item) => String(item._id)}
                renderItem={renderInvestmentCard}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary}
                    />
                }
                ListHeaderComponent={
                    portfolioItems.length > 0 ? (
                        <>
                            {renderSummaryCard()}
                            {renderCategoryTabs()}
                            {renderSortBar()}
                        </>
                    ) : null
                }
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={{
                    paddingBottom: 90 + insets.bottom,
                    paddingHorizontal: portfolioItems.length > 0 ? 12 : 0,
                    flexGrow: 1,
                }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />

            <Modal
                visible={modalState.visible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModal}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.modalIconWrap, { backgroundColor: modalIconMeta.bg }]}>
                            <Icon name={modalIconMeta.icon} size={24} color={modalIconMeta.color} />
                        </View>

                        <Text style={styles.modalTitle}>{modalState.title}</Text>
                        <Text style={styles.modalMessage}>{modalState.message}</Text>

                        <View style={styles.modalButtonsRow}>
                            {(modalState.type === 'cancelConfirm' || modalState.type === 'unlockConfirm') ? (
                                <TouchableOpacity
                                    style={styles.modalSecondaryButton}
                                    onPress={closeModal}
                                    activeOpacity={0.88}
                                    disabled={modalState.loading}
                                >
                                    <Text style={styles.modalSecondaryButtonText}>{modalState.cancelText}</Text>
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                                style={[
                                    styles.modalPrimaryButton,
                                    modalState.type === 'cancelConfirm' && { backgroundColor: COLORS.danger },
                                ]}
                                onPress={
                                    modalState.type === 'success' || modalState.type === 'error'
                                        ? closeModal
                                        : handleModalConfirm
                                }
                                activeOpacity={0.88}
                                disabled={modalState.loading}
                            >
                                {modalState.loading ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.modalPrimaryButtonText}>{modalState.confirmText}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeAreaTop: {
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerEyebrow: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '900',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerUpdatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        marginRight: 8,
    },
    headerUpdatingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginRight: 6,
    },
    headerUpdatingText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '800',
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginTop: 12,
        marginBottom: 12,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    summaryLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },
    summaryValue: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: '900',
        marginTop: 4,
    },
    summarySubtext: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        backgroundColor: COLORS.primary,
        marginRight: 6,
    },
    liveBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
    },
    compactStatsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    compactStatCard: {
        flex: 1,
        backgroundColor: COLORS.surface2,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
    },
    compactStatLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6,
    },
    compactStatValue: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '900',
    },
    tabSection: {
        marginBottom: 10,
    },
    tabButtons: {
        paddingRight: 8,
    },
    tabButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    tabButtonActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: 'rgba(16, 185, 129, 0.24)',
    },
    tabButtonText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '700',
    },
    tabButtonTextActive: {
        color: COLORS.primary,
    },
    sortContainer: {
        marginBottom: 12,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 10,
    },
    sortButtons: {
        paddingRight: 8,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 12,
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    sortButtonActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: 'rgba(16, 185, 129, 0.24)',
    },
    sortButtonText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '700',
    },
    sortButtonTextActive: {
        color: COLORS.primary,
    },
    holdingCard: {
        backgroundColor: COLORS.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
    },
    holdingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    holdingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    holdingIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    holdingInfo: {
        flex: 1,
    },
    holdingName: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 3,
    },
    holdingTicker: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    amountLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 5,
    },
    amountValue: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '900',
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    metricPill: {
        flex: 1,
        backgroundColor: COLORS.surface2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    metricPillLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 5,
    },
    metricPillValue: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '900',
    },
    daysSection: {
        backgroundColor: COLORS.surface2,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginBottom: 12,
    },
    daysTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    daysLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '700',
    },
    daysValue: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '800',
    },
    daysSubtext: {
        color: COLORS.textSecondary,
        fontSize: 11,
        lineHeight: 16,
    },
    infoBannerSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.successLight,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
    },
    infoBannerSuccessText: {
        color: COLORS.success,
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 8,
        flex: 1,
    },
    infoBannerError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.dangerLight,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
    },
    infoBannerErrorText: {
        color: COLORS.danger,
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 8,
        flex: 1,
    },
    infoBannerNeutral: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface2,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoBannerNeutralText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 8,
        flex: 1,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    unlockButton: {
        height: 46,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    unlockButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },
    cancelButton: {
        height: 46,
        borderRadius: 14,
        backgroundColor: COLORS.danger,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cancelButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },
    renewButton: {
        height: 46,
        borderRadius: 14,
        backgroundColor: COLORS.blue,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    renewButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '900',
        marginTop: 14,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 18,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },
    skeletonLine: {
        backgroundColor: COLORS.skeleton,
        borderRadius: 8,
    },
    skeletonCircle: {
        backgroundColor: COLORS.skeleton,
    },
    skeletonPill: {
        backgroundColor: COLORS.skeleton,
        borderRadius: 999,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
    },
    modalIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalMessage: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 18,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modalSecondaryButton: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSecondaryButtonText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '800',
    },
    modalPrimaryButton: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalPrimaryButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },
});

export default PortfolioScreen;
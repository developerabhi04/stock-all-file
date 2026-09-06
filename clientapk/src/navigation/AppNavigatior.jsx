import React, { useEffect, useMemo, useState, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './RootNavigation';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../components/screens/loginSignup/LoginScreen';
import SignupScreen from '../components/screens/loginSignup/SignupScreen';
import OTPVerificationScreen from '../components/screens/loginSignup/OTPVerificationScreen';
import NotificationScreen from '../components/screens/Home/NotificationScreen';
import ProfileScreen from '../components/screens/profile/profile/ProfileScreen';
import { COLORS } from '../../src/constants/colors';
import IndicesScreen from '../components/screens/Home/Indices/IndicesScreen';
import HistoryScreen from '../components/screens/profile/HistoryScreen';
import BottomTabNavigator from './BottomTabNavigator';
import RechargeScreen from '../components/screens/profile/addmoney/RechargeScreen';
import TransactionHistoryScreen from '../components/screens/profile/TransactionHistoryScreen';
import WithdrawScreen from '../components/screens/profile/widthdraw/WithdrawScreen';
import PaymentScreen from '../components/screens/profile/addmoney/PaymentScreen';
import StockDetailScreen from '../components/screens/Home/Indices/StockDetailScreen';
import AccountSettingsScreen from '../components/screens/profile/AccountSettingsScreen';
import PrivacySecurityScreen from '../components/screens/profile/privacy/PrivacySecurityScreen';
import AppGuideScreen from '../components/screens/profile/AppGuideScreen';
import BuyStockScreen from '../components/screens/Home/Indices/BuyStockScreen';
import OrderScreen from '../components/screens/orders/OrderScreen';
import SellStockScreen from '../components/screens/portfolio/SellStockScreen';
import ProfileWalletScreen from '../components/screens/profile/ProfileWalletScreen';
import ReferralScreen from '../components/screens/profile/ReferralScreen';
import EditProfileScreen from '../components/screens/profile/profile/EditProfileScreen';
import AuthStorage from '../services/AuthStorage';
import ApiService from '../services/ApiService';
import AppStartupLoader from '../components/common/AppStartupLoader';
import UnlockActionScreen from '../components/screens/investment/UnlockActionScreen';
 import ChatSupportScreen from '../components/screens/ChatSupport/ChatSupportScreen';

const Stack = createStackNavigator();

export const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    signIn: async () => { },
    signOut: async () => { },
    refreshAuthUser: async () => { },
});

const commonScreenOptions = {
    headerStyle: {
        backgroundColor: COLORS.primary,
        elevation: 0,
        shadowOpacity: 0,
    },
    headerTintColor: COLORS.white,
    headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
    },
    headerBackTitleVisible: false,
    cardStyle: {
        backgroundColor: COLORS.background,
    },
};

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={commonScreenOptions}>
            <Stack.Screen
                name="Signup"
                component={SignupScreen}
                options={{
                    title: 'Sign Up',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    title: 'Login',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="OTPVerification"
                component={OTPVerificationScreen}
                options={{
                    title: 'Verify OTP',
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
        </Stack.Navigator>
    );
};

const AppStack = () => {
    return (
        <Stack.Navigator screenOptions={commonScreenOptions}>
            <Stack.Screen
                name="Home"
                component={BottomTabNavigator}
                options={{
                    title: 'Home',
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />

            <Stack.Screen
                name="Indices"
                component={IndicesScreen}
                options={{
                    title: 'Market Indices',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="Notification"
                component={NotificationScreen}
                options={{
                    title: 'Notifications',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    title: 'Transaction History',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="TransactionHistory"
                component={TransactionHistoryScreen}
                options={{
                    title: 'Transaction History',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="Recharge"
                component={RechargeScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="Payment"
                component={PaymentScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="Withdraw"
                component={WithdrawScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="StockDetail"
                component={StockDetailScreen}
                options={{
                    animation: 'slide_from_right',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="AccountSettings"
                component={AccountSettingsScreen}
                options={{
                    animation: 'slide_from_right',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="PrivacySecurity"
                component={PrivacySecurityScreen}
                options={{
                    animation: 'slide_from_right',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="HelpSupport"
                component={AppGuideScreen}
                options={{
                    animation: 'slide_from_right',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="ReferInvite"
                component={ReferralScreen}
                options={{
                    animation: 'slide_from_right',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="ProfileWallet"
                component={ProfileWalletScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="SellStock"
                component={SellStockScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="BuyStock"
                component={BuyStockScreen}
                options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            />

            <Stack.Screen
                name="UnlockAction"
                component={UnlockActionScreen}
                options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            />

           

            <Stack.Screen
                name="ChatSupport"
                component={ChatSupportScreen}
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="TopOrder"
                component={OrderScreen}
                options={{
                    animation: 'slide_from_right',
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    const [bootReady, setBootReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [cachedUser, setCachedUser] = useState(null);

    useEffect(() => {
        bootstrapApp();
    }, []);

    const bootstrapApp = async () => {
        try {
            console.log('🚀 Bootstrapping app...');

            const token = await AuthStorage.getToken();
            const user = await AuthStorage.getUser();

            if (token && user) {
                console.log('✅ Cached auth restored:', user?.fullName || 'User');
                setCachedUser(user);
                setIsAuthenticated(true);
            } else {
                console.log('❌ No cached authenticated session found');
                setCachedUser(null);
                setIsAuthenticated(false);
            }

            setBootReady(true);

            if (token) {
                refreshAuthUserInBackground();
            }
        } catch (error) {
            console.error('❌ Error during app bootstrap:', error);
            setCachedUser(null);
            setIsAuthenticated(false);
            setBootReady(true);
        }
    };

    const refreshAuthUserInBackground = async () => {
        try {
            console.log('🔄 Refreshing auth user in background...');
            const response = await ApiService.getUserProfile({
                preferCache: true,
                backgroundRefresh: true,
            });

            if (response?.success && response?.data) {
                setCachedUser(response.data);
                setIsAuthenticated(true);
                console.log('✅ Background user refresh successful');
            } else if (response?.statusCode === 401) {
                console.log('⚠️ Session expired during background refresh');
                await AuthStorage.clearAuth();
                setCachedUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.log('ℹ️ Background auth refresh skipped:', error?.message || error);
        }
    };

    const signIn = async (user = null) => {
        try {
            const storedUser = user || (await AuthStorage.getUser());
            setCachedUser(storedUser || null);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('❌ signIn error:', error);
            setIsAuthenticated(true);
        }
    };

    const signOut = async () => {
        try {
            await AuthStorage.clearAuth();
        } catch (error) {
            console.error('❌ signOut storage clear error:', error);
        } finally {
            setCachedUser(null);
            setIsAuthenticated(false);
        }
    };

    const refreshAuthUser = async () => {
        try {
            const response = await ApiService.getUserProfile({
                preferCache: false,
                backgroundRefresh: false,
            });

            if (response?.success && response?.data) {
                setCachedUser(response.data);
                setIsAuthenticated(true);
                return response.data;
            }

            if (response?.statusCode === 401) {
                await signOut();
            }

            return null;
        } catch (error) {
            console.error('❌ refreshAuthUser error:', error);
            return null;
        }
    };

    const authContextValue = useMemo(
        () => ({
            isAuthenticated,
            user: cachedUser,
            signIn,
            signOut,
            refreshAuthUser,
        }),
        [isAuthenticated, cachedUser]
    );

    if (!bootReady) {
        return <AppStartupLoader />;
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            <NavigationContainer ref={navigationRef}>
                {isAuthenticated ? <AppStack /> : <AuthStack />}
            </NavigationContainer>
        </AuthContext.Provider>
    );
};

export default AppNavigator;
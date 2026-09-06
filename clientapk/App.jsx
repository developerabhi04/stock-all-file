import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigatior';
import { COLORS } from './src/constants/colors';
import {
  requestNotificationPermission,
  getFcmToken,
  showLocalNotification,
  ensureNotificationChannel,
} from './src/services/NotificationService';
import messaging from '@react-native-firebase/messaging';
import ApiService from './src/services/ApiService';
import { handleNotificationNavigation } from './src/navigation/RootNavigation';

const App = () => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const granted = await requestNotificationPermission();
        console.log('🔔 Notification permission granted:', granted);

        if (!granted) return;

        await ensureNotificationChannel();

        const token = await getFcmToken();
        console.log('📲 App-level FCM token:', token);

        if (token) {
          const result = await ApiService.saveFcmToken(token);

          if (result?.success) {
            console.log('✅ FCM token saved to backend');
          } else {
            console.error(
              '❌ Failed to save FCM token to backend:',
              result?.message
            );
          }
        }
      } catch (error) {
        console.error('❌ Notification setup error:', error);
      }
    };

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground FCM message:', remoteMessage);

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'TradeHub';

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        'You have a new update';

      await showLocalNotification({
        title,
        body,
        data: remoteMessage?.data || {},
      });
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('📲 Notification opened from background:', remoteMessage);
        handleNotificationNavigation(remoteMessage?.data || {});
      }
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🚀 Notification opened from quit state:', remoteMessage);
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage?.data || {});
          }, 800);
        }
      });

    setupNotifications();

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      <AppNavigator />
    </>
  );
};

export default App;
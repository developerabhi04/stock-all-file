/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import {
  showLocalNotification,
  ensureNotificationChannel,
} from './src/services/NotificationService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background/quit FCM message:', remoteMessage);

  await ensureNotificationChannel();

  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    'TradeHub';

  const body =
    remoteMessage?.notification?.body ||
    remoteMessage?.data?.body ||
    'You have a new notification';

  await showLocalNotification({
    title,
    body,
    data: remoteMessage?.data || {},
  });
});

AppRegistry.registerComponent(appName, () => App);
import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
} from '@notifee/react-native';

const CHANNEL_ID = 'tradehub-alerts-v2';

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

export const getFcmToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('📲 FCM Token:', token);
    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

export const ensureNotificationChannel = async () => {
  return await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'TradeHub Alerts',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
    lights: true,
    lightColor: '#00C896',
    vibrationPattern: [300, 500, 300, 500],
  });
};

export const showLocalNotification = async ({ title, body, data = {} }) => {
  try {
    const channelId = await ensureNotificationChannel();

    await notifee.displayNotification({
      title: title || 'TradeHub',
      body: body || 'You have a new update',
      data,
      android: {
        channelId,
        smallIcon: 'ic_stat_tradehub',
        largeIcon: 'ic_launcher',
        color: '#00C896',
        pressAction: {
          id: 'default',
        },
        showTimestamp: true,
        timestamp: Date.now(),
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body || 'You have a new update',
        },
      },
    });
  } catch (error) {
    console.error('❌ Error showing local notification:', error);
  }
};
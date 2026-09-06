import React, { useRef, createRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import Screens
import HomeScreen from '../components/screens/HomeScreen';
import HistoryScreen from '../components/screens/profile/HistoryScreen';
import ProfileScreen from '../components/screens/profile/profile/ProfileScreen';
import PortfolioScreen from '../components/screens/portfolio/PortfolioScreen';
import OrderScreen from '../components/screens/orders/OrderScreen';
import TransactionHistoryScreen from '../components/screens/profile/TransactionHistoryScreen';

const Tab = createBottomTabNavigator();

// Create refs for each screen
const screenRefs = {
  Home: createRef(),
  Portfolio: createRef(),
  Orders: createRef(),
  Profile: createRef(),
};

const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();

  // Function to scroll to top
  const scrollToTop = (screenName) => {
    const ref = screenRefs[screenName];
    if (ref?.current?.scrollToTop) {
      ref.current.scrollToTop();
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarActiveTintColor: '#00C896',
        tabBarInactiveTintColor: '#666666',
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          const iconSize = focused ? 24 : 22;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Portfolio') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account-circle' : 'account-circle-outline';
          }

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Icon name={iconName} size={iconSize} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          return (
            <Text style={[styles.tabBarLabel, { color, fontWeight: focused ? '700' : '600' }]}>
              {route.name}
            </Text>
          );
        },
        tabBarItemStyle: styles.tabBarItem,
      })}
      screenListeners={{
        tabPress: (e) => {
          const routeName = e.target.split('-')[0];
          scrollToTop(routeName);
        },
      }}>
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} ref={screenRefs.Home} />}
      </Tab.Screen>
      <Tab.Screen name="Portfolio">
        {(props) => <PortfolioScreen {...props} ref={screenRefs.Portfolio} />}
      </Tab.Screen>
      <Tab.Screen name="Transactions">
        {(props) => <TransactionHistoryScreen {...props} ref={screenRefs.Transactions} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} ref={screenRefs.Profile} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 6,
    paddingHorizontal: 8,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },

  tabBarItem: {
    paddingVertical: 4,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 20,
    marginBottom: 2,
  },

  iconContainerActive: {
    backgroundColor: '#0D2B24',
    borderWidth: 1,
    borderColor: '#00C89630',
  },

  tabBarLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});

export default BottomTabNavigator;

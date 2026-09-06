import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
  surface: '#1A1A1A',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#999999',
  primary: '#00C896',
  primarySoft: 'rgba(0, 200, 150, 0.15)',
};

export default function TradeHubSupportButton({onPress}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={onPress}>
        <View style={styles.iconContainer}>
          <Icon
            name="robot-outline"
            size={25}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            Chat with TradeHub Assistant
          </Text>

          <Text style={styles.subtitle}>
            Get instant help with your account, wallet, payments, and app features.
          </Text>
        </View>

        <Icon
          name="chevron-right"
          size={22}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#000000',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  content: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});
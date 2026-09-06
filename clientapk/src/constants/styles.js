import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const COMMON_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  screenPadding: {
    paddingHorizontal: 24,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  shadow: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export const TYPOGRAPHY = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  h2: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  h3: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },

  h4: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },

  body1: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text,
    lineHeight: 24,
  },

  body2: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textLight,
    lineHeight: 16,
  },

  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

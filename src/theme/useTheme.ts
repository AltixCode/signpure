import { useColorScheme } from 'react-native';

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primaryLight: string;
  primaryBorder: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;
  danger: string;
  controlSurface: string;
  purple: string;
  headerBackground: string;
  headerTintColor: string;
  statusBarStyle: 'light' | 'dark';
}

export const useTheme = (): ThemeColors => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    background: isDark ? '#090D16' : '#F8FAFC',
    surface: isDark ? '#111827' : '#FFFFFF',
    card: isDark ? '#111827' : '#FFFFFF',
    cardBorder: isDark ? '#1E293B' : '#E2E8F0',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#7C3AED',
    onPrimary: '#FFFFFF',
    primaryLight: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.10)',
    primaryBorder: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(124, 58, 237, 0.25)',
    accent: '#A855F7',
    accentLight: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.10)',
    accentBorder: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.25)',
    warning: '#F59E0B',
    warningLight: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.10)',
    success: '#10B981',
    successLight: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
    danger: '#EF4444',
    controlSurface: isDark ? '#1E293B' : '#F1F5F9',
    purple: '#A855F7',
    headerBackground: isDark ? '#090D16' : '#FFFFFF',
    headerTintColor: isDark ? '#F8FAFC' : '#0F172A',
    statusBarStyle: isDark ? 'light' : 'dark',
  };
};

export const Colors = {
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#2563EB',
    border: '#E2E8F0',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
  },
  dark: {
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    primary: '#3B82F6',
    border: '#334155',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
};

export type ThemeColors = typeof Colors.light;

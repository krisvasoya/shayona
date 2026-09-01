import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '../theme/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
  isDark: false,
  colors: Colors.light,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    const dark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    setIsDark(dark);
    AsyncStorage.setItem('themeMode', mode).catch(() => {});
  }, [mode, systemScheme]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('themeMode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setMode(saved as ThemeMode);
      }
    } catch (_) {}
  };

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

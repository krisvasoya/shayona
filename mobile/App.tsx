import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import './src/i18n';
import { loadSavedLanguage } from './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

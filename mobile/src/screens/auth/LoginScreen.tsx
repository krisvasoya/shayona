import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { t } from '../../constants/strings';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginDemo, isLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
    } catch (error: any) {
      console.warn('Google Sign-in status:', error?.message || error);
      Alert.alert(
        'Google Sign-In Notice',
        'Google Play Services or Web Client ID is not configured yet. You can use the Quick Demo Login below to test Increment 1 immediately!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Demo Login', onPress: loginDemo },
        ]
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        {/* Logo and Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="receipt-outline" size={44} color="#2563EB" />
          </View>
          <Text style={styles.brandTitle}>{t.appName}</Text>
          <Text style={styles.brandTagline}>{t.tagline}</Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.highlightsContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={20} color="#2563EB" />
            <Text style={styles.featureText}>Lightning Fast Party & Invoice Management</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
            <Text style={styles.featureText}>100% Free & Zero Cloud Cost (Supabase)</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="document-text" size={20} color="#7C3AED" />
            <Text style={styles.featureText}>Clean & Simple (Strict No-GST / No-Tax)</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={t.signInWithGoogle}
            onPress={handleGoogleSignIn}
            loading={googleLoading || isLoading}
            variant="primary"
            icon={<Ionicons name="logo-google" size={18} color="#FFFFFF" />}
            style={styles.googleButton}
          />

          <Button
            title={t.demoLogin}
            onPress={loginDemo}
            variant="secondary"
            disabled={googleLoading || isLoading}
            icon={<Ionicons name="person-circle-outline" size={20} color="#2563EB" />}
          />

          <Text style={styles.privacyNote}>
            By signing in, you agree to secure local and cloud sync with Supabase.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  highlightsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 8,
  },
  googleButton: {
    backgroundColor: '#2563EB',
  },
  privacyNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { checkForUpdate, downloadAndInstall, VersionInfo } from '../../services/updateService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { changeAppLanguage } from '../../i18n';

export const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { isDark, mode, setMode, colors } = useTheme();
  const { user, logout } = useAuth();

  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const version = Constants.expoConfig?.version || '1.0.0';
    setCurrentVersion(version);
  }, []);

  const handleCheckUpdate = async () => {
    setLoading(true);
    try {
      const update = await checkForUpdate();
      if (update) {
        setLatestVersion(update);
        Alert.alert(
          'Update Available 🚀',
          `New version ${update.version} is ready to install!\n\nChangelog:\n${update.changelog}`
        );
      } else {
        Alert.alert('Up to Date ✅', `You are using the latest version (v${currentVersion}).`);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to reach the update server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!latestVersion || !latestVersion.downloadUrl) {
      Alert.alert('Notice', 'No direct download link attached to this release.');
      return;
    }
    setDownloading(true);
    setDownloadProgress(0);
    try {
      await downloadAndInstall(latestVersion.downloadUrl, (progress) => {
        setDownloadProgress(progress * 100);
      });
    } catch (error: any) {
      Alert.alert('Download Error', error?.message || 'Failed to download or install update.');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout') || 'Logout',
      t('logoutConfirm') || 'Are you sure you want to sign out?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { text: t('logout') || 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Ionicons name="settings" size={24} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Updates</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Updates Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="cloud-download-outline" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>App Updates</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Check and install the latest OTA APK releases
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Version</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>v{currentVersion}</Text>
          </View>

          {latestVersion && (
            <View style={[styles.updateBox, { backgroundColor: isDark ? '#1E293B' : '#F0FDF4', borderColor: isDark ? '#334155' : '#BBF7D0' }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '700' }]}>New Version Available</Text>
                <Text style={[styles.infoValue, { color: '#16A34A', fontWeight: '800' }]}>v{latestVersion.version}</Text>
              </View>
              <Text style={[styles.changelogTitle, { color: colors.text }]}>What's New:</Text>
              <Text style={[styles.changelogText, { color: colors.textSecondary }]}>{latestVersion.changelog}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleCheckUpdate}
            disabled={loading || downloading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Check for Updates</Text>
              </>
            )}
          </TouchableOpacity>

          {latestVersion && latestVersion.downloadUrl !== '' && !downloading && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#16A34A', marginTop: 10 }]}
              onPress={handleDownload}
            >
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Download & Install APK</Text>
            </TouchableOpacity>
          )}

          {downloading && (
            <View style={styles.downloadProgressSection}>
              <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${downloadProgress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Downloading update: {Math.round(downloadProgress)}%
              </Text>
            </View>
          )}
        </View>

        {/* Appearance Theme Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="color-palette-outline" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Switch between Light, Dark, or System mode
              </Text>
            </View>
          </View>

          <View style={styles.themeOptionsRow}>
            {(['light', 'dark', 'system'] as const).map((tMode) => (
              <TouchableOpacity
                key={tMode}
                style={[
                  styles.themeOptionChip,
                  mode === tMode && { backgroundColor: colors.primary, borderColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setMode(tMode)}
              >
                <Ionicons
                  name={tMode === 'dark' ? 'moon' : tMode === 'light' ? 'sunny' : 'phone-portrait-outline'}
                  size={18}
                  color={mode === tMode ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: mode === tMode ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {tMode.charAt(0).toUpperCase() + tMode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="language-outline" size={24} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>App Language</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Choose your preferred language
              </Text>
            </View>
          </View>

          <View style={styles.themeOptionsRow}>
            <TouchableOpacity
              style={[
                styles.themeOptionChip,
                i18n.language === 'en' && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
                { borderColor: colors.border },
              ]}
              onPress={() => changeAppLanguage('en')}
            >
              <Text style={[styles.themeOptionText, { color: i18n.language === 'en' ? '#FFFFFF' : colors.text }]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionChip,
                i18n.language === 'gu' && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
                { borderColor: colors.border },
              ]}
              onPress={() => changeAppLanguage('gu')}
            >
              <Text style={[styles.themeOptionText, { color: i18n.language === 'gu' ? '#FFFFFF' : colors.text }]}>
                ગુજરાતી
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account & Logout Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="person-outline" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Account</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {user?.displayName || 'Shayona Retail Store'} ({user?.email || 'retailer@shayona.store'})
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Sign Out of Store</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  updateBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  changelogTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  changelogText: {
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  downloadProgressSection: {
    gap: 6,
    marginTop: 4,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SettingsScreen;

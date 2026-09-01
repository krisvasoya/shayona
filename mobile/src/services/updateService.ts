import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

export interface VersionInfo {
  version: string;
  changelog: string;
  downloadUrl: string;
}

/**
 * Checks backend / Supabase for a newer version
 */
export const checkForUpdate = async (): Promise<VersionInfo | null> => {
  try {
    const response = await api.get('/version');
    const remote: VersionInfo = response.data;
    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    if (remote && remote.version && remote.version !== currentVersion) {
      return remote;
    }
    return null;
  } catch (error) {
    console.warn('Update check warning:', error);
    return null;
  }
};

/**
 * Downloads the APK and launches the Android native package installer
 * Safely loads FileSystem and IntentLauncher on demand.
 */
export const downloadAndInstall = async (
  downloadUrl: string,
  onProgress?: (progress: number) => void
) => {
  if (!downloadUrl) {
    throw new Error('No APK download URL provided.');
  }

  try {
    const FileSystem = require('expo-file-system');
    const IntentLauncher = require('expo-intent-launcher');

    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
    const fileUri = `${baseDir}update_${Date.now()}.apk`;

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      fileUri,
      {},
      (downloadProgress: any) => {
        if (downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (result && Platform.OS === 'android') {
      const cUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync(
        'android.intent.action.VIEW',
        {
          data: cUri,
          type: 'application/vnd.android.package-archive',
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        }
      );
    }
  } catch (error: any) {
    console.warn('downloadAndInstall error:', error);
    throw new Error(error?.message || 'Failed to install update package.');
  }
};

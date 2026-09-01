import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

export const sharePDF = async (fileUri: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Invoice Bill via WhatsApp or Apps',
      UTI: 'com.adobe.pdf',
    });
  } catch (error: any) {
    console.error('Error sharing PDF:', error);
    Alert.alert('Share Failed', error?.message || 'Could not share PDF invoice.');
  }
};

export const printPDF = async (fileUri: string): Promise<void> => {
  try {
    await Print.printAsync({
      uri: fileUri,
    });
  } catch (error: any) {
    console.error('Error printing PDF:', error);
    Alert.alert('Print Failed', error?.message || 'Could not send invoice to printer.');
  }
};

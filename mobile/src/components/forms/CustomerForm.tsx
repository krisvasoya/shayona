import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { t } from '../../constants/strings';

interface CustomerFormProps {
  visible: boolean;
  type: 'customer' | 'buyer';
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; address: string }) => Promise<void>;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  visible,
  type,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isCustomer = type === 'customer';
  const title = isCustomer ? t.addCustomer : t.addBuyer;
  const nameLabel = isCustomer ? t.customerName : t.buyerName;

  const handleClose = () => {
    setName('');
    setPhone('');
    setAddress('');
    setErrorMessage('');
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage(t.errorRequired);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      handleClose();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error || t.errorSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: isCustomer ? '#EFF6FF' : '#F3E8FF' }]}>
                <Ionicons
                  name={isCustomer ? 'people' : 'cart'}
                  size={20}
                  color={isCustomer ? '#2563EB' : '#7C3AED'}
                />
              </View>
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{nameLabel} *</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter ${nameLabel.toLowerCase()}`}
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.phoneNumber}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Address Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.address}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Shop / Area address"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title={t.cancel}
                variant="outline"
                onPress={handleClose}
                style={styles.flex1}
                disabled={loading}
              />
              <Button
                title={loading ? t.saving : t.save}
                variant="primary"
                onPress={handleSave}
                loading={loading}
                style={styles.flex1}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  formContent: {
    paddingTop: 16,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flex1: {
    flex: 1,
  },
});

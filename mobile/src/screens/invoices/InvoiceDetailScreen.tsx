import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getInvoice, recordPayment, getShopProfile } from '../../services/api';
import { Invoice } from '../../types';
import { generateInvoicePDF } from '../../services/pdfService';
import { sharePDF, printPDF } from '../../services/shareService';
import { Button } from '../../components/common/Button';

interface InvoiceDetailScreenProps {
  navigation: any;
  route: any;
}

export const InvoiceDetailScreen: React.FC<InvoiceDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const invoiceId = route.params?.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Recording Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'>('cash');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [paySubmitting, setPaySubmitting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      if (!invoiceId) return;
      const res = await getInvoice(invoiceId);
      setInvoice(res.data);
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', 'Failed to load invoice details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoice();
  };

  const handleShare = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const shopRes = await getShopProfile().catch(() => ({ data: {} }));
      const pdfUri = await generateInvoicePDF(invoice, shopRes.data);
      await sharePDF(pdfUri);
    } catch (e: any) {
      Alert.alert('Share Error', e?.message || 'Failed to generate PDF for sharing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const shopRes = await getShopProfile().catch(() => ({ data: {} }));
      const pdfUri = await generateInvoicePDF(invoice, shopRes.data);
      await printPDF(pdfUri);
    } catch (e: any) {
      Alert.alert('Print Error', e?.message || 'Failed to print invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid payment amount.');
      return;
    }

    try {
      setPaySubmitting(true);
      await recordPayment(invoiceId, {
        amount: amountVal,
        method: payMethod,
        reference: payReference.trim(),
        payment_date: payDate,
      });

      setPaymentModalVisible(false);
      setPayAmount('');
      setPayReference('');
      fetchInvoice();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to record payment.');
    } finally {
      setPaySubmitting(false);
    }
  };

  if (loading && !invoice) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ color: '#64748B' }}>Invoice not found.</Text>
      </SafeAreaView>
    );
  }

  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const grandTotal = Number(invoice.total_amount || 0);
  const paidAmount = Number(invoice.paid_amount || 0);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{invoice.invoice_number}</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() =>
            navigation.navigate('CreateEditInvoice', { invoiceId: invoice.id })
          }
        >
          <Ionicons name="create-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Paper Invoice Preview Card */}
        <View style={styles.paperCard}>
          {/* Bill Meta Row */}
          <View style={styles.billMetaRow}>
            <View>
              <View style={[styles.typeBadge, { backgroundColor: invoice.type === 'sale' ? '#EFF6FF' : '#F3E8FF' }]}>
                <Text style={[styles.typeBadgeText, { color: invoice.type === 'sale' ? '#2563EB' : '#7C3AED' }]}>
                  {invoice.type === 'sale' ? t('saleInvoice') : t('purchaseInvoice')}
                </Text>
              </View>
              <Text style={styles.billNoBig}>{invoice.invoice_number}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dateLabel}>Date: {invoice.invoice_date}</Text>
              {invoice.due_date ? (
                <Text style={styles.dueDateLabel}>Due: {invoice.due_date}</Text>
              ) : null}
            </View>
          </View>

          {/* Party Box */}
          <View style={styles.partyBox}>
            <Text style={styles.partyBoxTitle}>
              {invoice.type === 'sale' ? 'Bill To (Customer)' : 'Billed By (Supplier)'}
            </Text>
            <Text style={styles.partyName}>{invoice.party?.name || 'Retail Party'}</Text>
            {invoice.party?.phone ? (
              <Text style={styles.partyContact}>Phone: {invoice.party.phone}</Text>
            ) : null}
            {invoice.party?.address ? (
              <Text style={styles.partyContact}>Address: {invoice.party.address}</Text>
            ) : null}
          </View>

          {/* Items Table */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { flex: 2 }]}>Item</Text>
              <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
            </View>

            {(invoice.items || []).map((it, idx) => {
              const rowTotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tdText, { flex: 2, fontWeight: '600' }]}>{it.description}</Text>
                  <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{it.quantity}</Text>
                  <Text style={[styles.tdText, { flex: 1, textAlign: 'right' }]}>₹{Number(it.unit_price).toFixed(2)}</Text>
                  <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right', fontWeight: '700' }]}>
                    ₹{rowTotal.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Totals Breakdown */}
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.bdLabel}>{t('subtotal')}</Text>
              <Text style={styles.bdValue}>₹{subtotal.toFixed(2)}</Text>
            </View>

            {discount > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={[styles.bdLabel, { color: '#16A34A' }]}>{t('discount')}</Text>
                <Text style={[styles.bdValue, { color: '#16A34A' }]}>- ₹{discount.toFixed(2)}</Text>
              </View>
            ) : null}

            <View style={[styles.breakdownRow, styles.grandRow]}>
              <Text style={styles.grandLabel}>{t('grand_total')}</Text>
              <Text style={styles.grandValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.bdLabel, { color: '#16A34A' }]}>{t('paidAmount')} (Jama)</Text>
              <Text style={[styles.bdValue, { color: '#16A34A', fontWeight: '700' }]}>
                ₹{paidAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.bdLabel, { color: '#DC2626' }]}>{t('balanceDue')} (Baki)</Text>
              <Text style={[styles.bdValue, { color: '#DC2626', fontWeight: '800' }]}>
                ₹{balanceDue.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesHeading}>{t('notes')}</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Payment History Section */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentSectionHeader}>
            <Text style={styles.sectionTitle}>{t('paymentHistory')}</Text>
            {balanceDue > 0 ? (
              <TouchableOpacity
                style={styles.addPaymentTriggerBtn}
                onPress={() => {
                  setPayAmount(balanceDue.toString());
                  setPaymentModalVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={16} color="#16A34A" />
                <Text style={styles.addPaymentTriggerText}>{t('recordPayment')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {(invoice.payments || []).length === 0 ? (
            <View style={styles.emptyPaymentsBox}>
              <Text style={styles.emptyPaymentsText}>{t('noPaymentsYet')}</Text>
            </View>
          ) : (
            (invoice.payments || []).map((p) => (
              <View key={p.id} style={styles.paymentHistoryRow}>
                <View style={styles.payHistoryLeft}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <View>
                    <Text style={styles.payMethodText}>
                      {p.method?.toUpperCase()} {p.reference ? `• ${p.reference}` : ''}
                    </Text>
                    <Text style={styles.payDateText}>{p.payment_date}</Text>
                  </View>
                </View>
                <Text style={styles.payAmountText}>+ ₹{Number(p.amount).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={handleShare}
          disabled={actionLoading}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>{t('share')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.printBtn]}
          onPress={handlePrint}
          disabled={actionLoading}
        >
          <Ionicons name="print" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>{t('print')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() =>
            navigation.navigate('CreateEditInvoice', { invoiceId: invoice.id })
          }
          disabled={actionLoading}
        >
          <Ionicons name="create-outline" size={18} color="#2563EB" />
          <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('edit')}</Text>
        </TouchableOpacity>
      </View>

      {/* Record Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <View style={styles.paymentModalCard}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>{t('recordPayment')}</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('paymentAmount')} *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('paymentMethod')}</Text>
              <View style={styles.methodChipsRow}>
                {(['cash', 'upi', 'card', 'bank_transfer'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.methodChip, payMethod === method && styles.methodChipActive]}
                    onPress={() => setPayMethod(method)}
                  >
                    <Text
                      style={[
                        styles.methodChipText,
                        payMethod === method && styles.methodChipTextActive,
                      ]}
                    >
                      {t(method)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('paymentReference')}</Text>
              <TextInput
                style={styles.textInput}
                value={payReference}
                onChangeText={setPayReference}
                placeholder="e.g. Received via GPay"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Button
              title={paySubmitting ? t('saving') : t('save')}
              onPress={handleRecordPayment}
              loading={paySubmitting}
              variant="primary"
              style={{ marginTop: 8 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  editHeaderBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 90,
  },
  paperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  billNoBig: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dueDateLabel: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
  partyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  partyBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  partyContact: {
    fontSize: 12,
    color: '#475569',
  },
  tableContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tdText: {
    fontSize: 13,
    color: '#0F172A',
  },
  breakdownContainer: {
    alignSelf: 'flex-end',
    width: 220,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bdLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  bdValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    marginTop: 2,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  notesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  paymentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  addPaymentTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPaymentTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyPaymentsBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyPaymentsText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  payHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  payDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  payAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    gap: 6,
  },
  shareBtn: {
    backgroundColor: '#22C55E',
  },
  printBtn: {
    backgroundColor: '#2563EB',
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  paymentModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  methodChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  methodChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  methodChipTextActive: {
    color: '#2563EB',
  },
});

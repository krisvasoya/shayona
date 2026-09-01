import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getInvoice,
  createInvoice,
  updateInvoice,
  getShopProfile,
} from '../../services/api';
import { api } from '../../services/api';
import { Customer, Buyer, InvoiceItem, Invoice } from '../../types';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { generateInvoicePDF } from '../../services/pdfService';
import { sharePDF, printPDF } from '../../services/shareService';
import { Button } from '../../components/common/Button';

interface CreateEditInvoiceScreenProps {
  navigation: any;
  route: any;
}

export const CreateEditInvoiceScreen: React.FC<CreateEditInvoiceScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const invoiceId = route.params?.invoiceId;
  const isEditMode = !!invoiceId;

  const defaultType = route.params?.defaultType || 'sale';
  const initialPartyId = route.params?.partyId;

  // Form State
  const [invoiceType, setInvoiceType] = useState<'sale' | 'purchase'>(defaultType);
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(initialPartyId || null);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [discount, setDiscount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);

  // Parties list & selectors
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [partyPickerVisible, setPartyPickerVisible] = useState(false);
  const [addPartyModalVisible, setAddPartyModalVisible] = useState(false);

  // Loading & Save options state
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [saveOptionsVisible, setSaveOptionsVisible] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Load parties and invoice details (if editing)
  useEffect(() => {
    loadParties();
    if (isEditMode) {
      loadInvoiceDetails();
    }
  }, [invoiceId]);

  const loadParties = async () => {
    try {
      const [custRes, buyRes] = await Promise.allSettled([
        api.get('/customers'),
        api.get('/buyers'),
      ]);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data || []);
      if (buyRes.status === 'fulfilled') setBuyers(buyRes.value.data || []);
    } catch (e) {
      console.warn('Error loading parties:', e);
    }
  };

  const loadInvoiceDetails = async () => {
    try {
      setInitialLoading(true);
      const res = await getInvoice(invoiceId);
      const inv = res.data;
      setInvoiceType(inv.type);
      setSelectedPartyId(inv.party_id);
      setInvoiceDate(inv.invoice_date);
      setDueDate(inv.due_date || '');
      setDiscount(inv.discount ? inv.discount.toString() : '0');
      setNotes(inv.notes || '');
      if (inv.items && inv.items.length > 0) {
        setItems(inv.items);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load invoice details for editing.');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  // Calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);

  // Item List handlers
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Notice', 'An invoice must contain at least 1 item.');
      return;
    }
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Party selector helpers
  const currentParties = invoiceType === 'sale' ? customers : buyers;
  const selectedParty = currentParties.find((p) => p.id === selectedPartyId);

  const handleCreateNewParty = async (formData: { name: string; phone: string; address: string }) => {
    try {
      const endpoint = invoiceType === 'sale' ? '/customers' : '/buyers';
      const res = await api.post(endpoint, formData);
      if (res.data) {
        if (invoiceType === 'sale') {
          setCustomers([res.data, ...customers]);
        } else {
          setBuyers([res.data, ...buyers]);
        }
        setSelectedPartyId(res.data.id);
      }
    } catch (e) {
      console.warn('Error adding party from modal:', e);
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!selectedPartyId) {
      Alert.alert('Validation Error', t('errorPartyRequired'));
      return;
    }

    const validItems = items.filter(
      (item) => item.description.trim() && Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      Alert.alert('Validation Error', t('errorItemRequired'));
      return;
    }

    const payload = {
      type: invoiceType,
      party_id: selectedPartyId,
      invoice_date: invoiceDate,
      due_date: dueDate.trim() || null,
      discount: discountVal,
      notes: notes.trim(),
      items: validItems.map((it) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
      })),
    };

    try {
      setSaving(true);
      let responseInvoice: Invoice;

      if (isEditMode) {
        const res = await updateInvoice(invoiceId, payload);
        responseInvoice = {
          ...res.data,
          party: selectedParty
            ? {
                id: selectedParty.id,
                name: selectedParty.name,
                phone: selectedParty.phone,
                address: selectedParty.address,
              }
            : undefined,
        };
      } else {
        const res = await createInvoice(payload);
        responseInvoice = {
          ...res.data,
          party: selectedParty
            ? {
                id: selectedParty.id,
                name: selectedParty.name,
                phone: selectedParty.phone,
                address: selectedParty.address,
              }
            : undefined,
        };
      }

      setSavedInvoice(responseInvoice);
      setSaveOptionsVisible(true);
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      Alert.alert('Save Failed', error?.response?.data?.error || 'Could not save invoice.');
    } finally {
      setSaving(false);
    }
  };

  // Save & Options Actions
  const handleSendWhatsApp = async () => {
    if (!savedInvoice) return;
    try {
      setPdfGenerating(true);
      const shopRes = await getShopProfile().catch(() => ({ data: {} }));
      const pdfUri = await generateInvoicePDF(savedInvoice, shopRes.data);
      await sharePDF(pdfUri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to generate and share PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!savedInvoice) return;
    try {
      setPdfGenerating(true);
      const shopRes = await getShopProfile().catch(() => ({ data: {} }));
      const pdfUri = await generateInvoicePDF(savedInvoice, shopRes.data);
      await printPDF(pdfUri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to print PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleBackToList = () => {
    setSaveOptionsVisible(false);
    navigation.goBack();
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? t('editInvoice') : t('createInvoice')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Invoice Type Selector */}
          <View style={styles.typeSegmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, invoiceType === 'sale' && styles.segmentBtnActive]}
              onPress={() => {
                setInvoiceType('sale');
                setSelectedPartyId(null);
              }}
            >
              <Text style={[styles.segmentText, invoiceType === 'sale' && styles.segmentTextActive]}>
                {t('saleInvoice')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, invoiceType === 'purchase' && styles.segmentBtnActivePurchase]}
              onPress={() => {
                setInvoiceType('purchase');
                setSelectedPartyId(null);
              }}
            >
              <Text style={[styles.segmentText, invoiceType === 'purchase' && styles.segmentTextActive]}>
                {t('purchaseInvoice')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Party Selector */}
          <View style={styles.inputCard}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                {invoiceType === 'sale' ? t('customerName') : t('buyerName')} *
              </Text>
              <TouchableOpacity
                onPress={() => setAddPartyModalVisible(true)}
                style={styles.addNewPartyBtn}
              >
                <Text style={styles.addNewPartyText}>{t('addNewParty')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.partySelectTrigger}
              onPress={() => setPartyPickerVisible(true)}
            >
              <Text style={[styles.partySelectText, !selectedParty && { color: '#94A3B8' }]}>
                {selectedParty ? selectedParty.name : t('selectParty')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Date Row */}
          <View style={styles.datesRow}>
            <View style={[styles.inputCard, styles.flex1]}>
              <Text style={styles.inputLabel}>{t('invoiceDate')} *</Text>
              <TextInput
                style={styles.textInput}
                value={invoiceDate}
                onChangeText={setInvoiceDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.inputCard, styles.flex1]}>
              <Text style={styles.inputLabel}>{t('dueDate')}</Text>
              <TextInput
                style={styles.textInput}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeading}>{t('items')}</Text>
              <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                <Ionicons name="add-circle" size={18} color="#2563EB" />
                <Text style={styles.addItemText}>{t('addItem')}</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => {
              const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
              return (
                <View key={index} style={styles.itemRowCard}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemIndexText}>#{index + 1}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.itemDescInput}
                    placeholder={t('itemDescription')}
                    placeholderTextColor="#94A3B8"
                    value={item.description}
                    onChangeText={(val) => handleItemChange(index, 'description', val)}
                  />

                  <View style={styles.itemNumbersRow}>
                    <View style={styles.itemNumCol}>
                      <Text style={styles.numColLabel}>{t('quantity')}</Text>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor="#94A3B8"
                        value={item.quantity ? item.quantity.toString() : ''}
                        onChangeText={(val) => handleItemChange(index, 'quantity', val)}
                      />
                    </View>

                    <View style={styles.itemNumCol}>
                      <Text style={styles.numColLabel}>{t('rate')} (₹)</Text>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        value={item.unit_price ? item.unit_price.toString() : ''}
                        onChangeText={(val) => handleItemChange(index, 'unit_price', val)}
                      />
                    </View>

                    <View style={styles.itemNumCol}>
                      <Text style={styles.numColLabel}>{t('amount')} (₹)</Text>
                      <View style={styles.lineTotalBox}>
                        <Text style={styles.lineTotalText}>₹{lineTotal.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Totals & Discount Card */}
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('subtotal')}</Text>
              <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('discount')}</Text>
              <TextInput
                style={styles.discountInput}
                keyboardType="numeric"
                value={discount}
                onChangeText={setDiscount}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>{t('grand_total')}</Text>
              <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>{t('notes')}</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('notesPlaceholder')}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <Button
            title={saving ? t('saving') : t('save')}
            onPress={handleSave}
            loading={saving}
            variant="primary"
            style={styles.saveBtn}
          />
        </ScrollView>

        {/* Party Selector Modal */}
        <Modal
          visible={partyPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPartyPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPartyPickerVisible(false)}
          >
            <View style={styles.pickerModalCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  {invoiceType === 'sale' ? 'Select Customer' : 'Select Buyer'}
                </Text>
                <TouchableOpacity onPress={() => setPartyPickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                {currentParties.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', textAlign: 'center' }}>
                      No {invoiceType === 'sale' ? 'customers' : 'buyers'} found. Please add one.
                    </Text>
                  </View>
                ) : (
                  currentParties.map((party) => (
                    <TouchableOpacity
                      key={party.id}
                      style={[
                        styles.partyOptionRow,
                        selectedPartyId === party.id && styles.partyOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedPartyId(party.id);
                        setPartyPickerVisible(false);
                      }}
                    >
                      <Text style={styles.partyOptionName}>{party.name}</Text>
                      {party.phone ? (
                        <Text style={styles.partyOptionPhone}>{party.phone}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Button
                title={t('addNewParty')}
                variant="secondary"
                onPress={() => {
                  setPartyPickerVisible(false);
                  setAddPartyModalVisible(true);
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Add Party Mini-Modal */}
        <CustomerForm
          visible={addPartyModalVisible}
          type={invoiceType === 'sale' ? 'customer' : 'buyer'}
          onClose={() => setAddPartyModalVisible(false)}
          onSubmit={handleCreateNewParty}
        />

        {/* Save & Options Modal (WhatsApp, Print, Back to List) */}
        <Modal
          visible={saveOptionsVisible}
          transparent
          animationType="fade"
          onRequestClose={handleBackToList}
        >
          <View style={styles.saveOptionsBackdrop}>
            <View style={styles.saveOptionsCard}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-done" size={32} color="#16A34A" />
              </View>

              <Text style={styles.saveOptionsTitle}>{t('saveOptionsTitle')}</Text>
              <Text style={styles.saveOptionsSubtitle}>{t('saveOptionsSubtitle')}</Text>

              {pdfGenerating ? (
                <View style={styles.pdfLoadingBox}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.pdfLoadingText}>{t('generatingPdf')}</Text>
                </View>
              ) : null}

              <View style={styles.optionsButtonsCol}>
                <TouchableOpacity
                  style={[styles.actionOptionBtn, { backgroundColor: '#22C55E' }]}
                  onPress={handleSendWhatsApp}
                  disabled={pdfGenerating}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <Text style={styles.actionOptionText}>{t('sendWhatsApp')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionOptionBtn, { backgroundColor: '#2563EB' }]}
                  onPress={handlePrint}
                  disabled={pdfGenerating}
                >
                  <Ionicons name="print" size={20} color="#FFFFFF" />
                  <Text style={styles.actionOptionText}>{t('printDirect')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionOptionBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={handleBackToList}
                >
                  <Ionicons name="arrow-back" size={20} color="#475569" />
                  <Text style={[styles.actionOptionText, { color: '#475569' }]}>
                    {t('backToList')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  typeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#2563EB',
  },
  segmentBtnActivePurchase: {
    backgroundColor: '#7C3AED',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  addNewPartyBtn: {
    paddingHorizontal: 6,
  },
  addNewPartyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  partySelectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#F8FAFC',
  },
  partySelectText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
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
  notesInput: {
    height: 70,
    paddingTop: 8,
  },
  itemsSection: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  itemDescInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  itemNumbersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  itemNumCol: {
    flex: 1,
    gap: 4,
  },
  numColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  numInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
  },
  lineTotalBox: {
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    width: 90,
    height: 34,
    textAlign: 'right',
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '700',
    backgroundColor: '#F8FAFC',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  saveBtn: {
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  pickerModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  partyOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  partyOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  partyOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  partyOptionPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  saveOptionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  saveOptionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  successIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  saveOptionsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  saveOptionsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  pdfLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  pdfLoadingText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  optionsButtonsCol: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    gap: 10,
  },
  actionOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

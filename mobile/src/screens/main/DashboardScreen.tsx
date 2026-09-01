import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getInvoices } from '../../services/api';
import { DashboardStats, Invoice } from '../../types';
import { changeAppLanguage } from '../../i18n';

interface DashboardScreenProps {
  navigation: any;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalPaidAmount: 0,
    totalOutstanding: 0,
    period: { start: '', end: '' },
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<PeriodFilter>('month');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [languageModalVisible, setLanguageModalVisible] = useState<boolean>(false);

  // Custom date selection state
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customModalVisible, setCustomModalVisible] = useState<boolean>(false);

  const getDateRangeForFilter = (filter: PeriodFilter) => {
    const now = new Date();
    let start = '';
    let end = now.toISOString().slice(0, 10);

    if (filter === 'today') {
      start = end;
    } else if (filter === 'week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      start = firstDay.toISOString().slice(0, 10);
    } else if (filter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else if (filter === 'year') {
      start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    } else if (filter === 'custom') {
      start = customStartDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      end = customEndDate || new Date().toISOString().slice(0, 10);
    }
    return { start, end };
  };

  const fetchDashboardData = useCallback(async (filter: PeriodFilter) => {
    try {
      const { start, end } = getDateRangeForFilter(filter);
      const [statsRes, invoicesRes] = await Promise.allSettled([
        getDashboardStats(start, end),
        getInvoices(5),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value.data)) {
        setRecentInvoices(invoicesRes.value.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customStartDate, customEndDate]);

  useEffect(() => {
    fetchDashboardData(selectedFilter);
  }, [selectedFilter, fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(selectedFilter);
  };

  const handleFilterSelect = (filter: PeriodFilter) => {
    if (filter === 'custom') {
      setCustomModalVisible(true);
    } else {
      setSelectedFilter(filter);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleLanguageChange = async (lng: 'en' | 'gu') => {
    await changeAppLanguage(lng);
    setLanguageModalVisible(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'sent':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'overdue':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="power-outline" size={22} color="#DC2626" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerShopName} numberOfLines={1}>
            {user?.displayName || 'Shayona Retail Store'}
          </Text>
          <Text style={styles.headerSubtitle}>{t('tagline')}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setLanguageModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="globe-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Date Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['today', 'week', 'month', 'year', 'custom'] as PeriodFilter[]).map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleFilterSelect(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {t(filter)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Stats Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* Total Invoices */}
            <View style={[styles.statCard, { borderColor: '#E2E8F0' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="receipt-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>{stats.totalInvoices}</Text>
              <Text style={styles.statLabel}>{t('total_bills')}</Text>
            </View>

            {/* Total Paid (Jama) */}
            <View style={[styles.statCard, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="arrow-down-circle" size={20} color="#16A34A" />
              </View>
              <Text style={[styles.statNumber, { color: '#16A34A' }]}>
                ₹{Number(stats.totalPaidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.statLabel, { color: '#15803D' }]}>{t('jama')}</Text>
            </View>

            {/* Total Outstanding (Baki) */}
            <View style={[styles.statCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
              </View>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                ₹{Number(stats.totalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.statLabel, { color: '#991B1B' }]}>{t('baki')}</Text>
            </View>
          </View>
        )}

        {/* Create Invoice Quick Action */}
        <TouchableOpacity
          style={styles.newInvoiceBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateEditInvoice', { defaultType: 'sale' })}
        >
          <View style={styles.newInvoiceLeft}>
            <View style={styles.newInvoiceIcon}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.newInvoiceTitle}>{t('newInvoice')}</Text>
              <Text style={styles.newInvoiceSub}>Tap to create new Sale or Purchase bill</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
        </TouchableOpacity>

        {/* Recent Invoices Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('recentInvoices')}</Text>
          </View>

          {recentInvoices.length === 0 ? (
            <View style={styles.emptyRecentCard}>
              <Ionicons name="document-text-outline" size={36} color="#CBD5E1" />
              <Text style={styles.emptyRecentText}>{t('noInvoices')}</Text>
            </View>
          ) : (
            recentInvoices.map((inv) => {
              const statusStyle = getStatusColor(inv.status);
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.invoiceCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: inv.id })}
                >
                  <View style={styles.invoiceCardLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: inv.type === 'sale' ? '#EFF6FF' : '#F3E8FF' }]}>
                      <Text style={[styles.typeBadgeText, { color: inv.type === 'sale' ? '#2563EB' : '#7C3AED' }]}>
                        {inv.type === 'sale' ? 'SALE' : 'PUR'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.invoiceNoText}>{inv.invoice_number}</Text>
                      <Text style={styles.invoiceDateText}>{inv.invoice_date}</Text>
                    </View>
                  </View>

                  <View style={styles.invoiceCardRight}>
                    <Text style={styles.invoiceAmountText}>
                      ₹{Number(inv.total_amount || 0).toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {inv.status?.toUpperCase() || 'DRAFT'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.languageModalCard}>
            <Text style={styles.modalHeading}>{t('changeLanguage')}</Text>

            <TouchableOpacity
              style={[
                styles.langOption,
                i18n.language === 'en' && styles.langOptionActive,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.langOptionLeft}>
                <Ionicons name="language-outline" size={20} color="#2563EB" />
                <Text style={styles.langOptionText}>English</Text>
              </View>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langOption,
                i18n.language === 'gu' && styles.langOptionActive,
              ]}
              onPress={() => handleLanguageChange('gu')}
            >
              <View style={styles.langOptionLeft}>
                <Ionicons name="language" size={20} color="#7C3AED" />
                <Text style={styles.langOptionText}>ગુજરાતી (Gujarati)</Text>
              </View>
              {i18n.language === 'gu' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  newInvoiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  newInvoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newInvoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newInvoiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  newInvoiceSub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 1,
  },
  recentSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyRecentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyRecentText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  invoiceNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  invoiceCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invoiceAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  languageModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  langOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

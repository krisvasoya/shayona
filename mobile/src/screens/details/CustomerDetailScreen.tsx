import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getCustomerDetail } from '../../services/api';
import { CustomerDetailData, Invoice } from '../../types';

interface CustomerDetailScreenProps {
  navigation: any;
  route: any;
}

export const CustomerDetailScreen: React.FC<CustomerDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const customerId = route.params?.customerId;

  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      if (!customerId) return;
      const res = await getCustomerDetail(customerId);
      setData(res.data);
    } catch (error) {
      console.error('Error fetching customer detail:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
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

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.invoiceNumberText}>{item.invoice_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {item.status?.toUpperCase() || 'DRAFT'}
            </Text>
          </View>
        </View>

        <Text style={styles.invoiceDateText}>{item.invoice_date}</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardAmountsRow}>
          <View>
            <Text style={styles.amountLabel}>Total Bill</Text>
            <Text style={styles.amountValue}>₹{Number(item.total_amount || 0).toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.amountLabel}>{t('jama')}</Text>
            <Text style={[styles.amountValue, { color: '#16A34A' }]}>
              ₹{Number(item.paid_amount || 0).toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.amountLabel}>{t('baki')}</Text>
            <Text style={[styles.amountValue, { color: '#DC2626' }]}>
              ₹{Math.max(0, Number(item.total_amount || 0) - Number(item.paid_amount || 0)).toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </SafeAreaView>
    );
  }

  const customer = data?.customer;
  const summary = data?.summary || { totalInvoices: 0, totalPaid: 0, totalOutstanding: 0 };
  const invoices = data?.invoices || [];

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
        <Text style={styles.headerTitle}>{customer?.name || t('customerDetails')}</Text>
        <TouchableOpacity
          style={styles.newBillBtn}
          onPress={() =>
            navigation.navigate('CreateEditInvoice', {
              defaultType: 'sale',
              partyId: customer?.id,
            })
          }
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
        ListHeaderComponent={
          <View style={styles.profileSection}>
            {/* Customer Contact Card */}
            <View style={styles.contactCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {customer?.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.customerName}>{customer?.name}</Text>
                {customer?.phone ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{customer.phone}</Text>
                  </View>
                ) : null}
                {customer?.address ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{customer.address}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Summary 3-Box Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { borderColor: '#E2E8F0' }]}>
                <Text style={styles.statCount}>{summary.totalInvoices}</Text>
                <Text style={styles.statTitle}>{t('total_bills')}</Text>
              </View>

              <View style={[styles.statBox, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.statCount, { color: '#16A34A' }]}>
                  ₹{Number(summary.totalPaid || 0).toFixed(2)}
                </Text>
                <Text style={[styles.statTitle, { color: '#15803D' }]}>{t('jama')}</Text>
              </View>

              <View style={[styles.statBox, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.statCount, { color: '#DC2626' }]}>
                  ₹{Number(summary.totalOutstanding || 0).toFixed(2)}
                </Text>
                <Text style={[styles.statTitle, { color: '#991B1B' }]}>{t('baki')}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeading}>{t('invoices')}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t('noInvoices')}</Text>
            <TouchableOpacity
              style={styles.addFirstBillBtn}
              onPress={() =>
                navigation.navigate('CreateEditInvoice', {
                  defaultType: 'sale',
                  partyId: customer?.id,
                })
              }
            >
              <Text style={styles.addFirstBillText}>+ Create First Sale Bill</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    gap: 8,
  },
  loadingText: {
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
    flex: 1,
    marginLeft: 12,
  },
  newBillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  profileSection: {
    gap: 14,
    marginBottom: 4,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563EB',
  },
  contactInfo: {
    flex: 1,
    gap: 3,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  cardAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  addFirstBillBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  addFirstBillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});

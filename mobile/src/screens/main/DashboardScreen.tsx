import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../constants/strings';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [buyerCount, setBuyerCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const [customersRes, buyersRes] = await Promise.allSettled([
        api.get('/customers'),
        api.get('/buyers'),
      ]);

      if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value.data)) {
        setCustomerCount(customersRes.value.data.length);
      }
      if (buyersRes.status === 'fulfilled' && Array.isArray(buyersRes.value.data)) {
        setBuyerCount(buyersRes.value.data.length);
      }
    } catch (e) {
      console.warn('Error loading dashboard counts', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* App Bar Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{t.welcomeUser}</Text>
          <Text style={styles.userName}>{user?.displayName || 'Retail Merchant'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Increment 1 Status Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{t.readyForInvoices}</Text>
            <Text style={styles.bannerSubtext}>{t.activeSubtext}</Text>
          </View>
        </View>

        {/* Overview Stats */}
        <Text style={styles.sectionHeading}>{t.quickOverview}</Text>

        <View style={styles.statsGrid}>
          {/* Customers Card */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Customers')}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={22} color="#2563EB" />
            </View>
            <Text style={styles.statCount}>{customerCount}</Text>
            <Text style={styles.statLabel}>{t.totalCustomers}</Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>View List</Text>
              <Ionicons name="arrow-forward" size={14} color="#2563EB" />
            </View>
          </TouchableOpacity>

          {/* Buyers Card */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Buyers')}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="cart" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.statCount}>{buyerCount}</Text>
            <Text style={styles.statLabel}>{t.totalBuyers}</Text>
            <View style={styles.cardActionRow}>
              <Text style={[styles.cardActionText, { color: '#7C3AED' }]}>View List</Text>
              <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionHeading}>Manage Directories</Text>

          <TouchableOpacity
            style={styles.actionRowCard}
            onPress={() => navigation.navigate('Customers')}
          >
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionBadge, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="person-add" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Add & Manage Customers</Text>
                <Text style={styles.actionSubtitle}>Maintain retail customer phone & addresses</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRowCard}
            onPress={() => navigation.navigate('Buyers')}
          >
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionBadge, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="business" size={18} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Add & Manage Buyers</Text>
                <Text style={styles.actionSubtitle}>Maintain supplier and wholesale contacts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  bannerCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  bannerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  quickActionsSection: {
    gap: 12,
  },
  actionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

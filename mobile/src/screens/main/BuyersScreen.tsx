import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Buyer } from '../../types';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { t } from '../../constants/strings';

export const BuyersScreen: React.FC = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchBuyers = useCallback(async () => {
    try {
      const response = await api.get('/buyers');
      if (Array.isArray(response.data)) {
        setBuyers(response.data);
        setFilteredBuyers(response.data);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBuyers();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredBuyers(buyers);
      return;
    }
    const query = text.toLowerCase();
    const filtered = buyers.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        (b.phone && b.phone.toLowerCase().includes(query)) ||
        (b.address && b.address.toLowerCase().includes(query))
    );
    setFilteredBuyers(filtered);
  };

  const handleAddBuyer = async (formData: { name: string; phone: string; address: string }) => {
    const response = await api.post('/buyers', formData);
    if (response.data) {
      const updatedList = [response.data, ...buyers];
      setBuyers(updatedList);
      if (
        !searchQuery ||
        response.data.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        setFilteredBuyers([response.data, ...filteredBuyers]);
      }
    }
  };

  const renderItem = ({ item }: { item: Buyer }) => {
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : 'B'}
          </Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.buyerName}>{item.name}</Text>
          {item.phone ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={13} color="#64748B" />
              <Text style={styles.phoneText}>{item.phone}</Text>
            </View>
          ) : null}
          {item.address ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={13} color="#64748B" />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header & Search */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.buyers}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{buyers.length}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Buyers List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBuyers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filteredBuyers.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7C3AED']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="cart-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching buyers' : t.noBuyersTitle}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? 'Try searching with a different name or phone number.'
                  : t.noBuyersDesc}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Buyer Modal */}
      <CustomerForm
        visible={modalVisible}
        type="buyer"
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddBuyer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});

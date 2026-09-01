import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { CustomersScreen } from '../screens/main/CustomersScreen';
import { BuyersScreen } from '../screens/main/BuyersScreen';
import { CustomerDetailScreen } from '../screens/details/CustomerDetailScreen';
import { BuyerDetailScreen } from '../screens/details/BuyerDetailScreen';
import { CreateEditInvoiceScreen } from '../screens/invoices/CreateEditInvoiceScreen';
import { InvoiceDetailScreen } from '../screens/invoices/InvoiceDetailScreen';
import { AuthNavigator } from './AuthNavigator';
import {
  MainTabParamList,
  RootStackParamList,
  DashboardStackParamList,
  CustomersStackParamList,
  BuyersStackParamList,
} from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const DashStack = createNativeStackNavigator<DashboardStackParamList>();
const CustStack = createNativeStackNavigator<CustomersStackParamList>();
const BuyStack = createNativeStackNavigator<BuyersStackParamList>();

// 1. Dashboard Stack
const DashboardStack: React.FC = () => {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
      <DashStack.Screen name="Dashboard" component={DashboardScreen} />
      <DashStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <DashStack.Screen name="CreateEditInvoice" component={CreateEditInvoiceScreen} />
    </DashStack.Navigator>
  );
};

// 2. Customers Stack (List -> CustomerDetail -> InvoiceDetail -> CreateEditInvoice)
const CustomersStack: React.FC = () => {
  return (
    <CustStack.Navigator screenOptions={{ headerShown: false }}>
      <CustStack.Screen name="CustomersList" component={CustomersScreen} />
      <CustStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <CustStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <CustStack.Screen name="CreateEditInvoice" component={CreateEditInvoiceScreen} />
    </CustStack.Navigator>
  );
};

// 3. Buyers Stack (List -> BuyerDetail -> InvoiceDetail -> CreateEditInvoice)
const BuyersStack: React.FC = () => {
  return (
    <BuyStack.Navigator screenOptions={{ headerShown: false }}>
      <BuyStack.Screen name="BuyersList" component={BuyersScreen} />
      <BuyStack.Screen name="BuyerDetail" component={BuyerDetailScreen} />
      <BuyStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <BuyStack.Screen name="CreateEditInvoice" component={CreateEditInvoiceScreen} />
    </BuyStack.Navigator>
  );
};

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cube';

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CustomersTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'BuyersTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ tabBarLabel: t('dashboard') }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersStack}
        options={{ tabBarLabel: t('customers') }}
      />
      <Tab.Screen
        name="BuyersTab"
        component={BuyersStack}
        options={{ tabBarLabel: t('buyers') }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

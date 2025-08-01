import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function SellerAnalyticsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('last30');

  const fetchAnalyticsData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/seller/analytics?range=${dateRange}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set default data if API fails
      setAnalyticsData({
        totals: {
          revenue: 0,
          orders: 0,
          avgOrderValue: 0,
          products: 0,
        },
        previousTotals: {
          revenue: 0,
          orders: 0,
          avgOrderValue: 0,
          products: 0,
        },
        revenueData: [],
        orderData: [],
        categoryData: [],
        topProducts: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIndicator = (percentChange) => {
    if (percentChange > 0) {
      return (
        <View style={styles.trendUp}>
          <Icon name="trending-up" size={16} color="#4CAF50" />
          <Text style={[styles.trendText, { color: '#4CAF50' }]}>
            +{Math.abs(percentChange).toFixed(1)}%
          </Text>
        </View>
      );
    } else if (percentChange < 0) {
      return (
        <View style={styles.trendDown}>
          <Icon name="trending-down" size={16} color="#F44336" />
          <Text style={[styles.trendText, { color: '#F44336' }]}>
            {Math.abs(percentChange).toFixed(1)}%
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.trendNeutral}>
        <Text style={[styles.trendText, { color: '#666' }]}>0%</Text>
      </View>
    );
  };

  const MetricCard = ({ title, value, icon, color, subtitle, trend }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={styles.metricValue}>{value}</Text>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
          {trend && (
            <View style={styles.trendContainer}>
              {trend}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const DateRangeSelector = () => (
    <View style={styles.dateRangeContainer}>
      <Text style={styles.dateRangeTitle}>Time Period</Text>
      <View style={styles.dateRangeButtons}>
        {[
          { key: 'last7', label: '7D' },
          { key: 'last30', label: '30D' },
          { key: 'last90', label: '90D' },
          { key: 'year', label: '1Y' },
        ].map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.dateRangeButton,
              dateRange === range.key && styles.dateRangeButtonActive
            ]}
            onPress={() => setDateRange(range.key)}
          >
            <Text style={[
              styles.dateRangeButtonText,
              dateRange === range.key && styles.dateRangeButtonTextActive
            ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SimpleChart = ({ data, title, color }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.emptyChart}>
            <Icon name="chart-line" size={48} color="#ccc" />
            <Text style={styles.emptyChartText}>No data available</Text>
          </View>
        </View>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value || 0));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartBars}>
          {data.slice(0, 7).map((item, index) => (
            <View key={index} style={styles.chartBarContainer}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: maxValue > 0 ? (item.value / maxValue) * 100 : 0,
                    backgroundColor: color,
                  }
                ]}
              />
              <Text style={styles.chartBarLabel}>
                {item.label || item.date || `D${index + 1}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2874f0" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your store's performance</Text>
      </View>

      {/* Date Range Selector */}
      <DateRangeSelector />

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(analyticsData?.totals?.revenue || 0)}
            icon="currency-inr"
            color="#4CAF50"
            trend={getTrendIndicator(
              getPercentageChange(
                analyticsData?.totals?.revenue || 0,
                analyticsData?.previousTotals?.revenue || 0
              )
            )}
          />
          <MetricCard
            title="Total Orders"
            value={analyticsData?.totals?.orders || 0}
            icon="shopping-outline"
            color="#2196F3"
            trend={getTrendIndicator(
              getPercentageChange(
                analyticsData?.totals?.orders || 0,
                analyticsData?.previousTotals?.orders || 0
              )
            )}
          />
          <MetricCard
            title="Avg. Order Value"
            value={formatCurrency(analyticsData?.totals?.avgOrderValue || 0)}
            icon="tag-outline"
            color="#FF9800"
            trend={getTrendIndicator(
              getPercentageChange(
                analyticsData?.totals?.avgOrderValue || 0,
                analyticsData?.previousTotals?.avgOrderValue || 0
              )
            )}
          />
          <MetricCard
            title="Active Products"
            value={analyticsData?.totals?.products || 0}
            icon="package-variant"
            color="#9C27B0"
            trend={getTrendIndicator(
              getPercentageChange(
                analyticsData?.totals?.products || 0,
                analyticsData?.previousTotals?.products || 0
              )
            )}
          />
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.chartsSection}>
        <Text style={styles.sectionTitle}>Performance Trends</Text>
        
        <SimpleChart
          data={analyticsData?.revenueData || []}
          title="Revenue Trend"
          color="#4CAF50"
        />
        
        <SimpleChart
          data={analyticsData?.orderData || []}
          title="Orders Trend"
          color="#2196F3"
        />
      </View>

      {/* Top Products */}
      <View style={styles.topProductsSection}>
        <Text style={styles.sectionTitle}>Top Performing Products</Text>
        {analyticsData?.topProducts && analyticsData.topProducts.length > 0 ? (
          <View style={styles.topProductsList}>
            {analyticsData.topProducts.slice(0, 5).map((product, index) => (
              <View key={index} style={styles.topProductItem}>
                <View style={styles.productRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productSales}>
                    {product.sales || 0} sales
                  </Text>
                </View>
                <View style={styles.productRevenue}>
                  <Text style={styles.revenueText}>
                    {formatCurrency(product.revenue || 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="package-variant" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No product data available</Text>
          </View>
        )}
      </View>

      {/* Category Performance */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Category Performance</Text>
        {analyticsData?.categoryData && analyticsData.categoryData.length > 0 ? (
          <View style={styles.categoryList}>
            {analyticsData.categoryData.slice(0, 5).map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categorySales}>
                    {category.sales || 0} products sold
                  </Text>
                </View>
                <View style={styles.categoryRevenue}>
                  <Text style={styles.categoryRevenueText}>
                    {formatCurrency(category.revenue || 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="shape-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No category data available</Text>
          </View>
        )}
      </View>

      {/* Export Section */}
      <View style={styles.exportSection}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => {
            // Implement export functionality
            Alert.alert('Export', 'Export functionality coming soon!');
          }}
        >
          <Icon name="download" size={20} color="#fff" />
          <Text style={styles.exportButtonText}>Export Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafd',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  dateRangeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateRangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: '#2874f0',
  },
  dateRangeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateRangeButtonTextActive: {
    color: '#fff',
  },
  metricsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  trendContainer: {
    marginTop: 4,
  },
  trendUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendDown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartsSection: {
    margin: 16,
    gap: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    padding: 32,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  topProductsSection: {
    margin: 16,
  },
  topProductsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2874f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  productSales: {
    fontSize: 12,
    color: '#666',
  },
  productRevenue: {
    alignItems: 'flex-end',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  categorySection: {
    margin: 16,
  },
  categoryList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categorySales: {
    fontSize: 12,
    color: '#666',
  },
  categoryRevenue: {
    alignItems: 'flex-end',
  },
  categoryRevenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2874f0',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
  },
  exportSection: {
    margin: 16,
    marginBottom: 32,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2874f0',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
}); 
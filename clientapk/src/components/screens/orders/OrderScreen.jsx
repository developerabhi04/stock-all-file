import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const INITIAL_ORDERS = [
    { id: 'o1', name: 'Infosys', ticker: 'INFY', type: 'BUY', qty: 8, price: 1450.75, status: 'COMPLETED', time: '10:30 AM', date: '08 Nov 2025', totalAmount: 11606 },
    { id: 'o2', name: 'Wipro', ticker: 'WIPRO', type: 'SELL', qty: 12, price: 425.50, status: 'COMPLETED', time: '11:15 AM', date: '08 Nov 2025', totalAmount: 5106 },
    { id: 'o3', name: 'TCS', ticker: 'TCS', type: 'BUY', qty: 5, price: 3420.00, status: 'PENDING', time: '02:45 PM', date: '08 Nov 2025', totalAmount: 17100 },
    { id: 'o4', name: 'HDFC Bank', ticker: 'HDFCBANK', type: 'BUY', qty: 10, price: 1685.50, status: 'COMPLETED', time: '09:20 AM', date: '07 Nov 2025', totalAmount: 16855 },
    { id: 'o5', name: 'Reliance', ticker: 'RELIANCE', type: 'SELL', qty: 5, price: 2580.75, status: 'PENDING', time: '03:30 PM', date: '08 Nov 2025', totalAmount: 12903.75 },
    { id: 'o6', name: 'ITC', ticker: 'ITC', type: 'BUY', qty: 20, price: 418.75, status: 'COMPLETED', time: '01:15 PM', date: '06 Nov 2025', totalAmount: 8375 },
    { id: 'o7', name: 'Asian Paints', ticker: 'ASIANPAINT', type: 'BUY', qty: 3, price: 3205.50, status: 'PENDING', time: '04:15 PM', date: '08 Nov 2025', totalAmount: 9616.50 },
];

const OrdersScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCanceling, setIsCanceling] = useState(false);

    const filteredOrders = filterStatus === 'ALL'
        ? orders
        : orders.filter(order => order.status === filterStatus);

    const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;

    const handleCancelPress = (order) => {
        setSelectedOrder(order);
        setCancelModalVisible(true);
    };

    const handleCancelOrder = () => {
        setIsCanceling(true);

        setTimeout(() => {
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === selectedOrder.id
                        ? { ...order, status: 'CANCELLED' }
                        : order
                )
            );
            setIsCanceling(false);
            setCancelModalVisible(false);
            setSuccessModalVisible(true);

            setTimeout(() => {
                setSuccessModalVisible(false);
            }, 3000);
        }, 1500);
    };

    return (

        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Orders</Text>
                </View>
            </SafeAreaView>

            {/* Fixed Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                            onPress={() => setFilterStatus(status)}>
                            <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Scrollable Orders List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

                <View style={styles.ordersList}>
                    <Text style={styles.sectionTitle}>Recent Orders ({filteredOrders.length})</Text>

                    {filteredOrders.map((order) => (
                        <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.8}>
                            <View style={styles.orderHeader}>
                                <View style={styles.orderLeft}>
                                    <View style={styles.orderBadges}>
                                        <View style={[styles.orderTypeBadge, { backgroundColor: order.type === 'BUY' ? '#0D2B24' : '#2A1F0D' }]}>
                                            <Text style={[styles.orderTypeText, { color: order.type === 'BUY' ? '#00C896' : '#FF9800' }]}>
                                                {order.type}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.orderStatusBadge,
                                            {
                                                backgroundColor:
                                                    order.status === 'COMPLETED' ? '#0D2B24' :
                                                        order.status === 'PENDING' ? '#2A1F0D' :
                                                            order.status === 'CANCELLED' ? '#2A1F1F' : '#2A1F1F'
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.orderStatusText,
                                                {
                                                    color:
                                                        order.status === 'COMPLETED' ? '#00C896' :
                                                            order.status === 'PENDING' ? '#FF9800' :
                                                                order.status === 'CANCELLED' ? '#FF5252' : '#FF5252'
                                                }
                                            ]}>
                                                {order.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.orderName}>{order.name}</Text>
                                    <Text style={styles.orderTicker}>{order.ticker}</Text>
                                </View>
                                <View style={styles.orderRight}>
                                    <Text style={styles.orderPrice}>₹{order.price.toFixed(2)}</Text>
                                    <Text style={styles.orderQty}>{order.qty} qty</Text>
                                    <Text style={styles.orderTotal}>₹{order.totalAmount.toFixed(2)}</Text>
                                </View>
                            </View>

                            <View style={styles.orderDivider} />

                            <View style={styles.orderFooter}>
                                <View style={styles.orderTimeInfo}>
                                    <View style={styles.orderTimeContainer}>
                                        <Icon name="clock-outline" size={14} color="#999999" />
                                        <Text style={styles.orderTime}>{order.time}</Text>
                                    </View>
                                    <View style={styles.orderDateContainer}>
                                        <Icon name="calendar" size={14} color="#999999" />
                                        <Text style={styles.orderDate}>{order.date}</Text>
                                    </View>
                                </View>

                                {order.status === 'PENDING' && (
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => handleCancelPress(order)}
                                        activeOpacity={0.8}>
                                        <Icon name="close-circle-outline" size={16} color="#FF5252" />
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    {filteredOrders.length === 0 && (
                        <View style={styles.emptyState}>
                            <Icon name="clipboard-text-off-outline" size={64} color="#666666" />
                            <Text style={styles.emptyStateTitle}>No Orders Found</Text>
                            <Text style={styles.emptyStateText}>You don't have any {filterStatus.toLowerCase()} orders</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Cancel Order Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={cancelModalVisible}
                onRequestClose={() => !isCanceling && setCancelModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconContainer}>
                                <Icon name="alert-circle" size={48} color="#FF9800" />
                            </View>
                            <Text style={styles.modalTitle}>Cancel Order?</Text>
                            <Text style={styles.modalSubtitle}>
                                Are you sure you want to cancel this order?
                            </Text>
                        </View>

                        {selectedOrder && (
                            <View style={styles.modalOrderDetails}>
                                <View style={styles.modalOrderRow}>
                                    <Text style={styles.modalOrderLabel}>Stock</Text>
                                    <Text style={styles.modalOrderValue}>{selectedOrder.name}</Text>
                                </View>
                                <View style={styles.modalOrderRow}>
                                    <Text style={styles.modalOrderLabel}>Type</Text>
                                    <Text style={[styles.modalOrderValue, { color: selectedOrder.type === 'BUY' ? '#00C896' : '#FF9800' }]}>
                                        {selectedOrder.type}
                                    </Text>
                                </View>
                                <View style={styles.modalOrderRow}>
                                    <Text style={styles.modalOrderLabel}>Quantity</Text>
                                    <Text style={styles.modalOrderValue}>{selectedOrder.qty}</Text>
                                </View>
                                <View style={styles.modalOrderRow}>
                                    <Text style={styles.modalOrderLabel}>Price</Text>
                                    <Text style={styles.modalOrderValue}>₹{selectedOrder.price.toFixed(2)}</Text>
                                </View>
                                <View style={[styles.modalOrderRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.modalOrderLabel}>Total</Text>
                                    <Text style={[styles.modalOrderValue, { fontWeight: '800', color: '#00C896' }]}>
                                        ₹{selectedOrder.totalAmount.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setCancelModalVisible(false)}
                                disabled={isCanceling}
                                activeOpacity={0.8}>
                                <Text style={styles.modalCancelBtnText}>Keep Order</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, isCanceling && styles.modalConfirmBtnDisabled]}
                                onPress={handleCancelOrder}
                                disabled={isCanceling}
                                activeOpacity={0.8}>
                                {isCanceling ? (
                                    <>
                                        <Icon name="loading" size={18} color="#FFFFFF" />
                                        <Text style={styles.modalConfirmBtnText}>Cancelling...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="close-circle" size={18} color="#FFFFFF" />
                                        <Text style={styles.modalConfirmBtnText}>Yes, Cancel</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={successModalVisible}
                onRequestClose={() => setSuccessModalVisible(false)}>
                <View style={styles.successOverlay}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconContainer}>
                            <Icon name="check-circle" size={64} color="#00C896" />
                        </View>
                        <Text style={styles.successTitle}>Order Cancelled!</Text>
                        <Text style={styles.successMessage}>
                            Your order for {selectedOrder?.name} has been successfully cancelled.
                        </Text>
                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={() => setSuccessModalVisible(false)}
                            activeOpacity={0.8}>
                            <Text style={styles.successButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    safeAreaTop: { backgroundColor: '#000000' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

    // Filter
    filterContainer: {
        backgroundColor: '#000000',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    filterScroll: { paddingHorizontal: 16, gap: 8 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
    filterButtonActive: { backgroundColor: '#0D2B24', borderColor: '#00C896' },
    filterButtonText: { fontSize: 12, fontWeight: '700', color: '#999999' },
    filterButtonTextActive: { color: '#00C896' },

    // Orders
    ordersList: { marginHorizontal: 16, marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 14 },
    orderCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
    orderHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
    orderLeft: { flex: 1 },
    orderBadges: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    orderTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    orderTypeText: { fontSize: 10, fontWeight: '700' },
    orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    orderStatusText: { fontSize: 10, fontWeight: '700' },
    orderName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
    orderTicker: { fontSize: 11, color: '#999999' },
    orderRight: { alignItems: 'flex-end' },
    orderPrice: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
    orderQty: { fontSize: 11, color: '#999999', marginBottom: 2 },
    orderTotal: { fontSize: 12, fontWeight: '700', color: '#00C896' },
    orderDivider: { height: 1, backgroundColor: '#2A2A2A', marginBottom: 12 },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderTimeInfo: { flexDirection: 'row', gap: 12 },
    orderTimeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderTime: { fontSize: 11, color: '#999999', fontWeight: '600' },
    orderDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderDate: { fontSize: 11, color: '#999999', fontWeight: '600' },

    // Cancel Button
    cancelButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A1F1F', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: '#FF5252' },
    cancelButtonText: { fontSize: 12, fontWeight: '700', color: '#FF5252' },

    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyStateTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
    emptyStateText: { fontSize: 13, color: '#999999', textAlign: 'center' },

    // Cancel Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    modalContent: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#2A2A2A' },
    modalHeader: { alignItems: 'center', marginBottom: 24 },
    modalIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2A1F0D', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#FF9800' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: 0.3 },
    modalSubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', lineHeight: 20 },
    modalOrderDetails: { backgroundColor: '#0D0D0D', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A2A' },
    modalOrderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
    modalOrderLabel: { fontSize: 13, color: '#999999', fontWeight: '600' },
    modalOrderValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: { flex: 1, backgroundColor: '#2A2A2A', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3A' },
    modalCancelBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    modalConfirmBtn: { flex: 1, backgroundColor: '#FF5252', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    modalConfirmBtnDisabled: { backgroundColor: '#666666' },
    modalConfirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

    // Success Modal
    successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    successContent: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    successIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0D2B24', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 3, borderColor: '#00C896' },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, letterSpacing: 0.3 },
    successMessage: { fontSize: 14, color: '#999999', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    successButton: { backgroundColor: '#00C896', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
    successButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});

export default OrdersScreen;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QuickActions = ({ theme, navigation }) => {
    return (
        <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.8} onPress={() => navigation.navigate('Wallet')}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#0D2B24' }]}>
                    <Icon name="wallet" size={22} color="#00C896" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Wallet</Text>
                <Text style={[styles.actionValue, { color: theme.textSecondary }]}>Check Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.8} onPress={() => navigation.navigate('Recharge')}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#0D2B24' }]}>
                    <Icon name="plus-circle" size={22} color="#00C896" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Recharge</Text>
                <Text style={[styles.actionValue, { color: theme.textSecondary }]}>Add Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.8} onPress={() => navigation.navigate('Withdraw')}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#2A1F0D' }]}>
                    <Icon name="bank-transfer-out" size={22} color="#FF9800" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Withdraw</Text>
                <Text style={[styles.actionValue, { color: theme.textSecondary }]}>Cash Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    quickActionsContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, gap: 10 },
    actionCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
    actionIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    actionValue: { fontSize: 10 },
});

export default QuickActions;

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    Animated,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../../../../services/ApiService';

const WithdrawScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newBank, setNewBank] = useState({
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        accountType: 'Savings',
        isPrimary: false,
    });

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const successScaleAnim = useRef(new Animated.Value(0)).current;
    const checkmarkAnim = useRef(new Animated.Value(0)).current;
    const addBankAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
            fetchBankAccounts();
        }, [])
    );

    const fetchUserData = async () => {
        try {
            console.log('👤 Fetching user data...');
            const response = await ApiService.getUserProfile();

            if (response.success) {
                setUserData(response.data);
                console.log('✅ Wallet balance:', response.data.walletBalance);
            } else {
                Alert.alert('Error', 'Failed to load wallet balance');
            }
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            console.log('🏦 Fetching bank accounts...');
            const response = await ApiService.getBankAccounts();

            if (response.success) {
                const accounts = response.data.bankAccounts.map(account => ({
                    id: account._id,
                    bankName: account.bankName,
                    accountNumber: `****${account.accountNumber.slice(-4)}`,
                    fullAccountNumber: account.accountNumber,
                    accountHolderName: account.accountHolderName,
                    accountType: account.accountType,
                    ifscCode: account.ifscCode,
                    icon: 'bank',
                    isPrimary: account.isPrimary,
                    isVerified: account.isVerified,
                }));

                setBankAccounts(accounts);

                const primaryAccount = accounts.find(acc => acc.isPrimary);
                if (primaryAccount) {
                    setSelectedBank(primaryAccount);
                }

                console.log('✅ Bank accounts loaded:', accounts.length);
            }
        } catch (error) {
            console.error('❌ Error fetching bank accounts:', error);
        }
    };

    const openAddBankModal = () => {
        if (bankAccounts.length >= 3) {
            Alert.alert(
                'Maximum Limit Reached',
                'You can only add up to 3 bank accounts. Please delete an existing account to add a new one.',
                [{ text: 'OK' }]
            );
            return;
        }

        setNewBank({
            bankName: '',
            accountHolderName: '',
            accountNumber: '',
            ifscCode: '',
            accountType: 'Savings',
            isPrimary: bankAccounts.length === 0,
        });

        setShowAddBankModal(true);
        Animated.spring(addBankAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
    };

    const closeAddBankModal = () => {
        Animated.timing(addBankAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowAddBankModal(false));
    };

    const handleAddBankAccount = async () => {
        if (!newBank.bankName.trim()) {
            Alert.alert('Error', 'Please enter bank name');
            return;
        }
        if (!newBank.accountHolderName.trim()) {
            Alert.alert('Error', 'Please enter account holder name');
            return;
        }
        if (!newBank.accountNumber.trim() || newBank.accountNumber.length < 9) {
            Alert.alert('Error', 'Please enter valid account number (minimum 9 digits)');
            return;
        }
        if (!newBank.ifscCode.trim() || newBank.ifscCode.length !== 11) {
            Alert.alert('Error', 'Please enter valid IFSC code (11 characters)');
            return;
        }

        const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscPattern.test(newBank.ifscCode.toUpperCase())) {
            Alert.alert('Error', 'Invalid IFSC code format (e.g., HDFC0001234)');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('➕ Adding bank account...');
            const response = await ApiService.addBankAccount(newBank);

            if (response.success) {
                console.log('✅ Bank account added successfully');
                Alert.alert('Success', '🎉 Bank account added successfully!');
                closeAddBankModal();
                fetchBankAccounts();
            } else {
                Alert.alert('Error', response.message || 'Failed to add bank account');
            }
        } catch (error) {
            console.error('❌ Error adding bank account:', error);
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBankAccount = (accountId, bankName) => {
        Alert.alert(
            'Delete Bank Account',
            `Are you sure you want to delete ${bankName}?\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await ApiService.deleteBankAccount(accountId);
                            if (response.success) {
                                Alert.alert('Success', 'Bank account deleted successfully');
                                fetchBankAccounts();
                                if (selectedBank?.id === accountId) {
                                    setSelectedBank(null);
                                }
                            }
                        } catch (error) {
                            const errorMessage = error.response?.data?.message || 'Failed to delete account';
                            Alert.alert('Error', errorMessage);
                        }
                    },
                },
            ]
        );
    };

    const handleSetPrimary = async (accountId, bankName) => {
        try {
            const response = await ApiService.setPrimaryBankAccount(accountId);
            if (response.success) {
                Alert.alert('Success', `${bankName} set as primary account`);
                fetchBankAccounts();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update primary account');
        }
    };

    const handleNumberPress = (num) => {
        if (withdrawAmount.length < 10) {
            setWithdrawAmount(withdrawAmount + num);
        }
    };

    const handleBackspace = () => {
        setWithdrawAmount(withdrawAmount.slice(0, -1));
    };

    const handleDecimal = () => {
        if (!withdrawAmount.includes('.') && withdrawAmount.length > 0) {
            setWithdrawAmount(withdrawAmount + '.');
        }
    };

    const handleClear = () => {
        setWithdrawAmount('');
    };

    const handleMaxAmount = () => {
        const availableBalance = userData?.walletBalance || 0;
        setWithdrawAmount(availableBalance.toString());
    };

    const walletBalance = userData?.walletBalance || 0;
    const enteredAmount = parseFloat(withdrawAmount) || 0;
    const minimumWithdrawal = 100;
    const remainingBalance = walletBalance - enteredAmount;

    const isBelowMinimum = enteredAmount > 0 && enteredAmount < minimumWithdrawal;
    const exceedsBalance = enteredAmount > walletBalance;
    const canWithdraw = enteredAmount >= minimumWithdrawal && enteredAmount <= walletBalance && selectedBank !== null;

    const handleWithdraw = () => {
        if (canWithdraw) {
            setShowConfirmModal(true);
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        }
    };

    const handleConfirmWithdraw = async () => {
        setIsSubmitting(true);

        try {
            console.log('📤 Submitting withdrawal request...');

            const withdrawalData = {
                amount: enteredAmount,
                accountNumber: selectedBank.fullAccountNumber,
                ifscCode: selectedBank.ifscCode,
                accountHolderName: selectedBank.accountHolderName,
                bankName: selectedBank.bankName,
            };

            const response = await ApiService.withdrawMoney(enteredAmount, withdrawalData);

            if (response.success) {
                console.log('✅ Withdrawal request submitted successfully');

                const txnId = response.data.transaction._id ||
                    `WD${Date.now()}${Math.floor(Math.random() * 10000)}`;
                setTransactionId(txnId);

                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setShowConfirmModal(false);
                    setShowSuccessModal(true);

                    Animated.sequence([
                        Animated.spring(successScaleAnim, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 7,
                        }),
                        Animated.spring(checkmarkAnim, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 7,
                        }),
                    ]).start();
                });
            } else {
                Alert.alert('Withdrawal Failed', response.message || 'Unable to process withdrawal');
                closeConfirmModal();
            }
        } catch (error) {
            console.error('❌ Error submitting withdrawal:', error);
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
            Alert.alert('Error', errorMessage);
            closeConfirmModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeConfirmModal = () => {
        Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowConfirmModal(false));
    };

    const closeSuccessModal = () => {
        Animated.timing(successScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowSuccessModal(false);
            setWithdrawAmount('');
            navigation.goBack();
        });
    };

    const NumberButton = ({ value, onPress }) => (
        <TouchableOpacity
            style={styles.numButton}
            onPress={onPress}
            activeOpacity={0.7}>
            {typeof value === 'string' ? (
                <Text style={styles.numButtonText}>{value}</Text>
            ) : (
                value
            )}
        </TouchableOpacity>
    );

    

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Withdraw Money</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                <View style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                        <View style={styles.balanceIconContainer}>
                            <Icon name="wallet" size={24} color="#FF9800" />
                        </View>
                        <View style={styles.balanceInfo}>
                            <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
                            <Text style={styles.balanceValue}>
                                ₹{walletBalance.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </Text>
                        </View>
                    </View>

                    {isBelowMinimum && (
                        <View style={styles.errorContainer}>
                            <Icon name="alert-circle-outline" size={16} color="#FF5252" />
                            <Text style={styles.errorText}>
                                Minimum withdrawal is ₹{minimumWithdrawal}
                            </Text>
                        </View>
                    )}

                    {exceedsBalance && (
                        <View style={styles.errorContainer}>
                            <Icon name="alert-circle-outline" size={16} color="#FF5252" />
                            <Text style={styles.errorText}>
                                Insufficient balance. Available: ₹{walletBalance.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    {canWithdraw && (
                        <View style={styles.successContainer}>
                            <Icon name="check-circle-outline" size={16} color="#00C896" />
                            <Text style={styles.successText}>
                                Ready to withdraw • Balance after: ₹{remainingBalance.toFixed(2)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.amountSection}>
                    <View style={styles.amountSectionHeader}>
                        <Text style={styles.sectionTitle}>Enter Amount</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.maxButton}
                                onPress={handleMaxAmount}
                                activeOpacity={0.7}>
                                <Text style={styles.maxButtonText}>MAX</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClear}
                                activeOpacity={0.7}>
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[
                        styles.amountInputContainer,
                        isBelowMinimum && styles.amountInputError,
                        exceedsBalance && styles.amountInputError,
                        canWithdraw && styles.amountInputSuccess
                    ]}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <Text style={styles.amountInputText}>
                            {withdrawAmount || '0'}
                        </Text>
                    </View>

                    <View style={styles.amountHints}>
                        <View style={styles.amountHint}>
                            <Icon name="information-outline" size={14} color="#999999" />
                            <Text style={styles.amountHintText}>
                                Min: ₹{minimumWithdrawal}
                            </Text>
                        </View>
                        <View style={styles.amountHint}>
                            <Icon name="clock-outline" size={14} color="#999999" />
                            <Text style={styles.amountHintText}>
                                Processing: 1-3 days
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bankSection}>
                    <View style={styles.bankSectionHeader}>
                        <Text style={styles.sectionTitle}>Select Bank Account</Text>
                        <View style={styles.accountsCount}>
                            <Text style={styles.accountsCountText}>
                                {bankAccounts.length}/3
                            </Text>
                        </View>
                    </View>

                    {bankAccounts.length === 0 ? (
                        <View style={styles.emptyBankState}>
                            <Icon name="bank-off-outline" size={48} color="#666666" />
                            <Text style={styles.emptyBankTitle}>No bank accounts added</Text>
                            <Text style={styles.emptyBankText}>
                                Add your bank account to start withdrawing money
                            </Text>
                        </View>
                    ) : (
                        bankAccounts.map((bank) => (
                            <TouchableOpacity
                                key={bank.id}
                                style={[
                                    styles.bankCard,
                                    selectedBank?.id === bank.id && styles.bankCardSelected
                                ]}
                                onPress={() => setSelectedBank(bank)}
                                activeOpacity={0.8}>
                                <View style={styles.bankCardLeft}>
                                    <View style={[
                                        styles.bankIconContainer,
                                        selectedBank?.id === bank.id && styles.bankIconContainerSelected
                                    ]}>
                                        <Icon
                                            name={bank.icon}
                                            size={24}
                                            color={selectedBank?.id === bank.id ? '#FF9800' : '#999999'}
                                        />
                                    </View>
                                    <View style={styles.bankInfo}>
                                        <View style={styles.bankNameRow}>
                                            <Text style={styles.bankName}>{bank.bankName}</Text>
                                            {bank.isPrimary && (
                                                <View style={styles.primaryBadge}>
                                                    <Icon name="star" size={10} color="#FFD700" />
                                                    <Text style={styles.primaryBadgeText}>Primary</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.accountNumber}>
                                            {bank.accountNumber} • {bank.accountType}
                                        </Text>
                                        <Text style={styles.ifscCode}>IFSC: {bank.ifscCode}</Text>
                                    </View>
                                </View>
                                <View style={styles.bankCardActions}>
                                    {selectedBank?.id === bank.id && (
                                        <Icon name="check-circle" size={24} color="#FF9800" />
                                    )}
                                    {!bank.isPrimary && (
                                        <TouchableOpacity
                                            style={styles.setPrimaryButton}
                                            onPress={() => handleSetPrimary(bank.id, bank.bankName)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Icon name="star-outline" size={18} color="#FFD700" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.deleteBankButton}
                                        onPress={() => handleDeleteBankAccount(bank.id, bank.bankName)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Icon name="delete-outline" size={20} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}

                    <TouchableOpacity
                        style={[
                            styles.addBankButton,
                            bankAccounts.length >= 3 && styles.addBankButtonDisabled
                        ]}
                        onPress={openAddBankModal}
                        disabled={bankAccounts.length >= 3}
                        activeOpacity={0.8}>
                        <Icon
                            name="plus-circle-outline"
                            size={20}
                            color={bankAccounts.length >= 3 ? '#666666' : '#00C896'}
                        />
                        <Text style={[
                            styles.addBankButtonText,
                            bankAccounts.length >= 3 && styles.addBankButtonTextDisabled
                        ]}>
                            {bankAccounts.length >= 3
                                ? 'Maximum 3 Accounts Reached'
                                : 'Add New Bank Account'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {enteredAmount > 0 && (
                    <View style={styles.summarySection}>
                        <Text style={styles.sectionTitle}>Withdrawal Summary</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
                                <Text style={styles.summaryValue}>₹{enteredAmount.toFixed(2)}</Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabelBold}>You'll Receive</Text>
                                <Text style={[styles.summaryValueBold, { color: '#00C896' }]}>
                                    ₹{enteredAmount.toFixed(2)}
                                </Text>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Remaining Balance</Text>
                                <Text style={styles.summaryValue}>
                                    ₹{remainingBalance.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <Icon name="clock-outline" size={16} color="#FF9800" />
                            <Text style={styles.infoText}>
                                Funds will be credited within 1-3 business days after approval
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.withdrawButton,
                            !canWithdraw && styles.disabledButton
                        ]}
                        activeOpacity={canWithdraw ? 0.8 : 1}
                        disabled={!canWithdraw}
                        onPress={handleWithdraw}>
                        <Icon
                            name={canWithdraw ? "bank-transfer-out" : "alert-circle-outline"}
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={[
                            styles.withdrawButtonText,
                            !canWithdraw && styles.disabledButtonText
                        ]}>
                            {isBelowMinimum
                                ? `Min ₹${minimumWithdrawal}`
                                : exceedsBalance
                                    ? 'Insufficient Balance'
                                    : !selectedBank
                                        ? 'Select Bank Account'
                                        : canWithdraw
                                            ? 'Confirm Withdrawal'
                                            : 'Enter Amount'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.numberPad}>
                        <View style={styles.numberRow}>
                            <NumberButton value="1" onPress={() => handleNumberPress('1')} />
                            <NumberButton value="2" onPress={() => handleNumberPress('2')} />
                            <NumberButton value="3" onPress={() => handleNumberPress('3')} />
                        </View>

                        <View style={styles.numberRow}>
                            <NumberButton value="4" onPress={() => handleNumberPress('4')} />
                            <NumberButton value="5" onPress={() => handleNumberPress('5')} />
                            <NumberButton value="6" onPress={() => handleNumberPress('6')} />
                        </View>

                        <View style={styles.numberRow}>
                            <NumberButton value="7" onPress={() => handleNumberPress('7')} />
                            <NumberButton value="8" onPress={() => handleNumberPress('8')} />
                            <NumberButton value="9" onPress={() => handleNumberPress('9')} />
                        </View>

                        <View style={styles.numberRow}>
                            <NumberButton value="." onPress={handleDecimal} />
                            <NumberButton value="0" onPress={() => handleNumberPress('0')} />
                            <NumberButton
                                value={<Icon name="backspace-outline" size={24} color="#FFFFFF" />}
                                onPress={handleBackspace}
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            <Modal
                visible={showAddBankModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeAddBankModal}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeAddBankModal}
                    />
                    <Animated.View
                        style={[
                            styles.addBankModalContent,
                            {
                                transform: [
                                    {
                                        scale: addBankAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1]
                                        })
                                    }
                                ],
                                opacity: addBankAnim
                            }
                        ]}>
                        <View style={styles.addBankModalHeader}>
                            <Text style={styles.addBankModalTitle}>Add Bank Account</Text>
                            <TouchableOpacity
                                onPress={closeAddBankModal}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Icon name="close" size={24} color="#999999" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.addBankForm}
                            showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Bank Name *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="e.g., HDFC Bank"
                                    placeholderTextColor="#666666"
                                    value={newBank.bankName}
                                    onChangeText={(text) => setNewBank({ ...newBank, bankName: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Account Holder Name *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="As per bank records"
                                    placeholderTextColor="#666666"
                                    value={newBank.accountHolderName}
                                    onChangeText={(text) => setNewBank({ ...newBank, accountHolderName: text })}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Account Number *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Enter account number"
                                    placeholderTextColor="#666666"
                                    value={newBank.accountNumber}
                                    onChangeText={(text) => setNewBank({ ...newBank, accountNumber: text.replace(/[^0-9]/g, '') })}
                                    keyboardType="number-pad"
                                    maxLength={18}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>IFSC Code *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="e.g., HDFC0001234"
                                    placeholderTextColor="#666666"
                                    value={newBank.ifscCode}
                                    onChangeText={(text) => setNewBank({ ...newBank, ifscCode: text.toUpperCase() })}
                                    autoCapitalize="characters"
                                    maxLength={11}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Account Type</Text>
                                <View style={styles.accountTypeRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.accountTypeButton,
                                            newBank.accountType === 'Savings' && styles.accountTypeButtonActive
                                        ]}
                                        onPress={() => setNewBank({ ...newBank, accountType: 'Savings' })}
                                        activeOpacity={0.7}>
                                        <Text style={[
                                            styles.accountTypeText,
                                            newBank.accountType === 'Savings' && styles.accountTypeTextActive
                                        ]}>
                                            Savings
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.accountTypeButton,
                                            newBank.accountType === 'Current' && styles.accountTypeButtonActive
                                        ]}
                                        onPress={() => setNewBank({ ...newBank, accountType: 'Current' })}
                                        activeOpacity={0.7}>
                                        <Text style={[
                                            styles.accountTypeText,
                                            newBank.accountType === 'Current' && styles.accountTypeTextActive
                                        ]}>
                                            Current
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {bankAccounts.length > 0 && (
                                <TouchableOpacity
                                    style={styles.primaryCheckbox}
                                    onPress={() => setNewBank({ ...newBank, isPrimary: !newBank.isPrimary })}
                                    activeOpacity={0.8}>
                                    <View style={[
                                        styles.checkbox,
                                        newBank.isPrimary && styles.checkboxActive
                                    ]}>
                                        {newBank.isPrimary && (
                                            <Icon name="check" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                    <Text style={styles.primaryCheckboxText}>
                                        Set as primary account
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.infoNote}>
                                <Icon name="information-outline" size={16} color="#FF9800" />
                                <Text style={styles.infoNoteText}>
                                    Please ensure your bank details are correct. Incorrect details may delay your withdrawal.
                                </Text>
                            </View>
                        </ScrollView>

                        <View style={styles.addBankModalButtons}>
                            <TouchableOpacity
                                style={styles.addBankCancelButton}
                                onPress={closeAddBankModal}
                                disabled={isSubmitting}
                                activeOpacity={0.8}>
                                <Text style={styles.addBankCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.addBankConfirmButton,
                                    isSubmitting && styles.disabledButton
                                ]}
                                onPress={handleAddBankAccount}
                                disabled={isSubmitting}
                                activeOpacity={0.8}>
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Icon name="check-circle" size={20} color="#FFFFFF" />
                                        <Text style={styles.addBankConfirmText}>Add Account</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeConfirmModal}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeConfirmModal}
                    />
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: scaleAnim
                            }
                        ]}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="bank-transfer-out" size={48} color="#FF9800" />
                        </View>

                        <Text style={styles.modalTitle}>Confirm Withdrawal</Text>
                        <Text style={styles.modalSubtitle}>
                            Please review your withdrawal details
                        </Text>

                        <View style={styles.confirmCard}>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Amount</Text>
                                <Text style={styles.confirmValue}>₹{enteredAmount.toFixed(2)}</Text>
                            </View>

                            <View style={styles.confirmDivider} />

                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Bank</Text>
                                <Text style={styles.confirmValue}>{selectedBank?.bankName}</Text>
                            </View>

                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Account</Text>
                                <Text style={styles.confirmValue}>{selectedBank?.accountNumber}</Text>
                            </View>

                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>IFSC</Text>
                                <Text style={styles.confirmValue}>{selectedBank?.ifscCode}</Text>
                            </View>

                            <View style={styles.confirmDivider} />

                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabelBold}>New Balance</Text>
                                <Text style={styles.confirmValueBold}>
                                    ₹{remainingBalance.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.warningNote}>
                            <Icon name="alert-circle-outline" size={18} color="#FF9800" />
                            <Text style={styles.warningText}>
                                Processing time: 1-3 business days after admin approval
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={closeConfirmModal}
                                disabled={isSubmitting}
                                activeOpacity={0.8}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    isSubmitting && styles.disabledButton
                                ]}
                                onPress={handleConfirmWithdraw}
                                disabled={isSubmitting}
                                activeOpacity={0.8}>
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Icon name="check-circle" size={20} color="#FFFFFF" />
                                        <Text style={styles.confirmButtonText}>Confirm</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeSuccessModal}>
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.successModalContent,
                            {
                                transform: [{ scale: successScaleAnim }],
                                opacity: successScaleAnim
                            }
                        ]}>
                        <Animated.View
                            style={[
                                styles.successIconContainer,
                                {
                                    transform: [{ scale: checkmarkAnim }],
                                }
                            ]}>
                            <Icon name="check-circle" size={80} color="#00C896" />
                        </Animated.View>

                        <Text style={styles.successTitle}>Withdrawal Request Submitted!</Text>
                        <Text style={styles.successSubtitle}>
                            Your withdrawal request has been received and is pending admin approval
                        </Text>

                        <View style={styles.successCard}>
                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>Transaction ID</Text>
                                <Text style={styles.successValue}>{transactionId}</Text>
                            </View>

                            <View style={styles.successDivider} />

                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>Amount</Text>
                                <Text style={[styles.successValue, { color: '#00C896', fontWeight: '700' }]}>
                                    ₹{enteredAmount.toFixed(2)}
                                </Text>
                            </View>

                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>Bank</Text>
                                <Text style={styles.successValue}>{selectedBank?.bankName}</Text>
                            </View>

                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>Status</Text>
                                <View style={styles.statusBadge}>
                                    <Icon name="clock-outline" size={12} color="#FF9800" />
                                    <Text style={styles.statusText}>Pending Approval</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.timelineInfo}>
                            <View style={styles.timelineStep}>
                                <View style={[styles.timelineDot, { backgroundColor: '#00C896' }]} />
                                <Text style={styles.timelineText}>Request submitted</Text>
                            </View>
                            <View style={styles.timelineLine} />
                            <View style={styles.timelineStep}>
                                <View style={[styles.timelineDot, { backgroundColor: '#FF9800' }]} />
                                <Text style={styles.timelineText}>Admin approval (pending)</Text>
                            </View>
                            <View style={styles.timelineLine} />
                            <View style={styles.timelineStep}>
                                <View style={styles.timelineDot} />
                                <Text style={styles.timelineText}>Money transfer (1-3 days)</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={closeSuccessModal}
                            activeOpacity={0.8}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#999999',
        fontWeight: '600',
    },
    safeAreaTop: {
        backgroundColor: '#000000',
    },
    safeAreaBottom: {
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000000',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    balanceCard: {
        margin: 16,
        padding: 16,
        backgroundColor: '#111111',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 13,
        color: '#999999',
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    errorContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 82, 82, 0.12)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        marginLeft: 8,
        color: '#FF5252',
        fontSize: 13,
        flex: 1,
    },
    successContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 200, 150, 0.12)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    successText: {
        marginLeft: 8,
        color: '#00C896',
        fontSize: 13,
        flex: 1,
    },
    amountSection: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#111111',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    amountSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerActions: {
        flexDirection: 'row',
    },
    maxButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        borderRadius: 10,
        marginRight: 8,
    },
    maxButtonText: {
        color: '#FF9800',
        fontWeight: '700',
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
    },
    clearButtonText: {
        color: '#999999',
        fontWeight: '700',
    },
    amountInputContainer: {
        minHeight: 72,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#0A0A0A',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    amountInputError: {
        borderColor: '#FF5252',
    },
    amountInputSuccess: {
        borderColor: '#00C896',
    },
    currencySymbol: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '700',
        marginRight: 8,
    },
    amountInputText: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    amountHints: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    amountHint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountHintText: {
        marginLeft: 6,
        color: '#999999',
        fontSize: 12,
    },
    bankSection: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#111111',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    bankSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    accountsCount: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    accountsCountText: {
        color: '#999999',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyBankState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyBankTitle: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    emptyBankText: {
        marginTop: 6,
        color: '#999999',
        textAlign: 'center',
        fontSize: 13,
    },
    bankCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 14,
        marginBottom: 10,
    },
    bankCardSelected: {
        borderColor: '#FF9800',
    },
    bankCardLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    bankIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bankIconContainerSelected: {
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
    },
    bankInfo: {
        flex: 1,
    },
    bankNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    bankName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginRight: 8,
    },
    primaryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    primaryBadgeText: {
        marginLeft: 4,
        fontSize: 11,
        color: '#FFD700',
        fontWeight: '700',
    },
    accountNumber: {
        fontSize: 13,
        color: '#BBBBBB',
        marginBottom: 2,
    },
    ifscCode: {
        fontSize: 12,
        color: '#888888',
    },
    bankCardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    setPrimaryButton: {
        marginLeft: 10,
    },
    deleteBankButton: {
        marginLeft: 12,
    },
    addBankButton: {
        marginTop: 8,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#00C896',
        backgroundColor: 'rgba(0, 200, 150, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    addBankButtonDisabled: {
        borderColor: '#333333',
        backgroundColor: '#1A1A1A',
    },
    addBankButtonText: {
        marginLeft: 8,
        color: '#00C896',
        fontWeight: '700',
    },
    addBankButtonTextDisabled: {
        color: '#666666',
    },
    summarySection: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    summaryCard: {
        marginTop: 12,
        padding: 16,
        backgroundColor: '#111111',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryLabel: {
        color: '#999999',
        fontSize: 14,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    summaryLabelBold: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    summaryValueBold: {
        fontSize: 15,
        fontWeight: '700',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#222222',
        marginVertical: 10,
    },
    infoCard: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 8,
        color: '#FFB74D',
        fontSize: 12,
        flex: 1,
    },
    bottomSection: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#111111',
    },
    withdrawButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 14,
    },
    disabledButton: {
        opacity: 0.5,
    },
    withdrawButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    disabledButtonText: {
        color: '#FFFFFF',
    },
    numberPad: {
        paddingBottom: 4,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    numButton: {
        width: '30%',
        height: 56,
        borderRadius: 14,
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222222',
    },
    numButtonText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    addBankModalContent: {
        width: '100%',
        maxHeight: '88%',
        backgroundColor: '#111111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222222',
        overflow: 'hidden',
    },
    addBankModalHeader: {
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addBankModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    addBankForm: {
        paddingHorizontal: 18,
        paddingTop: 14,
    },
    formGroup: {
        marginBottom: 14,
    },
    formLabel: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    formInput: {
        height: 50,
        borderRadius: 12,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        paddingHorizontal: 14,
        color: '#FFFFFF',
    },
    accountTypeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    accountTypeButton: {
        width: '48.5%',
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountTypeButtonActive: {
        borderColor: '#00C896',
        backgroundColor: 'rgba(0, 200, 150, 0.12)',
    },
    accountTypeText: {
        color: '#AAAAAA',
        fontWeight: '600',
    },
    accountTypeTextActive: {
        color: '#00C896',
    },
    primaryCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#666666',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxActive: {
        backgroundColor: '#00C896',
        borderColor: '#00C896',
    },
    primaryCheckboxText: {
        color: '#FFFFFF',
        fontSize: 13,
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 152, 0, 0.08)',
        marginBottom: 16,
    },
    infoNoteText: {
        marginLeft: 8,
        color: '#FFB74D',
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
    addBankModalButtons: {
        flexDirection: 'row',
        padding: 18,
        borderTopWidth: 1,
        borderTopColor: '#222222',
    },
    addBankCancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    addBankCancelText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    addBankConfirmButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#00C896',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        flexDirection: 'row',
    },
    addBankConfirmText: {
        color: '#FFFFFF',
        fontWeight: '700',
        marginLeft: 8,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#111111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 20,
    },
    modalIconContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalSubtitle: {
        textAlign: 'center',
        color: '#999999',
        fontSize: 13,
        marginTop: 8,
        marginBottom: 16,
    },
    confirmCard: {
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#222222',
    },
    confirmRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    confirmLabel: {
        color: '#999999',
        fontSize: 14,
    },
    confirmValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    confirmLabelBold: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    confirmValueBold: {
        color: '#00C896',
        fontWeight: '700',
        fontSize: 15,
    },
    confirmDivider: {
        height: 1,
        backgroundColor: '#222222',
        marginVertical: 8,
    },
    warningNote: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 152, 0, 0.08)',
    },
    warningText: {
        marginLeft: 8,
        color: '#FFB74D',
        fontSize: 12,
        flex: 1,
    },
    modalButtons: {
        flexDirection: 'row',
    },
    cancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    confirmButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        flexDirection: 'row',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        marginLeft: 8,
    },
    successModalContent: {
        width: '100%',
        backgroundColor: '#111111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 22,
        alignItems: 'center',
    },
    successIconContainer: {
        marginBottom: 12,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    successSubtitle: {
        marginTop: 8,
        color: '#999999',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
    },
    successCard: {
        width: '100%',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#222222',
        marginBottom: 16,
    },
    successRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    successLabel: {
        color: '#999999',
        fontSize: 14,
    },
    successValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    successDivider: {
        height: 1,
        backgroundColor: '#222222',
        marginVertical: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusText: {
        marginLeft: 5,
        color: '#FF9800',
        fontSize: 12,
        fontWeight: '700',
    },
    timelineInfo: {
        width: '100%',
        marginBottom: 18,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#444444',
        marginRight: 10,
    },
    timelineLine: {
        width: 2,
        height: 18,
        backgroundColor: '#333333',
        marginLeft: 4,
        marginVertical: 4,
    },
    timelineText: {
        color: '#BBBBBB',
        fontSize: 13,
    },
    doneButton: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        backgroundColor: '#00C896',
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default WithdrawScreen;
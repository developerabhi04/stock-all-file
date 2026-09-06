import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AccountSettingsScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [panCard, setPanCard] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        account: false,
        confirmAccount: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const validatePAN = (pan) => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    };

    const validateIFSC = (ifsc) => {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return ifscRegex.test(ifsc);
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };

    const handleSubmit = () => {
        const newErrors = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!panCard.trim()) {
            newErrors.panCard = 'PAN card number is required';
        } else if (!validatePAN(panCard.toUpperCase())) {
            newErrors.panCard = 'Invalid PAN card format (e.g., ABCDE1234F)';
        }

        if (!accountNumber.trim()) {
            newErrors.accountNumber = 'Account number is required';
        } else if (accountNumber.length < 9 || accountNumber.length > 18) {
            newErrors.accountNumber = 'Account number must be 9-18 digits';
        }

        if (!confirmAccountNumber.trim()) {
            newErrors.confirmAccountNumber = 'Please confirm account number';
        } else if (accountNumber !== confirmAccountNumber) {
            newErrors.confirmAccountNumber = 'Account numbers do not match';
        }

        if (!ifscCode.trim()) {
            newErrors.ifscCode = 'IFSC code is required';
        } else if (!validateIFSC(ifscCode.toUpperCase())) {
            newErrors.ifscCode = 'Invalid IFSC code format';
        }

        if (!bankName.trim()) {
            newErrors.bankName = 'Bank name is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            setTimeout(() => {
                setIsSubmitting(false);
                Alert.alert(
                    '✅ Success',
                    'Account details saved successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }, 1500);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                    <View style={styles.backButton} />
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroIcon}>
                        <Icon name="security" size={48} color="#00C896" />
                    </View>
                    <Text style={styles.heroTitle}>Secure Your Account</Text>
                    <Text style={styles.heroSubtitle}>
                        Add your banking details to enable seamless withdrawals
                    </Text>
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '60%' }]} />
                </View>
                <Text style={styles.progressText}>3 of 5 sections completed</Text>

                {/* Personal Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Icon name="account-circle" size={22} color="#00C896" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                            <Text style={styles.sectionSubtitle}>Your identity information</Text>
                        </View>
                    </View>

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={[styles.inputContainer, errors.fullName && styles.inputErrorContainer]}>
                            <Icon name="account" size={20} color="#00C896" />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#666666"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                            {fullName.length > 0 && (
                                <Icon name="check-circle" size={20} color="#00C896" />
                            )}
                        </View>
                        {errors.fullName && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{errors.fullName}</Text>
                            </View>
                        )}
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Date of Birth</Text>
                        <TouchableOpacity
                            style={[styles.inputContainer, styles.dateContainer]}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.8}>
                            <Icon name="calendar" size={20} color="#00C896" />
                            <Text style={styles.dateText}>{formatDate(dateOfBirth)}</Text>
                            <Icon name="chevron-down" size={20} color="#666666" />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateOfBirth}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* PAN Card */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>PAN Card Number</Text>
                        <View style={[styles.inputContainer, errors.panCard && styles.inputErrorContainer]}>
                            <Icon name="card-account-details" size={20} color="#2196F3" />
                            <TextInput
                                style={styles.input}
                                placeholder="ABCDE1234F"
                                placeholderTextColor="#666666"
                                value={panCard}
                                onChangeText={(text) => setPanCard(text.toUpperCase())}
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                            {panCard.length === 10 && validatePAN(panCard) && (
                                <Icon name="check-circle" size={20} color="#00C896" />
                            )}
                        </View>
                        {errors.panCard ? (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{errors.panCard}</Text>
                            </View>
                        ) : (
                            <Text style={styles.helperText}>10-digit PAN card (e.g., ABCDE1234F)</Text>
                        )}
                    </View>
                </View>

                {/* Bank Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Icon name="bank" size={22} color="#FF9800" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Bank Details</Text>
                            <Text style={styles.sectionSubtitle}>Your banking information</Text>
                        </View>
                    </View>

                    {/* Bank Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Bank Name</Text>
                        <View style={[styles.inputContainer, errors.bankName && styles.inputErrorContainer]}>
                            <Icon name="bank" size={20} color="#FF9800" />
                            <TextInput
                                style={styles.input}
                                placeholder="HDFC Bank"
                                placeholderTextColor="#666666"
                                value={bankName}
                                onChangeText={setBankName}
                                autoCapitalize="words"
                            />
                            {bankName.length > 0 && (
                                <Icon name="check-circle" size={20} color="#00C896" />
                            )}
                        </View>
                        {errors.bankName && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{errors.bankName}</Text>
                            </View>
                        )}
                    </View>

                    {/* Account Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Account Number</Text>
                        <View style={[styles.inputContainer, errors.accountNumber && styles.inputErrorContainer]}>
                            <Icon name="credit-card" size={20} color="#9C27B0" />
                            <TextInput
                                style={styles.input}
                                placeholder="123456789..."
                                placeholderTextColor="#666666"
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                                keyboardType="number-pad"
                                maxLength={18}
                                secureTextEntry={!showPassword.account}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword({
                                    ...showPassword,
                                    account: !showPassword.account
                                })}
                                activeOpacity={0.7}>
                                <Icon
                                    name={showPassword.account ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#666666"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.accountNumber && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{errors.accountNumber}</Text>
                            </View>
                        )}
                    </View>

                    {/* Confirm Account Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm Account Number</Text>
                        <View style={[styles.inputContainer, errors.confirmAccountNumber && styles.inputErrorContainer]}>
                            <Icon name="credit-card-check" size={20} color="#9C27B0" />
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter account number"
                                placeholderTextColor="#666666"
                                value={confirmAccountNumber}
                                onChangeText={setConfirmAccountNumber}
                                keyboardType="number-pad"
                                maxLength={18}
                                secureTextEntry={!showPassword.confirmAccount}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword({
                                    ...showPassword,
                                    confirmAccount: !showPassword.confirmAccount
                                })}
                                activeOpacity={0.7}>
                                <Icon
                                    name={showPassword.confirmAccount ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#666666"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmAccountNumber && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{errors.confirmAccountNumber}</Text>
                            </View>
                        )}
                    </View>

                    {/* IFSC Code */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>IFSC Code</Text>
                        <View style={[styles.inputContainer, errors.ifscCode && styles.inputErrorContainer]}>
                            <Icon name="map-marker" size={20} color="#F44336" />
                            <TextInput
                                style={styles.input}
                                placeholder="SBIN0001234"
                                placeholderTextColor="#666666"
                                value={ifscCode}
                                onChangeText={(text) => setIfscCode(text.toUpperCase())}
                                autoCapitalize="characters"
                                maxLength={11}
                            />
                            {ifscCode.length === 11 && validateIFSC(ifscCode) && (
                                <Icon name="check-circle" size={20} color="#00C896" />
                            )}
                        </View>
                        {errors.ifscCode ? (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{errors.ifscCode}</Text>
                            </View>
                        ) : (
                            <Text style={styles.helperText}>Find on cheque book or bank website</Text>
                        )}
                    </View>
                </View>

                {/* Security Tips */}
                <View style={styles.tipsSection}>
                    <View style={styles.tipItem}>
                        <Icon name="shield-check" size={20} color="#00C896" />
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Bank-Grade Security</Text>
                            <Text style={styles.tipText}>Your data is encrypted with 256-bit SSL</Text>
                        </View>
                    </View>
                    <View style={styles.tipItem}>
                        <Icon name="lock" size={20} color="#2196F3" />
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Privacy Protected</Text>
                            <Text style={styles.tipText}>Never shared with third parties</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Save Button */}
            <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        activeOpacity={0.8}>
                        {isSubmitting ? (
                            <>
                                <Icon name="loading" size={20} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>Saving...</Text>
                            </>
                        ) : (
                            <>
                                <Icon name="check-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>Save Details</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },

    safeArea: {
        backgroundColor: '#000000',
    },

    header: {
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 20,
    },

    heroIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#0D2B24',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#00C896',
    },

    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.3,
    },

    heroSubtitle: {
        fontSize: 13,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },

    // Progress Bar
    progressBar: {
        height: 4,
        backgroundColor: '#1A1A1A',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#00C896',
        borderRadius: 2,
    },

    progressText: {
        fontSize: 12,
        color: '#999999',
        marginBottom: 20,
    },

    // Section
    section: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },

    sectionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0D2B24',
        alignItems: 'center',
        justifyContent: 'center',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    sectionSubtitle: {
        fontSize: 12,
        color: '#999999',
        marginTop: 2,
    },

    // Input Group
    inputGroup: {
        marginBottom: 18,
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        gap: 10,
    },

    inputErrorContainer: {
        borderColor: '#FF5252',
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
        padding: 0,
    },

    dateContainer: {
        justifyContent: 'space-between',
    },

    dateText: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
    },

    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },

    errorText: {
        fontSize: 12,
        color: '#FF5252',
        fontWeight: '500',
    },

    helperText: {
        fontSize: 12,
        color: '#666666',
        marginTop: 6,
    },

    // Tips Section
    tipsSection: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        gap: 12,
    },

    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },

    tipContent: {
        flex: 1,
    },

    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },

    tipText: {
        fontSize: 12,
        color: '#999999',
    },

    // Bottom Button
    bottomSafeArea: {
        backgroundColor: '#000000',
    },

    bottomContainer: {
        backgroundColor: '#000000',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
    },

    saveButton: {
        backgroundColor: '#00C896',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    saveButtonDisabled: {
        backgroundColor: '#2A2A2A',
    },

    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});

export default AccountSettingsScreen;

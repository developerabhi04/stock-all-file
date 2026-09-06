import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../../constants/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PrivacySecurityScreen = ({ navigation }) => {
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy & Security</Text>
                    <View style={styles.headerRight} />
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* Authentication */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Authentication</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Biometric Login</Text>
                            <Text style={styles.settingDescription}>Use fingerprint or face ID</Text>
                        </View>
                        <Switch
                            value={biometricEnabled}
                            onValueChange={setBiometricEnabled}
                            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                            thumbColor={biometricEnabled ? COLORS.primary : COLORS.textLight}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>PIN Lock</Text>
                            <Text style={styles.settingDescription}>Secure app with 4-digit PIN</Text>
                        </View>
                        <Switch
                            value={pinEnabled}
                            onValueChange={setPinEnabled}
                            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                            thumbColor={pinEnabled ? COLORS.primary : COLORS.textLight}
                        />
                    </View>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Change Password</Text>
                            <Text style={styles.settingDescription}>Update your account password</Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                            <Text style={styles.settingDescription}>Extra security layer</Text>
                        </View>
                        <Switch
                            value={twoFactorEnabled}
                            onValueChange={setTwoFactorEnabled}
                            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                            thumbColor={twoFactorEnabled ? COLORS.primary : COLORS.textLight}
                        />
                    </View>
                </View>

                {/* Additional Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Settings</Text>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Login History</Text>
                            <Text style={styles.settingDescription}>View recent login activity</Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Connected Devices</Text>
                            <Text style={styles.settingDescription}>Manage authorized devices</Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                            <Text style={styles.settingDescription}>Read our privacy policy</Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Delete Account */}
                <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => Alert.alert(
                        'Delete Account',
                        'Are you sure? This action cannot be undone.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive' }
                        ]
                    )}>
                    <Icon name="delete" size={20} color={COLORS.error} />
                    <Text style={styles.dangerButtonText}>Delete Account</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    safeArea: {
        backgroundColor: COLORS.surface,
    },

    header: {
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        color: COLORS.text,
    },

    headerRight: {
        width: 40,
    },

    content: {
        padding: 16,
        paddingBottom: 32,
    },

    section: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
    },

    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    settingInfo: {
        flex: 1,
        marginRight: 12,
    },

    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },

    settingDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },

    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.errorLight,
        padding: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.error,
    },

    dangerButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.error,
    },
});

export default PrivacySecurityScreen;

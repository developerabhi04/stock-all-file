import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Alert,
    Image,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../services/ApiService';
import AuthStorage from '../../../../services/AuthStorage';

const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/120';

const EditProfileScreen = ({ navigation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        location: '',
        occupation: '',
        profileImage: DEFAULT_PROFILE_IMAGE,
        createdAt: '',
        isActive: true,
    });

    const [tempProfile, setTempProfile] = useState(profile);

    const spinnerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let spinLoop;

        if (loading || isSaving) {
            spinnerAnim.setValue(0);
            spinLoop = Animated.loop(
                Animated.timing(spinnerAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            spinLoop.start();
        }

        return () => {
            if (spinLoop) {
                spinLoop.stop();
            }
        };
    }, [loading, isSaving, spinnerAnim]);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            setLoading(true);
            console.log('👤 Fetching edit profile data...');
            const response = await ApiService.getUserProfile();

            if (response.success && response.data) {
                const user = response.data;

                const profileData = {
                    fullName: user.fullName || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    bio: user.bio || '',
                    location: user.location || '',
                    occupation: user.occupation || '',
                    profileImage: user.profileImage || DEFAULT_PROFILE_IMAGE,
                    createdAt: user.createdAt || '',
                    isActive: user.isActive !== false,
                };

                setProfile(profileData);
                setTempProfile(profileData);
                console.log('✅ Edit profile data fetched:', profileData);
            } else {
                const cachedUser = await AuthStorage.getUser();
                if (cachedUser) {
                    const profileData = {
                        fullName: cachedUser.fullName || '',
                        email: cachedUser.email || '',
                        phoneNumber: cachedUser.phoneNumber || '',
                        bio: cachedUser.bio || '',
                        location: cachedUser.location || '',
                        occupation: cachedUser.occupation || '',
                        profileImage: cachedUser.profileImage || DEFAULT_PROFILE_IMAGE,
                        createdAt: cachedUser.createdAt || '',
                        isActive: cachedUser.isActive !== false,
                    };

                    setProfile(profileData);
                    setTempProfile(profileData);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching edit profile data:', error);

            const cachedUser = await AuthStorage.getUser();
            if (cachedUser) {
                const profileData = {
                    fullName: cachedUser.fullName || '',
                    email: cachedUser.email || '',
                    phoneNumber: cachedUser.phoneNumber || '',
                    bio: cachedUser.bio || '',
                    location: cachedUser.location || '',
                    occupation: cachedUser.occupation || '',
                    profileImage: cachedUser.profileImage || DEFAULT_PROFILE_IMAGE,
                    createdAt: cachedUser.createdAt || '',
                    isActive: cachedUser.isActive !== false,
                };

                setProfile(profileData);
                setTempProfile(profileData);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tempProfile.fullName.trim()) {
            Alert.alert('Validation', 'Full name is required');
            return;
        }

        if (tempProfile.email && !tempProfile.email.includes('@')) {
            Alert.alert('Validation', 'Valid email is required');
            return;
        }

        setIsSaving(true);

        setTimeout(() => {
            setProfile(tempProfile);
            setIsEditing(false);
            setIsSaving(false);
            Alert.alert(
                'Info',
                'Profile UI updated locally. Backend profile update API is not connected yet.'
            );
        }, 1000);
    };

    const handleCancel = () => {
        setTempProfile(profile);
        setIsEditing(false);
    };

    const handleFieldChange = (field, value) => {
        setTempProfile((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const formatMonthYear = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'N/A';

        return date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
        });
    };

    const spinnerRotate = spinnerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const memberSince = formatMonthYear(profile.createdAt);
    const accountStatus = profile.isActive ? 'Active' : 'Inactive';



    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        disabled={isSaving}
                    >
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Edit Profile</Text>

                    {!isEditing ? (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => {
                                setTempProfile(profile);
                                setIsEditing(true);
                            }}
                        >
                            <Icon name="pencil" size={20} color="#00C896" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerRight} />
                    )}
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: tempProfile.profileImage || DEFAULT_PROFILE_IMAGE }}
                            style={styles.avatar}
                        />
                        {isEditing && (
                            <TouchableOpacity
                                style={styles.avatarEditButton}
                                onPress={() =>
                                    Alert.alert('Coming Soon', 'Profile image update is not connected yet.')
                                }
                            >
                                <Icon name="camera-plus" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.fullName}>
                        {isEditing ? tempProfile.fullName || 'User' : profile.fullName || 'User'}
                    </Text>

                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{accountStatus}</Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Icon name="calendar-check" size={24} color="#00C896" />
                        <Text style={styles.statLabel}>Member Since</Text>
                        <Text style={styles.statValue}>{memberSince}</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Icon name="check-circle" size={24} color="#2196F3" />
                        <Text style={styles.statLabel}>Account Status</Text>
                        <Text style={styles.statValue}>{accountStatus}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Icon name="account-circle" size={20} color="#00C896" />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="card-account-details" size={20} color="#00C896" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                placeholderTextColor="#666666"
                                value={isEditing ? tempProfile.fullName : profile.fullName}
                                onChangeText={(value) => handleFieldChange('fullName', value)}
                                editable={isEditing && !isSaving}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="phone" size={20} color="#FF9800" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                placeholderTextColor="#666666"
                                value={isEditing ? tempProfile.phoneNumber : profile.phoneNumber}
                                onChangeText={(value) => handleFieldChange('phoneNumber', value)}
                                editable={false}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

            </ScrollView>

            {isEditing && (
                <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                    <View style={styles.bottomButtonsContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            activeOpacity={0.8}
                            disabled={isSaving}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={isSaving}
                            activeOpacity={0.8}
                        >
                            {isSaving ? (
                                <Animated.View style={{ transform: [{ rotate: spinnerRotate }] }}>
                                    <Icon name="loading" size={20} color="#FFFFFF" />
                                </Animated.View>
                            ) : (
                                <>
                                    <Icon name="check-circle" size={20} color="#FFFFFF" />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            )}
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

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },

    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    editButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerRight: {
        width: 40,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: 100,
    },

    profileHeader: {
        alignItems: 'center',
        paddingVertical: 28,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
        marginBottom: 20,
    },

    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },

    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#00C896',
        backgroundColor: '#1A1A1A',
    },

    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#00C896',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#000000',
    },

    fullName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.3,
        textAlign: 'center',
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0D2B24',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#00C896',
        gap: 6,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00C896',
    },

    statusText: {
        fontSize: 12,
        color: '#00C896',
        fontWeight: '700',
    },

    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 12,
    },

    statCard: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },

    statLabel: {
        fontSize: 11,
        color: '#999999',
        marginTop: 6,
        marginBottom: 2,
        fontWeight: '600',
    },

    statValue: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
        textAlign: 'center',
    },

    section: {
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#1A1A1A',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    inputGroup: {
        marginBottom: 16,
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

    bioContainer: {
        alignItems: 'flex-start',
        paddingVertical: 10,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
        padding: 0,
    },

    bioInput: {
        paddingTop: 4,
        maxHeight: 80,
    },

    charCount: {
        fontSize: 11,
        color: '#666666',
        marginTop: 4,
        textAlign: 'right',
    },

    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0D0D0D',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },

    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },

    settingInfo: {
        flex: 1,
    },

    settingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },

    settingDesc: {
        fontSize: 12,
        color: '#999999',
    },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1F2A',
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A3F5A',
        marginBottom: 20,
        gap: 10,
    },

    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#B3D9FF',
        lineHeight: 16,
        fontWeight: '500',
    },

    safeAreaBottom: {
        backgroundColor: '#000000',
    },

    bottomButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
    },

    cancelButton: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },

    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    saveButton: {
        flex: 1,
        backgroundColor: '#00C896',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
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

export default EditProfileScreen;
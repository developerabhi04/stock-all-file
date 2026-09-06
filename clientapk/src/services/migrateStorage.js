import AsyncStorage from '@react-native-async-storage/async-storage';
import AppStorage from './AppStorage';

const TOKEN_KEY = '@tradehub_token';
const USER_KEY = '@tradehub_user';
const MIGRATION_KEY = '@tradehub_mmkv_migrated_v1';

export const migrateLegacyStorage = async () => {
    try {
        const alreadyMigrated = AppStorage.getBoolean(MIGRATION_KEY, false);
        if (alreadyMigrated) return true;

        const [token, user] = await Promise.all([
            AsyncStorage.getItem(TOKEN_KEY),
            AsyncStorage.getItem(USER_KEY),
        ]);

        if (token) {
            AppStorage.setString(TOKEN_KEY, token);
        }

        if (user) {
            AppStorage.setString(USER_KEY, user);
        }

        AppStorage.setBoolean(MIGRATION_KEY, true);
        return true;
    } catch (error) {
        console.error('❌ Storage migration failed:', error);
        return false;
    }
};
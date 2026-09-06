import AsyncStorage from '@react-native-async-storage/async-storage';

const parseJSON = (value, fallback = null) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
};

class AppStorageService {
    async setString(key, value) {
        await AsyncStorage.setItem(key, String(value));
        return true;
    }

    async getString(key, fallback = null) {
        const value = await AsyncStorage.getItem(key);
        return value ?? fallback;
    }

    async setJSON(key, value) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
        return true;
    }

    async getJSON(key, fallback = null) {
        const value = await AsyncStorage.getItem(key);
        return parseJSON(value, fallback);
    }

    async setBoolean(key, value) {
        await AsyncStorage.setItem(key, value ? 'true' : 'false');
        return true;
    }

    async getBoolean(key, fallback = false) {
        const value = await AsyncStorage.getItem(key);
        if (value === null) return fallback;
        return value === 'true';
    }

    async setNumber(key, value) {
        await AsyncStorage.setItem(key, String(value));
        return true;
    }

    async getNumber(key, fallback = null) {
        const value = await AsyncStorage.getItem(key);
        if (value === null) return fallback;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    async remove(key) {
        await AsyncStorage.removeItem(key);
        return true;
    }

    async multiRemove(keys = []) {
        if (Array.isArray(keys) && keys.length > 0) {
            await AsyncStorage.multiRemove(keys);
        }
        return true;
    }

    async clear() {
        await AsyncStorage.clear();
        return true;
    }
}

export default new AppStorageService();
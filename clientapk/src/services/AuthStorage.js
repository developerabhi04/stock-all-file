import AppStorage from './AppStorage';

const TOKEN_KEY = '@tradehub_token';
const USER_KEY = '@tradehub_user';

class AuthStorageService {
    async saveToken(token) {
        try {
            await AppStorage.setString(TOKEN_KEY, token);
            return true;
        } catch (error) {
            console.error('❌ Error saving token:', error);
            return false;
        }
    }

    async getToken() {
        try {
            const token = await AppStorage.getString(TOKEN_KEY);
            return token || null;
        } catch (error) {
            console.error('❌ Error getting token:', error);
            return null;
        }
    }

    async saveUser(user) {
        try {
            await AppStorage.setJSON(USER_KEY, user);
            return true;
        } catch (error) {
            console.error('❌ Error saving user:', error);
            return false;
        }
    }

    async getUser() {
        try {
            return await AppStorage.getJSON(USER_KEY, null);
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return null;
        }
    }

    async clearAuth() {
        try {
            await AppStorage.remove(TOKEN_KEY);
            await AppStorage.remove(USER_KEY);
            return true;
        } catch (error) {
            console.error('❌ Error clearing auth:', error);
            return false;
        }
    }

    async isAuthenticated() {
        const token = await this.getToken();
        return !!token;
    }
}

export default new AuthStorageService();
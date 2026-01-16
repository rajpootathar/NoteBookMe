/**
 * Auth Service - Single user authentication
 */

import { api } from './apiService';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
    async login(username, password) {
        const result = await api.login(username, password);
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(USER_KEY, result.username);
        return result;
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
        return localStorage.getItem(USER_KEY);
    },

    async verifySession() {
        if (!this.isAuthenticated()) {
            return false;
        }
        try {
            await api.verifyToken();
            return true;
        } catch {
            this.logout();
            return false;
        }
    },
};

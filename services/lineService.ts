
import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || '';

export const lineService = {
    init: async () => {
        if (!LIFF_ID) {
            console.warn('LINE LIFF ID not configured.');
            return false;
        }
        try {
            await liff.init({ liffId: LIFF_ID });
            return true;
        } catch (error) {
            console.error('LIFF initialization failed', error);
            return false;
        }
    },

    isLoggedIn: () => {
        return liff.isLoggedIn();
    },

    login: () => {
        if (!liff.isLoggedIn()) {
            liff.login();
        }
    },

    logout: () => {
        if (liff.isLoggedIn()) {
            liff.logout();
        }
    },

    getProfile: async () => {
        if (liff.isLoggedIn()) {
            try {
                return await liff.getProfile();
            } catch (error) {
                console.error('Error getting profile', error);
                return null;
            }
        }
        return null;
    },

    getDecodedIDToken: () => {
        return liff.getDecodedIDToken();
    }
};

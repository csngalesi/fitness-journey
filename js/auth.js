/**
 * Fitness Journey MED - Auth Module
 */

(function () {
    'use strict';

    window.FitnessAuth = {
        async getSession() {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            return session;
        },

        async login(email, password) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        },

        async logout() {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
        },

        onAuthStateChange(callback) {
            window.supabaseClient.auth.onAuthStateChange(callback);
        },

        async currentUser() {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            return user;
        }
    };

})();

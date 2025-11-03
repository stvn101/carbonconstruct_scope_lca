/**
 * CARBONCONSTRUCT - SUPABASE AUTH INTEGRATION
 * 
 * Handles authentication with Supabase Auth
 * Supports: Email/Password, Google OAuth, GitHub OAuth
 */

// ============================================
// CONFIGURATION (from window.ENV or fallback)
// ============================================

const SUPABASE_URL = window.SUPABASE_URL || window?.ENV?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window?.ENV?.SUPABASE_ANON_KEY || '';

// Initialize Supabase client
let supabase = null;

function initSupabaseAuth() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return false;
    }
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase credentials not configured. Auth features will be disabled.');
        return false;
    }
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Auth initialized');
    
    // Setup auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session.user.email);
            handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            handleSignOut();
        } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
        } else if (event === 'USER_UPDATED') {
            console.log('User updated');
        }
    });
    
    return true;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Sign up with email and password
 */
async function signUpWithEmail(email, password, metadata = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: metadata, // firstName, lastName, company, etc.
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Sign up successful:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in with email and password
 */
async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('✅ Sign in successful:', data.user.email);
        return { success: true, data };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in with Google OAuth
 */
async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Redirecting to Google OAuth');
        return { success: true };
    } catch (error) {
        console.error('Google OAuth error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in with GitHub OAuth
 */
async function signInWithGitHub() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Redirecting to GitHub OAuth');
        return { success: true };
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out
 */
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        console.log('✅ Signed out successfully');
        window.location.href = '/signin-new.html';
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current user
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Get current session
 */
async function getSession() {
    if (!supabase) {
        console.warn('⚠️ Supabase not initialized');
        return null;
    }
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        return session;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
}

/**
 * Update user metadata
 */
async function updateUserMetadata(updates) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });
        
        if (error) throw error;
        
        console.log('✅ User metadata updated');
        return { success: true, data };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        console.log('✅ Password reset email sent');
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update password
 */
async function updatePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        console.log('✅ Password updated');
        return { success: true };
    } catch (error) {
        console.error('Update password error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile from database
 */
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ Profile updated');
        return { success: true, data };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// AUTH STATE HANDLERS
// ============================================

function handleSignIn(session) {
    // Store user data
    localStorage.setItem('user', JSON.stringify(session.user));
    
    // Redirect based on context
    const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard.html';
    localStorage.removeItem('redirectAfterLogin');
    
    // Don't redirect if already on callback page
    if (!window.location.pathname.includes('/auth/callback')) {
        window.location.href = redirectTo;
    }
}

function handleSignOut() {
    // Clear local storage
    localStorage.removeItem('user');
    
    // Redirect to home if not already on public page
    if (isProtectedPage()) {
        window.location.href = '/index.html';
    }
}

// ============================================
// ROUTE PROTECTION
// ============================================

const protectedPages = [
    '/dashboard.html',
    '/calculator.html',
    '/projects.html',
    '/subscription.html',
    '/settings.html'
];

function isProtectedPage() {
    return protectedPages.some(page => window.location.pathname.includes(page));
}

/**
 * Protect a page - redirect to signin if not authenticated
 */
async function protectPage() {
    const session = await getSession();
    
    if (!session && isProtectedPage()) {
        console.log('⚠️ Unauthorized access, redirecting to signin');
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/signin-new.html';
        return false;
    }
    
    return true;
}

/**
 * Redirect if already authenticated (for signin/signup pages)
 */
async function redirectIfAuthenticated() {
    const session = await getSession();

    if (session && (window.location.pathname.includes('signin-new') || window.location.pathname.includes('signup-new'))) {
        console.log('✅ Already authenticated, redirecting to dashboard');
        window.location.href = '/dashboard.html';
        return true;
    }

    return false;
}

// ============================================
// EXPORT PUBLIC API
// ============================================

window.auth = {
    // Initialization
    init: initSupabaseAuth,
    
    // Auth methods
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    
    // User methods
    getCurrentUser,
    getSession,
    updateUserMetadata,
    
    // Password methods
    resetPassword,
    updatePassword,
    
    // Profile methods
    getUserProfile,
    updateUserProfile,
    
    // Route protection
    protectPage,
    redirectIfAuthenticated,
    
    // Direct access to client
    getClient: () => supabase
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseAuth);
} else {
    initSupabaseAuth();
}

console.log('🔐 Supabase Auth API loaded');
console.log('🔑 OAuth providers: Google, GitHub');
console.log('📧 Email/Password auth enabled');
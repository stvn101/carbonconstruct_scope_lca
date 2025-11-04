/**
 * Agent Access Management
 *
 * Manages trial system and agent access control:
 * - 14-day trial (starts when payment card added)
 * - 3 agent uses per day during trial
 * - Requires paid subscription after trial
 * - Calendar day reset (midnight UTC)
 */

class AgentAccessManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.cachedStatus = null;
        this.cacheExpiry = null;
        this.CACHE_DURATION_MS = 60000; // 1 minute cache
    }

    /**
     * Check if user can use agents
     * Returns detailed status about trial and usage limits
     */
    async checkAccess() {
        try {
            // Return cached status if still valid
            if (this.cachedStatus && this.cacheExpiry && Date.now() < this.cacheExpiry) {
                return this.cachedStatus;
            }

            // Get current user
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();

            if (authError || !user) {
                return this.createAccessStatus(false, 'not_authenticated', {
                    message: 'Please sign in to use AI agents'
                });
            }

            // Call Supabase function to check access
            const { data, error } = await this.supabase
                .rpc('check_agent_access', { p_user_id: user.id });

            if (error) {
                console.error('[Agent Access] Check failed:', error);
                return this.createAccessStatus(false, 'check_failed', {
                    message: 'Failed to verify agent access',
                    error: error.message
                });
            }

            // Parse response from database function
            const result = Array.isArray(data) ? data[0] : data;

            const status = this.createAccessStatus(
                result.can_use_agents,
                result.access_reason,
                {
                    isTrial: result.is_trial,
                    trialDaysRemaining: result.trial_days_remaining,
                    dailyUsesRemaining: result.daily_uses_remaining,
                    ...this.getStatusMessage(result)
                }
            );

            // Cache the result
            this.cachedStatus = status;
            this.cacheExpiry = Date.now() + this.CACHE_DURATION_MS;

            return status;

        } catch (error) {
            console.error('[Agent Access] Unexpected error:', error);
            return this.createAccessStatus(false, 'error', {
                message: 'An unexpected error occurred',
                error: error.message
            });
        }
    }

    /**
     * Log agent usage
     */
    async logUsage(agentType, action, success = true, errorMessage = null, requestData = null, responseData = null, executionTimeMs = null) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await this.supabase
                .rpc('log_agent_usage', {
                    p_user_id: user.id,
                    p_agent_type: agentType,
                    p_action: action,
                    p_success: success,
                    p_error_message: errorMessage,
                    p_request_data: requestData,
                    p_response_data: responseData,
                    p_execution_time_ms: executionTimeMs
                });

            if (error) {
                console.error('[Agent Access] Failed to log usage:', error);
                return null;
            }

            // Clear cache after logging usage
            this.clearCache();

            return data;
        } catch (error) {
            console.error('[Agent Access] Log usage error:', error);
            return null;
        }
    }

    /**
     * Get today's usage count
     */
    async getTodayUsage() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return 0;

            const today = new Date().toISOString().split('T')[0];

            const { count, error } = await this.supabase
                .from('agent_usage_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('usage_date', today)
                .eq('success', true);

            if (error) {
                console.error('[Agent Access] Failed to get usage count:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('[Agent Access] Get usage error:', error);
            return 0;
        }
    }

    /**
     * Get usage statistics
     */
    async getUsageStats() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const today = new Date().toISOString().split('T')[0];

            // Get today's usage
            const { count: todayCount } = await this.supabase
                .from('agent_usage_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('usage_date', today)
                .eq('success', true);

            // Get total usage
            const { count: totalCount } = await this.supabase
                .from('agent_usage_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('success', true);

            // Get access status
            const accessStatus = await this.checkAccess();

            return {
                todayUsage: todayCount || 0,
                totalUsage: totalCount || 0,
                dailyLimit: accessStatus.isTrial ? 3 : 999,
                usesRemaining: accessStatus.dailyUsesRemaining || 0,
                isTrial: accessStatus.isTrial,
                canUse: accessStatus.canUse
            };
        } catch (error) {
            console.error('[Agent Access] Get stats error:', error);
            return null;
        }
    }

    /**
     * Check if user has payment method on file
     */
    async hasPaymentMethod() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('has_payment_method')
                .eq('user_id', user.id)
                .single();

            if (error || !data) return false;

            return data.has_payment_method === true;
        } catch (error) {
            console.error('[Agent Access] Check payment method error:', error);
            return false;
        }
    }

    /**
     * Start trial (called when payment method is added)
     */
    async startTrial() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('user_profiles')
                .update({
                    has_payment_method: true,
                    payment_method_added_at: new Date().toISOString(),
                    agent_trial_started_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) {
                console.error('[Agent Access] Failed to start trial:', error);
                return false;
            }

            // Clear cache
            this.clearCache();

            console.log('✅ Trial started successfully');
            return true;
        } catch (error) {
            console.error('[Agent Access] Start trial error:', error);
            return false;
        }
    }

    /**
     * Clear cached status
     */
    clearCache() {
        this.cachedStatus = null;
        this.cacheExpiry = null;
    }

    /**
     * Create standardized access status object
     */
    createAccessStatus(canUse, reason, details = {}) {
        return {
            canUse,
            reason,
            isTrial: details.isTrial || false,
            trialDaysRemaining: details.trialDaysRemaining || 0,
            dailyUsesRemaining: details.dailyUsesRemaining || 0,
            message: details.message || '',
            error: details.error || null
        };
    }

    /**
     * Get user-friendly status message
     */
    getStatusMessage(result) {
        const messages = {
            'active_subscription': {
                message: '✅ Full access with active subscription',
                title: 'Active Subscription',
                type: 'success'
            },
            'trial_active': {
                message: `🎉 Trial active: ${result.trial_days_remaining} days remaining, ${result.daily_uses_remaining} uses left today`,
                title: '14-Day Trial Active',
                type: 'info'
            },
            'trial_expired': {
                message: '⏰ Trial expired. Subscribe to continue using AI agents.',
                title: 'Trial Expired',
                type: 'warning',
                action: 'Subscribe Now',
                actionLink: '/subscription.html'
            },
            'no_payment_method': {
                message: '💳 Add a payment card to start your 14-day free trial (3 uses/day)',
                title: 'Add Payment Method',
                type: 'info',
                action: 'Add Card',
                actionLink: '/subscription.html'
            },
            'not_authenticated': {
                message: '🔒 Sign in to use AI agents',
                title: 'Sign In Required',
                type: 'warning',
                action: 'Sign In',
                actionLink: '/signin-new.html'
            }
        };

        return messages[result.access_reason] || {
            message: 'Status unknown',
            title: 'Unknown Status',
            type: 'info'
        };
    }

    /**
     * Get formatted status for UI display
     */
    async getStatusDisplay() {
        const status = await this.checkAccess();
        const details = this.getStatusMessage({ access_reason: status.reason, ...status });

        return {
            canUse: status.canUse,
            badge: status.isTrial ? 'Trial' : (status.canUse ? 'Active' : 'Inactive'),
            badgeClass: status.isTrial ? 'bg-blue-500' : (status.canUse ? 'bg-green-500' : 'bg-gray-400'),
            title: details.title,
            message: details.message,
            type: details.type,
            action: details.action,
            actionLink: details.actionLink,
            stats: {
                isTrial: status.isTrial,
                trialDaysRemaining: status.trialDaysRemaining,
                dailyUsesRemaining: status.dailyUsesRemaining,
                dailyLimit: status.isTrial ? 3 : 'Unlimited'
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AgentAccessManager };
}

// Make available globally
window.AgentAccessManager = AgentAccessManager;

/**
 * CarbonConstruct - Unified Navigation Component
 * Provides consistent navigation across all pages
 */

(function() {
    'use strict';

    // Navigation configuration
    const NAV_CONFIG = {
        logo: {
            icon: 'fas fa-leaf',
            text: 'CarbonConstruct',
            subtitle: 'Australian Carbon Calculator',
            homeLink: 'index.html'
        },
        links: {
            public: [
                { href: 'index.html', text: 'Home', icon: 'fas fa-home' },
                { href: 'calculator.html', text: 'Calculator', icon: 'fas fa-calculator' },
                { href: 'operational-carbon.html', text: 'Operational Carbon', icon: 'fas fa-industry', badge: 'NEW' },
                { href: 'ec3-oauth.html', text: 'EC3 Database', icon: 'fas fa-database', badge: 'BETA' }
            ],
            authenticated: [
                { href: 'dashboard.html', text: 'Dashboard', icon: 'fas fa-chart-line' },
                { href: 'calculator.html', text: 'Calculator', icon: 'fas fa-calculator' },
                { href: 'operational-carbon.html', text: 'Operational Carbon', icon: 'fas fa-industry' },
                { href: 'subscription.html', text: 'Subscription', icon: 'fas fa-credit-card' },
                { href: 'settings.html', text: 'Settings', icon: 'fas fa-cog' }
            ]
        },
        cta: {
            signIn: { href: 'signin-new.html', text: 'Sign In' },
            signUp: { href: 'signup-new.html', text: 'Start Free Trial', icon: 'fas fa-rocket' }
        }
    };

    /**
     * Generate navigation HTML
     * @param {boolean} isAuthenticated - Whether user is logged in
     * @returns {string} Navigation HTML
     */
    function generateNavHTML(isAuthenticated = false) {
        const links = isAuthenticated ? NAV_CONFIG.links.authenticated : NAV_CONFIG.links.public;
        
        const navLinksHTML = links.map(link => {
            const badge = link.badge ? `<span class="ml-1 text-xs bg-brand-primary text-white px-2 py-0.5 rounded-full">${link.badge}</span>` : '';
            return `
                <a href="${link.href}" class="text-brand-steel hover:text-brand-forest font-medium transition-colors flex items-center">
                    <i class="${link.icon} mr-1"></i>${link.text}${badge}
                </a>
            `;
        }).join('');

        const ctaHTML = isAuthenticated ? `
            <button id="userMenuButton" class="flex items-center space-x-2 text-brand-forest hover:text-brand-primary-dark font-medium">
                <i class="fas fa-user-circle text-2xl"></i>
                <span id="userDisplayName">User</span>
                <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="userDropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <a href="dashboard.html" class="block px-4 py-2 text-brand-steel hover:bg-brand-mint"><i class="fas fa-chart-line mr-2"></i>Dashboard</a>
                <a href="settings.html" class="block px-4 py-2 text-brand-steel hover:bg-brand-mint"><i class="fas fa-cog mr-2"></i>Settings</a>
                <a href="subscription.html" class="block px-4 py-2 text-brand-steel hover:bg-brand-mint"><i class="fas fa-credit-card mr-2"></i>Subscription</a>
                <hr class="my-2">
                <button id="signOutButton" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"><i class="fas fa-sign-out-alt mr-2"></i>Sign Out</button>
            </div>
        ` : `
            <a href="${NAV_CONFIG.cta.signIn.href}" class="text-brand-forest hover:text-brand-primary-dark font-medium px-4 py-2 transition-colors">
                ${NAV_CONFIG.cta.signIn.text}
            </a>
            <a href="${NAV_CONFIG.cta.signUp.href}" class="bg-brand-primary hover:bg-brand-forest text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center">
                <i class="${NAV_CONFIG.cta.signUp.icon} mr-2"></i>${NAV_CONFIG.cta.signUp.text}
            </a>
        `;

        return `
            <nav class="bg-white shadow-lg sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <a href="${NAV_CONFIG.logo.homeLink}" class="flex items-center">
                                <i class="${NAV_CONFIG.logo.icon} text-brand-forest text-2xl mr-3"></i>
                                <span class="text-xl font-bold text-brand-navy">${NAV_CONFIG.logo.text}</span>
                                <span class="ml-3 text-sm text-brand-sage hidden lg:inline">${NAV_CONFIG.logo.subtitle}</span>
                            </a>
                        </div>
                        <div class="hidden md:flex space-x-6">
                            ${navLinksHTML}
                        </div>
                        <div class="flex items-center space-x-3 relative">
                            ${ctaHTML}
                            <button id="mobileMenuButton" class="md:hidden text-brand-steel">
                                <i class="fas fa-bars text-2xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Mobile Menu -->
                <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-brand-border">
                    <div class="px-4 py-4 space-y-3">
                        ${links.map(link => `
                            <a href="${link.href}" class="block text-brand-steel hover:text-brand-forest font-medium">
                                <i class="${link.icon} mr-2"></i>${link.text}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Initialize navigation
     */
    function initNavigation() {
        // Check if user is authenticated (check localStorage/sessionStorage or cookie)
        const isAuthenticated = checkAuthentication();
        
        // Find nav container or create one
        let navContainer = document.getElementById('app-navigation');
        
        if (!navContainer) {
            // Create navigation at the top of body
            navContainer = document.createElement('div');
            navContainer.id = 'app-navigation';
            document.body.insertBefore(navContainer, document.body.firstChild);
        }
        
        // Inject navigation HTML
        navContainer.innerHTML = generateNavHTML(isAuthenticated);
        
        // Setup event listeners
        setupNavigationEvents();
        
        // Highlight current page
        highlightCurrentPage();
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    function checkAuthentication() {
        // Check for Supabase session
        try {
            const supabaseAuth = localStorage.getItem('supabase.auth.token');
            if (supabaseAuth) {
                const authData = JSON.parse(supabaseAuth);
                return authData && authData.currentSession;
            }
        } catch (e) {
            console.log('No Supabase auth found');
        }
        
        // Fallback: check if we're on an authenticated page
        const authenticatedPages = ['dashboard', 'settings', 'subscription'];
        const currentPage = window.location.pathname.split('/').pop().split('.')[0];
        return authenticatedPages.includes(currentPage);
    }

    /**
     * Setup navigation event listeners
     */
    function setupNavigationEvents() {
        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // User dropdown menu
        const userMenuButton = document.getElementById('userMenuButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                if (!userDropdown.classList.contains('hidden')) {
                    userDropdown.classList.add('hidden');
                }
            });
        }
        
        // Sign out button
        const signOutButton = document.getElementById('signOutButton');
        if (signOutButton) {
            signOutButton.addEventListener('click', handleSignOut);
        }
    }

    /**
     * Highlight current page in navigation
     */
    function highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('text-brand-primary', 'font-bold');
                link.classList.remove('text-brand-steel');
            }
        });
    }

    /**
     * Handle user sign out
     */
    async function handleSignOut() {
        try {
            // Clear localStorage
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Error signing out. Please try again.');
        }
    }

    /**
     * Public API
     */
    window.CarbonConstructNav = {
        init: initNavigation,
        refresh: initNavigation,
        checkAuth: checkAuthentication
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }

    console.log('✅ CarbonConstruct Navigation loaded');
})();

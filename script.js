// ============================================
// CARBONCONSTRUCT - MAIN JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
            }
        });
    });

    // Navbar Scroll Effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
            
            lastScroll = currentScroll;
        });
    }

    // Animated Counter for Stats
    const animateCounter = (element, target, duration = 2000) => {
        let start = 0;
        const increment = target / (duration / 16); // 60fps
        
        const updateCounter = () => {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };
        
        updateCounter();
    };

    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Animate stat numbers
                if (entry.target.classList.contains('stat-number')) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    animateCounter(entry.target, target);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .pricing-card, .compliance-badge').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Form Validation Helper
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Add validation to all email inputs
    document.querySelectorAll('input[type="email"]').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = '#EF4444';
                
                // Add error message if not exists
                if (!this.nextElementSibling || !this.nextElementSibling.classList.contains('error-message')) {
                    const error = document.createElement('div');
                    error.className = 'error-message';
                    error.style.color = '#EF4444';
                    error.style.fontSize = '13px';
                    error.style.marginTop = '4px';
                    error.textContent = 'Please enter a valid email address';
                    this.parentNode.insertBefore(error, this.nextSibling);
                }
            } else {
                this.style.borderColor = '#E5E7EB';
                const error = this.nextElementSibling;
                if (error && error.classList.contains('error-message')) {
                    error.remove();
                }
            }
        });
    });

    // Pricing Toggle (if annual/monthly toggle exists)
    const pricingToggle = document.getElementById('pricingToggle');
    if (pricingToggle) {
        pricingToggle.addEventListener('change', function() {
            const prices = document.querySelectorAll('.price-amount');
            const periods = document.querySelectorAll('.price-period');
            
            prices.forEach((price, index) => {
                const monthlyPrice = parseInt(price.dataset.monthly);
                const annualPrice = parseInt(price.dataset.annual);
                
                if (this.checked) {
                    // Show annual
                    price.textContent = annualPrice;
                    periods[index].textContent = '/year';
                } else {
                    // Show monthly
                    price.textContent = monthlyPrice;
                    periods[index].textContent = '/month';
                }
            });
        });
    }

    // FAQ Accordion (if FAQ section exists)
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all FAQs
                faqItems.forEach(faq => {
                    faq.classList.remove('active');
                    const ans = faq.querySelector('.faq-answer');
                    if (ans) ans.style.maxHeight = null;
                });
                
                // Open clicked FAQ if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        }
    });

    // Toast Notification System
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
        `;
        
        const icon = type === 'success' 
            ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10L9 12L13 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="8" stroke="white" stroke-width="2"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
        
        toast.innerHTML = icon + '<span>' + message + '</span>';
        document.body.appendChild(toast);
        
        // Add animation keyframes if not exists
        if (!document.getElementById('toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    // Copy to Clipboard Function
    window.copyToClipboard = function(text, successMessage = 'Copied to clipboard!') {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage);
        }).catch(err => {
            showToast('Failed to copy', 'error');
        });
    };

    // Load More Functionality
    const loadMoreBtns = document.querySelectorAll('.load-more-btn');
    loadMoreBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const target = document.querySelector(this.dataset.target);
            if (target) {
                target.style.display = 'block';
                this.style.display = 'none';
            }
        });
    });

    // Print functionality for reports
    window.printReport = function() {
        window.print();
    };

    // Export to PDF (would need external library in production)
    window.exportToPDF = function() {
        showToast('PDF export feature coming soon!');
    };

    // Share functionality
    window.shareReport = function() {
        if (navigator.share) {
            navigator.share({
                title: 'Carbon Report',
                text: 'Check out this carbon calculation report',
                url: window.location.href
            }).catch(() => {
                // Fallback to copy link
                copyToClipboard(window.location.href, 'Link copied to clipboard!');
            });
        } else {
            copyToClipboard(window.location.href, 'Link copied to clipboard!');
        }
    };

    // Console welcome message
    console.log(
        '%c CarbonConstruct ',
        'background: #10B981; color: white; font-size: 16px; padding: 8px 16px; border-radius: 4px; font-weight: bold;'
    );
    console.log(
        '%c Calculate your carbon footprint at carbonconstruct.com ',
        'font-size: 12px; color: #6B7280;'
    );
});

// Utility Functions

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Calculate CO2 savings
function calculateCO2Savings(materials) {
    // This would contain actual calculation logic
    let total = 0;
    materials.forEach(material => {
        // Calculation based on material type and quantity
        total += material.quantity * material.carbonFactor;
    });
    return total;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        formatNumber,
        calculateCO2Savings
    };
}
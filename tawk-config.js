/**
 * Tawk.to Chat Widget Configuration
 *
 * The Tawk.to widget is already embedded in HTML pages.
 * This file is optional and can be used for additional configuration.
 *
 * Widget is already loaded via inline script in HTML files:
 * https://embed.tawk.to/68f6680f559a7e194c8016cf/1j818cvpp
 */

console.log('✅ Tawk.to configuration loaded');

// Optional: Customize widget appearance or behavior
if (typeof Tawk_API !== 'undefined') {
    console.log('✅ Tawk.to widget initialized');

    // Example customizations (uncomment to use):

    // Set visitor name
    // Tawk_API.setAttributes({
    //     'name': 'Visitor Name',
    //     'email': 'visitor@example.com'
    // });

    // Hide widget on specific pages
    // if (window.location.pathname === '/checkout') {
    //     Tawk_API.hideWidget();
    // }

    // Custom styling
    // Tawk_API.customStyle = {
    //     visibility : {
    //         desktop : {
    //             position : 'br', // bottom-right
    //             xOffset : 20,
    //             yOffset : 20
    //         },
    //         mobile : {
    //             position : 'br',
    //             xOffset : 10,
    //             yOffset : 10
    //         }
    //     }
    // };
} else {
    console.warn('⚠️ Tawk.to widget not yet loaded');
}

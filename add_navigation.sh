#!/bin/bash
# Quick script to add navigation buttons to HTML pages

# Navigation HTML to add
NAV_HTML='    <!-- Modern Navigation Buttons -->
    <div class="nav-buttons">
        <a href="index.html" class="nav-btn" title="Home" aria-label="Go to Home">
            <i class="fas fa-home"></i>
        </a>
        <a href="calculator.html" class="nav-btn" title="Calculator" aria-label="Go to Calculator">
            <i class="fas fa-calculator"></i>
        </a>
    </div>

'

# Array of files to update
FILES=(
    "dashboard.html"
    "settings.html"
    "subscription.html"
    "checkout.html"
    "signin.html"
    "signin-new.html"
    "signup.html"
    "signup-new.html"
    "ec3-oauth.html"
)

# Add navigation to each file if not already present
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        if ! grep -q "nav-buttons" "$file"; then
            # Find <body> tag and add navigation after it
            sed -i '/<body/a\'"$NAV_HTML" "$file"
            echo "Added navigation to $file"
        else
            echo "Navigation already exists in $file"
        fi
    else
        echo "File not found: $file"
    fi
done

echo "Navigation update complete!"

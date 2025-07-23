#!/bin/bash

# Secure Admin Creation Script
# This script helps create an admin user with proper security practices

set -e  # Exit on any error

echo "🔐 Secure Admin User Creation"
echo "================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the create-admin script exists
if [ ! -f "init-db/create-admin.cjs" ]; then
    echo "❌ Error: create-admin.cjs not found in init-db/ directory"
    echo "Make sure you're running this from the project root directory"
    exit 1
fi

# Function to generate a secure password suggestion
generate_password_suggestion() {
    echo "💡 Here's a strong password suggestion:"
    # Generate a secure password suggestion (available on macOS/Linux)
    if command -v openssl &> /dev/null; then
        echo "   $(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)@$(date +%Y)"
    else
        echo "   Use a password manager to generate a secure password"
    fi
    echo "   Remember: 8+ chars, uppercase, lowercase, numbers, special chars"
    echo
}

# Function to validate environment setup
validate_environment() {
    if [ -z "$ADMIN_PASSWORD" ]; then
        echo "❌ Error: ADMIN_PASSWORD environment variable is not set"
        echo
        echo "Please set a strong password:"
        echo "  export ADMIN_PASSWORD='YourSecurePassword123!'"
        echo
        generate_password_suggestion
        return 1
    fi
    
    # Basic length check
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
        echo "❌ Error: Password too short (minimum 8 characters)"
        return 1
    fi
    
    return 0
}

echo "Checking environment..."

# Validate environment variables
if ! validate_environment; then
    exit 1
fi

echo "✅ Environment validation passed"
echo

# Ask for confirmation
echo "Creating admin user with:"
echo "  Username: ${ADMIN_USERNAME:-admin}"
echo "  Password: [HIDDEN]"
echo

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted by user"
    exit 0
fi

echo "🔄 Creating admin user..."

# Run the admin creation script
if node init-db/create-admin.cjs; then
    echo
    echo "🎉 Admin user created successfully!"
    echo
    echo "⚠️  Security reminders:"
    echo "  1. Store the password securely (password manager recommended)"
    echo "  2. Clear the environment variable: unset ADMIN_PASSWORD"
    echo "  3. Consider changing the password after first login"
    echo "  4. Enable additional security measures in production"
    echo
    echo "To clear the password from environment:"
    echo "  unset ADMIN_PASSWORD"
    echo "  unset ADMIN_USERNAME  # if you set a custom username"
else
    echo
    echo "❌ Failed to create admin user"
    echo "Check the error messages above for details"
    exit 1
fi

#!/bin/bash
# Install Draiven node in n8n
# This registers the linked node as a community node

echo -e "\033[0;32m📦 Installing Draiven node in n8n...\033[0m"

DB_PATH="$HOME/.n8n/database.sqlite"

if [ ! -f "$DB_PATH" ]; then
    echo -e "\033[0;31m❌ n8n database not found. Please start n8n at least once first.\033[0m"
    exit 1
fi

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    echo -e "\033[0;31m❌ sqlite3 command not found. Please install sqlite3.\033[0m"
    exit 1
fi

# Check if node is already installed
QUERY="SELECT * FROM installed_packages WHERE packageName = 'n8n-nodes-draiven';"
RESULT=$(sqlite3 "$DB_PATH" "$QUERY" 2>&1)

if echo "$RESULT" | grep -q "n8n-nodes-draiven"; then
    echo -e "\033[0;32m✅ Node is already installed in n8n database\033[0m"
else
    echo -e "\033[0;33m⚠️  Node not found in database. Installing...\033[0m"
    
    # Insert the package into the database
    INSERT_QUERY="INSERT INTO installed_packages (packageName, installedVersion, updateAvailable, createdAt, updatedAt)
VALUES ('n8n-nodes-draiven', '0.1.2', '', datetime('now'), datetime('now'));"
    
    sqlite3 "$DB_PATH" "$INSERT_QUERY"
    
    if [ $? -eq 0 ]; then
        echo -e "\033[0;32m✅ Node registered successfully!\033[0m"
    else
        echo -e "\033[0;31m❌ Failed to register node. Try manual installation through n8n UI.\033[0m"
    fi
fi

echo ""
echo -e "\033[0;36mNow restart n8n and the Draiven node should appear!\033[0m"

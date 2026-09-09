#!/bin/bash

echo "🧪 Draiven n8n Node - Testing Guide"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must be run from draiven-n8n-node directory${NC}"
    exit 1
fi

echo "1. Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Run: npm install"
fi

echo ""
echo "2. Checking build output..."
if [ -d "dist" ]; then
    print_status 0 "Build directory exists"
    
    if [ -f "dist/credentials/DraivenApi.credentials.js" ]; then
        print_status 0 "Credentials built"
    else
        echo -e "${YELLOW}⚠${NC} Credentials not built. Run: npm run build"
    fi
    
    if [ -f "dist/nodes/Draiven/Draiven.node.js" ]; then
        print_status 0 "Node built"
    else
        echo -e "${YELLOW}⚠${NC} Node not built. Run: npm run build"
    fi
    
    if [ -f "dist/nodes/Draiven/draiven.svg" ]; then
        print_status 0 "Icon copied"
    else
        echo -e "${YELLOW}⚠${NC} Icon not copied. Run: npm run build"
    fi
else
    echo -e "${YELLOW}⚠${NC} Build directory doesn't exist. Run: npm run build"
fi

echo ""
echo "3. Running TypeScript compilation check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    print_status 0 "TypeScript compilation successful"
else
    print_status 1 "TypeScript compilation has errors"
fi

echo ""
echo "4. Running the test suite..."
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "All tests pass"
else
    print_status 1 "Tests failing. Run: npm test for details"
fi

echo ""
echo "5. Running ESLint..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "No linting errors"
else
    echo -e "${YELLOW}⚠${NC} Linting warnings/errors found. Run: npm run lint for details"
fi

echo ""
echo "===================================="
echo "📋 Manual Testing Checklist"
echo "===================================="
echo ""
echo "After building, test these scenarios:"
echo ""
echo "□ 1. Install & Visibility"
echo "   - Link the package: npm link"
echo "   - In n8n: npm link n8n-nodes-draiven"
echo "   - Restart n8n"
echo "   - Verify node appears in node palette"
echo ""
echo "□ 2. Credentials Setup"
echo "   - Add new Draiven API credential"
echo "   - Enter valid API URL, email, and API key"
echo "   - Click 'Test' - should succeed"
echo "   - Try invalid credentials - should fail"
echo ""
echo "□ 3. Node Configuration"
echo "   - Add Draiven node to workflow"
echo "   - Verify 'Dataset Names or IDs' dropdown loads"
echo "   - Verify 'Agent Name or ID' dropdown loads"
echo "   - Check all fields are visible"
echo ""
echo "□ 4. Basic Execution"
echo "   - Select 1+ datasets"
echo "   - Optionally select an agent (empty lets Draiven choose)"
echo "   - Enter a simple question"
echo "   - Execute workflow"
echo "   - Verify response structure (answer, conversationId, additionalData)"
echo ""
echo "□ 5. Error Handling"
echo "   - Try with no datasets selected"
echo "   - Try with empty question"
echo "   - Try with a non-numeric or negative conversation ID"
echo "   - Try with invalid credentials - error must not echo the API key"
echo "   - Enable 'Continue On Fail' and confirm the item carries"
echo "     success:false, error, description and conversationId"
echo ""
echo "□ 6. Advanced Features"
echo "   - Test conversation continuity (feed conversationId back in)"
echo "   - Test with multiple datasets"
echo "   - Test with different agents"
echo "   - Test SQL Mode"
echo "   - Test a short Timeout and confirm the error names the conversation ID"
echo "   - Verify additionalData in output"
echo ""
echo "===================================="
echo "🔗 API Testing"
echo "===================================="
echo ""
echo "Test API endpoints manually:"
echo ""
echo "1. Test credentials:"
echo "   curl -X GET https://api.draiven.io/ping \\"
echo "        -u 'email@example.com:your-api-key'"
echo ""
echo "2. Get datasets:"
echo "   curl -X GET https://api.draiven.io/datasets/ \\"
echo "        -u 'email@example.com:your-api-key'"
echo ""
echo "3. Get agents:"
echo "   curl -X GET https://api.draiven.io/agents/ \\"
echo "        -u 'email@example.com:your-api-key'"
echo ""
echo "4. Ask a question (returns a conversation ID immediately):"
echo "   curl -X POST https://api.draiven.io/conversations/ \\"
echo "        -u 'email@example.com:your-api-key' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"question\":\"test\",\"dataset_ids\":[1],\"agent_id\":1}'"
echo ""
echo "5. Poll for the answer (null until the assistant replies):"
echo "   curl -X GET https://api.draiven.io/conversations/123/last-ai-message \\"
echo "        -u 'email@example.com:your-api-key'"
echo ""
echo "Note: the trailing slashes above are required - the collection routes"
echo "      redirect without them, and curl drops Basic auth across redirects."
echo ""
echo "===================================="
echo "📦 Publishing Checklist"
echo "===================================="
echo ""
echo "Before publishing to npm:"
echo ""
echo "□ All tests pass"
echo "□ No TypeScript errors"
echo "□ No ESLint errors"
echo "□ Version number updated (package.json)"
echo "□ CHANGELOG updated"
echo "□ README complete and accurate"
echo "□ Build output exists (dist/)"
echo "□ npm login completed"
echo "□ Test package locally first"
echo ""
echo "Then run: npm publish"
echo ""

# Quick Start Guide - Draiven n8n Node

## 🎯 Goal
Integrate Draiven AI into your n8n workflows in 5 minutes!

## 📋 Prerequisites

- n8n installed (self-hosted or n8n.cloud)
- Node.js 18+ (for local development)
- Draiven account with API key

## 🚀 Installation

### Option 1: Via n8n Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter: `n8n-nodes-draiven`
5. Click **Install** and wait for completion
6. Refresh n8n

### Option 2: Local Development

```bash
# Clone and setup
git clone https://github.com/draiven-io/n8n-nodes-draiven.git
cd draiven-n8n-node
./setup.sh

# Build
npm run build

# Link to n8n
npm link
cd /path/to/n8n
npm link n8n-nodes-draiven

# Restart n8n
```

## 🔑 Get Your Draiven API Key

1. Go to [app.draiven.io](https://app.draiven.io)
2. Log in to your account
3. Navigate to **Settings** → **API Keys**
4. Click **Create New API Key**
5. Give it a name (e.g., "n8n Integration")
6. Copy the generated API key
7. Save it securely (you won't see it again!)

## ⚙️ Configure Credentials in n8n

1. In n8n, click **Credentials** in the left menu
2. Click **Add Credential**
3. Search for "Draiven API"
4. Fill in:
   - **API URL**: `https://api.draiven.io`
   - **User Email**: Your Draiven account email
   - **API Key**: The key you copied earlier
5. Click **Test Connection**
6. Save if successful ✅

## 🎨 Create Your First Workflow

### Example: Daily Sales Analysis

1. **Create new workflow**
   - Click **+** to add a new workflow
   - Name it "Daily Sales Analysis"

2. **Add Schedule Trigger**
   - Search for "Schedule"
   - Set to run daily at 9:00 AM

3. **Add Draiven Node**
   - Click **+** to add node
   - Search for "Draiven"
   - Select "Draiven" node

4. **Configure Draiven Node**
   - **Credentials**: Select your Draiven API credentials
   - **Operation**: Ask Question
   - **Datasets**: Select your sales dataset(s)
   - **Persona**: Choose "Sales Strategist" or "Data Detective"
   - **Question**: 
     ```
     What are the top 5 products by revenue in the last 24 hours? 
     Include key metrics and any notable trends.
     ```

5. **Add Email Node** (Optional)
   - Add an email node after Draiven
   - Send the AI insights to your team
   - Use `{{ $json.answer }}` to include the response

6. **Test & Activate**
   - Click **Execute Workflow** to test
   - Review the output
   - Click **Active** toggle to enable

## 📊 Example Use Cases

### 1. Customer Feedback Analysis

```
Trigger: New form submission (Typeform, Google Forms)
↓
Draiven: Analyze sentiment and extract insights
↓
Slack: Send summary to #customer-insights
```

**Draiven Configuration:**
- Datasets: Customer feedback database
- Persona: Customer Advocate
- Question: "Analyze this customer feedback and provide sentiment score, key issues, and recommended actions"

### 2. Financial Report Generation

```
Trigger: Schedule (Every Monday 8 AM)
↓
Draiven: Generate weekly financial summary
↓
Email: Send to finance team
```

**Draiven Configuration:**
- Datasets: Financial transactions, Budget data
- Persona: Finance Analyst
- Question: "Generate a weekly financial summary including revenue, expenses, top categories, and variance from budget"

### 3. Marketing Campaign Optimizer

```
Trigger: Webhook (Campaign ends)
↓
Draiven: Analyze campaign performance
↓
Google Sheets: Log results
↓
Teams: Notify marketing team
```

**Draiven Configuration:**
- Datasets: Campaign data, Customer segments
- Persona: Marketing Guru
- Question: "Analyze this campaign's performance, identify the best-performing segments, and suggest optimization strategies"

## 🎓 Tips & Best Practices

### Writing Effective Questions

✅ **Good:**
```
"What are the top 5 products by revenue this month? 
Include percentage change vs last month and highlight any anomalies."
```

❌ **Less Effective:**
```
"Show me products"
```

### Choosing the Right Persona

- **Data Detective**: Exploratory analysis, finding patterns
- **Sales Strategist**: Sales performance, pipeline analysis
- **Finance Analyst**: Financial metrics, budget analysis
- **Marketing Guru**: Campaign performance, customer segments
- **Customer Advocate**: Feedback analysis, satisfaction trends
- **Operations Optimizer**: Process efficiency, bottlenecks

### Dataset Selection

- Select only relevant datasets to get focused answers
- Use multiple datasets when you need cross-referencing
- Create dedicated datasets for specific use cases

### Conversation Continuity

To have follow-up questions in the same context:
1. Store `{{ $json.conversationId }}` in a variable
2. Use it in "Additional Options" → "Conversation ID"
3. Next question will have full context

## 🔧 Troubleshooting

### Problem: Node not showing up

**Solution:**
- Refresh n8n (Ctrl+R or Cmd+R)
- Check Community Nodes installation status
- For local dev: verify `npm link` was successful

### Problem: Authentication failed

**Solution:**
- Verify API key is correct (create a new one if needed)
- Check email matches the API key owner
- Ensure API URL is correct (no trailing slash)
- Test credentials using the "Test" button

### Problem: Datasets/Personas not loading

**Solution:**
- Save credentials first
- Check network connection to Draiven API
- Verify you have datasets in your Draiven account
- Check browser console for errors (F12)

### Problem: "No response" or timeout

**Solution:**
- Check if datasets exist and have data
- Try a simpler question first
- Verify persona has access to the datasets
- Check Draiven API status

## 📈 Next Steps

1. **Explore More Personas**
   - Try different personas for the same question
   - Compare responses and insights

2. **Combine with Other Nodes**
   - HTTP Request: Fetch external data
   - Google Sheets: Store results
   - Slack/Teams: Share insights
   - IF conditions: Act based on AI response

3. **Build Complex Workflows**
   - Multi-step analysis
   - Conditional routing based on insights
   - Scheduled reports with multiple AI analyses

4. **Check Advanced Features**
   - Conversation continuity
   - Batch processing multiple questions
   - Integration with webhooks

## 📚 More Resources

- [Full Documentation](./DEVELOPMENT.md)
- [Draiven Platform](https://app.draiven.io)
- [Draiven API Docs](https://api.draiven.io/docs)
- [n8n Community Forum](https://community.n8n.io)

## 💡 Need Help?

- 📧 Email: support@draiven.ai
- 🐛 Report bugs: [GitHub Issues](https://github.com/draiven-io/n8n-nodes-draiven/issues)
- 💬 Community: [Draiven Discord](#) (coming soon)

---

**Happy Automating! 🚀**

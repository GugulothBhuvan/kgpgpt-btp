# Conversation Storage Setup Guide

This guide will help you set up database storage for chat conversations using Supabase.

---

## 📋 Overview

You now have a complete conversation storage system that:
- ✅ Stores all chat conversations in Supabase PostgreSQL
- ✅ Associates conversations with authenticated users
- ✅ Provides full CRUD operations for conversations and messages
- ✅ Implements Row Level Security (RLS) for data privacy
- ✅ Auto-generates conversation titles from first message
- ✅ Supports conversation history for AI context

---

## 🗄️ Database Schema

### Tables Created:

**1. `conversations`**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (TEXT, default: "New Conversation")
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `is_active` (BOOLEAN)

**2. `messages`**
- `id` (UUID, Primary Key)
- `conversation_id` (UUID, Foreign Key to conversations)
- `role` (TEXT: 'user', 'assistant', 'system')
- `content` (TEXT)
- `metadata` (JSONB for additional data)
- `created_at` (TIMESTAMP)

---

## 🚀 Setup Steps

### Step 1: Run SQL Schema in Supabase

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the contents of `kgpgpt/supabase/schema.sql`
6. Paste it into the SQL editor
7. Click "Run" to execute

**Expected Result:**
```
Success. No rows returned.
```

This creates:
- ✅ 2 tables (conversations, messages)
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Triggers for auto-updating timestamps
- ✅ Trigger for auto-generating conversation titles

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages');
```

**Expected Result:**
```
conversations
messages
```

### Step 3: Test the API Endpoints

Once the tables are created, you can test the conversation API:

#### Create a New Conversation
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Chat"}'
```

#### Get All Conversations
```bash
curl http://localhost:3000/api/conversations
```

#### Get a Specific Conversation
```bash
curl http://localhost:3000/api/conversations/{conversation_id}
```

#### Add a Message
```bash
curl -X POST http://localhost:3000/api/conversations/{conversation_id}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "Hello, who is the director of IIT Kharagpur?",
    "metadata": {"source": "web"}
  }'
```

---

## 📡 API Endpoints

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Get all user's conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/[id]` | Get conversation with messages |
| PATCH | `/api/conversations/[id]` | Update conversation |
| DELETE | `/api/conversations/[id]` | Delete conversation |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations/[id]/messages` | Get all messages |
| POST | `/api/conversations/[id]/messages` | Add a message |

---

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- ✅ Users can only see their own conversations
- ✅ Users can only see messages from their conversations
- ✅ Users cannot access other users' data
- ✅ All operations are authenticated

### Authentication

All API endpoints require:
- Valid Supabase session cookie
- User must be logged in
- Returns 401 Unauthorized if not authenticated

---

## 💻 Usage in Code

### ConversationService Methods

```typescript
import { ConversationService } from '@/lib/services/conversation-service';

// Create conversation
const conversation = await ConversationService.createConversation(
  userId, 
  'Chat about IIT KGP'
);

// Get user's conversations
const conversations = await ConversationService.getUserConversations(userId);

// Add message
const message = await ConversationService.addMessage(
  conversationId,
  'user',
  'What is IIT Kharagpur?',
  { timestamp: Date.now() }
);

// Get conversation history (formatted for AI)
const history = await ConversationService.getFormattedHistory(
  conversationId,
  10 // last 10 messages
);

// Get all messages
const messages = await ConversationService.getConversationMessages(conversationId);

// Update title
await ConversationService.updateConversationTitle(conversationId, 'New Title');

// Delete conversation
await ConversationService.deleteConversation(conversationId);
```

---

## 🔄 Integrating with Chat Interface

To integrate conversation storage with your existing chat:

### 1. Update Query Route

Modify `app/api/query/route.ts` to save messages:

```typescript
import { ConversationService } from '@/lib/services/conversation-service';

export async function POST(request: NextRequest) {
  // ... existing code ...
  
  const { query, conversationId } = await request.json();
  
  // Save user message
  await ConversationService.addMessage(
    conversationId,
    'user',
    query
  );
  
  // Process query and get response
  const result = await orchestrator.process({ query, ... });
  
  // Save assistant response
  await ConversationService.addMessage(
    conversationId,
    'assistant',
    result.response.response,
    {
      confidence: result.response.confidence,
      sources: result.response.sources
    }
  );
  
  // ... return response ...
}
```

### 2. Update ChatInterface Component

Modify `components/ChatInterface.tsx`:

```typescript
const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

// Create conversation on first message
useEffect(() => {
  if (!currentConversationId && user) {
    createNewConversation();
  }
}, [user]);

async function createNewConversation() {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Chat' })
  });
  const { conversation } = await response.json();
  setCurrentConversationId(conversation.id);
}

// Load conversation history
async function loadConversation(conversationId: string) {
  const response = await fetch(`/api/conversations/${conversationId}`);
  const { messages } = await response.json();
  setMessages(messages);
}
```

---

## 📊 Database Queries (for debugging)

### View All Conversations
```sql
SELECT * FROM conversations 
ORDER BY updated_at DESC;
```

### View All Messages for a Conversation
```sql
SELECT * FROM messages 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at ASC;
```

### Count Messages per Conversation
```sql
SELECT 
  c.id,
  c.title,
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.title
ORDER BY c.updated_at DESC;
```

### Get Recent Activity
```sql
SELECT 
  c.title,
  m.role,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
ORDER BY m.created_at DESC
LIMIT 20;
```

---

## 🎯 Features Implemented

- ✅ **Conversation Management**: Create, read, update, delete conversations
- ✅ **Message Storage**: Store all user and assistant messages
- ✅ **Auto-Titles**: First user message becomes conversation title
- ✅ **Metadata Support**: Store additional data with messages (confidence, sources, etc.)
- ✅ **History Retrieval**: Get formatted conversation history for AI context
- ✅ **User Isolation**: RLS ensures users only see their own data
- ✅ **Timestamps**: Auto-updated timestamps on changes
- ✅ **Cascading Deletes**: Deleting conversation removes all messages

---

## 🧪 Testing

### Test 1: Create and Retrieve Conversation
```bash
# Create conversation
CONV_ID=$(curl -s -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}' | jq -r '.conversation.id')

echo "Created conversation: $CONV_ID"

# Retrieve it
curl http://localhost:3000/api/conversations/$CONV_ID | jq
```

### Test 2: Add Messages
```bash
# Add user message
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello!"}'

# Add assistant message
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "assistant", "content": "Hi! How can I help?"}'

# Get all messages
curl http://localhost:3000/api/conversations/$CONV_ID/messages | jq
```

---

## 🐛 Troubleshooting

### Issue: Tables not created
**Solution:** Re-run the schema.sql in Supabase SQL Editor. Check for error messages.

### Issue: 401 Unauthorized
**Solution:** Make sure you're logged in. Check that Supabase session is active.

### Issue: RLS Policy errors
**Solution:** Verify that the policies were created correctly:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');
```

### Issue: Cannot see data in Supabase Dashboard
**Solution:** RLS is enabled. You need to query as a specific user or disable RLS temporarily for viewing:
```sql
-- Temporarily disable RLS (for debugging only)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Re-enable after debugging
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

---

## 📈 Next Steps

1. ✅ Run the SQL schema in Supabase
2. ✅ Test the API endpoints
3. ✅ Integrate with your chat interface
4. ✅ Add conversation sidebar to UI
5. ✅ Implement conversation switching
6. ✅ Add export conversation feature

---

## 🎨 Optional: Add Conversation Sidebar UI

Create a sidebar component to show conversation list:

```typescript
// components/ConversationList.tsx
export function ConversationList() {
  const [conversations, setConversations] = useState([]);
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  async function loadConversations() {
    const response = await fetch('/api/conversations');
    const { conversations } = await response.json();
    setConversations(conversations);
  }
  
  return (
    <div className="conversation-list">
      {conversations.map(conv => (
        <div key={conv.id} onClick={() => selectConversation(conv.id)}>
          {conv.title}
        </div>
      ))}
    </div>
  );
}
```

---

Your conversation storage system is ready! 🎉


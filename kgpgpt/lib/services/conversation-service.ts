import { cookies } from 'next/headers';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export class ConversationService {
  /**
   * Create a new conversation
   */
  static async createConversation(userId: string, title?: string): Promise<Conversation | null> {
    try {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || 'New Conversation'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Get a specific conversation
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message | null> {
    try {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      // Update conversation updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * Get all messages in a conversation
   */
  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<boolean> {
    try {
      const supabase = createServerClient();
      
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const supabase = createServerClient();
      
      // Messages will be automatically deleted due to CASCADE
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Mark conversation as active/inactive
   */
  static async setConversationActive(
    conversationId: string,
    isActive: boolean
  ): Promise<boolean> {
    try {
      const supabase = createServerClient();
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_active: isActive })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation status:', error);
      return false;
    }
  }

  /**
   * Get conversation history formatted for AI
   */
  static async getFormattedHistory(
    conversationId: string,
    maxMessages: number = 10
  ): Promise<Array<{ role: string; content: string }>> {
    try {
      const messages = await this.getConversationMessages(conversationId);
      
      // Get the last N messages
      const recentMessages = messages.slice(-maxMessages);
      
      return recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    } catch (error) {
      console.error('Error getting formatted history:', error);
      return [];
    }
  }
}

// Helper function to create server client
function createServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return require('@supabase/supabase-js').createClient(
    supabaseUrl,
    supabaseServiceKey
  );
}


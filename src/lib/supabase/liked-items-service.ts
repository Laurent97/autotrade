import { supabase } from './client';
import { LikedItem, LikedItemsResponse, LikeResponse, LikeStatus, LikedItemData } from '../types/liked-items';

export class LikedItemsService {
  // Like an item
  static async likeItem(itemType: string, itemId: string, itemData: LikedItemData): Promise<LikeResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existing } = await supabase
        .from('liked_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .limit(1);

      if (existing && existing.length > 0) {
        // Unlike if already liked
        await this.unlikeItem(itemType, itemId);
        return { success: true, isLiked: false, totalLikes: 0 };
      }

      // Prepare insert data - handle case where item_data column might not exist
      const insertData: any = {
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        liked_at: new Date().toISOString(),
      };

      // Only add item_data if the column exists
      try {
        insertData.item_data = itemData;
      } catch (error) {
        console.warn('item_data column might not exist, proceeding without it:', error);
      }

      // Add new like
      const { data, error } = await supabase
        .from('liked_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // If error is about item_data column, try without it
        if (error.message.includes('item_data')) {
          console.warn('item_data column not found, trying without it');
          const { data: dataWithoutItemData, error: errorWithoutItemData } = await supabase
            .from('liked_items')
            .insert({
              user_id: user.id,
              item_id: itemId,
              item_type: itemType,
              liked_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (errorWithoutItemData) throw errorWithoutItemData;
          // Get total likes count
          const { count } = await supabase
            .from('liked_items')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', itemId)
            .eq('item_type', itemType);

          return {
            success: true,
            isLiked: true,
            totalLikes: count || 1,
          };
        }
        throw error;
      }

      // Get total likes count
      const { count } = await supabase
        .from('liked_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      return {
        success: true,
        isLiked: true,
        totalLikes: count || 1,
      };
    } catch (error) {
      console.error('Error liking item:', error);
      return { success: false, isLiked: false, totalLikes: 0, message: error.message };
    }
  }

  // Unlike an item
  static async unlikeItem(itemType: string, itemId: string): Promise<LikeResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('liked_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) throw error;

      // Get total likes count
      const { count } = await supabase
        .from('liked_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      return {
        success: true,
        isLiked: false,
        totalLikes: count || 0,
      };
    } catch (error) {
      console.error('Error unliking item:', error);
      return { success: false, isLiked: false, totalLikes: 0, message: error.message };
    }
  }

  // Get all liked items for a user
  static async getLikedItems(page = 1, limit = 20, itemType?: string): Promise<LikedItemsResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('liked_items')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false });

      // Try to filter by status if item_data column exists
      try {
        query = query.eq('item_data->>status', 'active');
      } catch (error) {
        console.warn('item_data column might not exist, skipping status filter');
      }

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > to + 1,
      };
    } catch (error) {
      console.error('Error fetching liked items:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }
  }

  // Check if an item is liked
  static async getLikeStatus(itemType: string, itemId: string): Promise<LikeStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isLiked: false, totalLikes: 0 };

      // Check if user liked this item
      const { data: userLike } = await supabase
        .from('liked_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();

      // Get total likes count
      const { count } = await supabase
        .from('liked_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      return {
        isLiked: !!userLike,
        totalLikes: count || 0,
      };
    } catch (error) {
      console.error('Error checking like status:', error);
      return { isLiked: false, totalLikes: 0 };
    }
  }

  // Get liked items by type
  static async getLikedItemsByType(itemType: string, page = 1, limit = 20): Promise<LikedItemsResponse> {
    return this.getLikedItems(page, limit, itemType);
  }

  // Remove multiple liked items
  static async removeMultipleItems(itemIds: string[]): Promise<{ success: boolean; removed: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('liked_items')
        .delete()
        .eq('user_id', user.id)
        .in('item_id', itemIds);

      if (error) throw error;

      return { success: true, removed: data?.length || 0 };
    } catch (error) {
      console.error('Error removing multiple items:', error);
      return { success: false, removed: 0 };
    }
  }

  // Search within liked items
  static async searchLikedItems(query: string, page = 1, limit = 20): Promise<LikedItemsResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let queryBuilder = supabase
        .from('liked_items')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false });

      // Try to add search filters if item_data column exists
      try {
        queryBuilder = queryBuilder
          .eq('item_data->>status', 'active')
          .or(`item_data->>title.ilike.%${query}%,item_data->>description.ilike.%${query}%,item_data->>make.ilike.%${query}%,item_data->>model.ilike.%${query}%`);
      } catch (error) {
        console.warn('item_data column might not exist, using basic search');
        // Fallback to basic search without item_data filters
        queryBuilder = queryBuilder.or(`item_id.ilike.%${query}%,item_type.ilike.%${query}%`);
      }

      const { data, error, count } = await queryBuilder.range(from, to);

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > to + 1,
      };
    } catch (error) {
      console.error('Error searching liked items:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }
  }
}

export default LikedItemsService;

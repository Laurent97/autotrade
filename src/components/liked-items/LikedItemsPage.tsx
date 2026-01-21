import { useState, useMemo } from 'react';
import { Search, Grid, List, Download, Share2, Trash2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LikedItemCard, LikedItemGrid, LikedItemList } from './LikedItemCard';
import { EmptyLikedState, EmptyLikedStateSkeleton } from './EmptyLikedState';
import { useLikedItems, useSearchLikedItems } from '@/hooks/useLikedItems';
import { toast } from '@/hooks/use-toast';

interface LikedItemsPageProps {
  className?: string;
}

export function LikedItemsPage({ className }: LikedItemsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'price-low' | 'price-high'>('recent');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch liked items
  const { items, totalCount, isLoading, error, refetch, removeMultiple, removeMultipleMutation } = useLikedItems({
    itemType: filterType === 'all' ? undefined : filterType,
  });

  // Search results
  const { data: searchResults, isLoading: isSearching } = useSearchLikedItems(searchQuery);

  // Determine which items to display
  const displayItems = useMemo(() => {
    let itemsToProcess = searchQuery ? (searchResults?.items || []) : items;

    // Apply sorting
    return itemsToProcess.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime();
        case 'alphabetical':
          return (a.item_data.title || '').localeCompare(b.item_data.title || '');
        case 'price-low':
          return (a.item_data.price || 0) - (b.item_data.price || 0);
        case 'price-high':
          return (b.item_data.price || 0) - (a.item_data.price || 0);
        default:
          return 0;
      }
    });
  }, [items, searchResults, searchQuery, sortBy]);

  const isLoadingItems = isLoading || (searchQuery && isSearching);

  // Handle selection
  const handleSelectItem = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(displayItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // Handle bulk actions
  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;
    
    await removeMultiple(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  const handleExport = () => {
    const dataToExport = displayItems.map(item => ({
      title: item.item_data.title,
      price: item.item_data.price,
      category: item.item_data.category,
      type: item.item_type,
      liked_at: item.liked_at,
      link: item.item_data.slug,
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liked-items-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `${displayItems.length} items exported`,
    });
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/liked-items`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: 'Share your liked items collection',
    });
  };

  // Get item type counts
  const itemTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.item_type] = (counts[item.item_type] || 0) + 1;
    });
    return counts;
  }, [items]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading liked items</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Liked Items
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {totalCount} item{totalCount !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveSelected}
                disabled={removeMultipleMutation.isPending}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Remove ({selectedItems.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} className="text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">📥</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="text-xs sm:text-sm">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
              <span className="sm:hidden">🔗</span>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search liked items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Types ({totalCount})
              </SelectItem>
              {Object.entries(itemTypeCounts).map(([type, count]) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Liked</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedItems.size === displayItems.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                {selectedItems.size} of {displayItems.length} selected
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoadingItems ? (
        <EmptyLikedStateSkeleton />
      ) : displayItems.length === 0 ? (
        <EmptyLikedState
          type={searchQuery ? 'search' : filterType !== 'all' ? 'filtered' : 'all'}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />
      ) : (
        <>
          {/* Selection checkbox for all items */}
          {selectedItems.size > 0 && (
            <div className="mb-4">
              <Checkbox
                checked={selectedItems.size === displayItems.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              />
            </div>
          )}

          {/* Items */}
          {viewMode === 'grid' ? (
            <LikedItemGrid>
              {displayItems.map((item) => (
                <LikedItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={(selected) => handleSelectItem(item.id, selected)}
                  onRemove={() => removeMultiple([item.id])}
                />
              ))}
            </LikedItemGrid>
          ) : (
            <LikedItemList>
              {displayItems.map((item) => (
                <LikedItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={(selected) => handleSelectItem(item.id, selected)}
                  onRemove={() => removeMultiple([item.id])}
                />
              ))}
            </LikedItemList>
          )}
        </>
      )}
    </div>
  );
}

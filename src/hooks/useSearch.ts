import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Post } from '../lib/types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 400);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Fetch posts with profiles, reactions and comment counts to match Post type
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          reactions (type),
          comments (id)
        `)
        .or(`content.ilike.%${searchTerm}%,mood.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        // Transform the data to match the Post type structure
        const transformedData: Post[] = data.map((post: any) => {
          // Process reactions to get counts by type
          const reactionCounts = post.reactions?.reduce((acc: any, curr: any) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
          }, {});

          const formattedReactions = Object.entries(reactionCounts || {}).map(([type, count]) => ({
            type,
            count: count as number
          }));

          return {
            ...post,
            reactions: formattedReactions,
            comment_count: post.comments?.length || 0
          };
        });

        setResults(transformedData);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    hasSearched
  };
}


import { useState, useMemo } from 'react';
import { differenceInDays, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface FilterOptions {
  status?: 'all' | 'active' | 'expiring' | 'expired';
  authority?: string;
  dateRange?: 'all' | 'thisMonth' | 'thisYear' | 'custom';
}

export const useSearch = <T extends Record<string, any>>(
  items: T[],
  searchFields: (keyof T)[],
  filterConfig?: {
    getStatus?: (item: T) => 'active' | 'expiring' | 'expired';
    getDate?: (item: T) => string;
    getAuthority?: (item: T) => string;
  }
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all' && filterConfig?.getStatus) {
      result = result.filter(item => {
        const status = filterConfig.getStatus!(item);
        return status === filters.status;
      });
    }

    // Apply authority filter
    if (filters.authority && filterConfig?.getAuthority) {
      const authorityQuery = filters.authority.toLowerCase();
      result = result.filter(item => {
        const authority = filterConfig.getAuthority!(item);
        return authority && authority.toLowerCase().includes(authorityQuery);
      });
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all' && filterConfig?.getDate) {
      const now = new Date();
      result = result.filter(item => {
        const dateStr = filterConfig.getDate!(item);
        if (!dateStr) return false;
        
        const date = parseISO(dateStr);
        
        switch (filters.dateRange) {
          case 'thisMonth':
            return isWithinInterval(date, {
              start: startOfMonth(now),
              end: endOfMonth(now)
            });
          case 'thisYear':
            return isWithinInterval(date, {
              start: startOfYear(now),
              end: endOfYear(now)
            });
          default:
            return true;
        }
      });
    }

    return result;
  }, [items, searchQuery, filters, searchFields, filterConfig]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredItems,
    resultCount: filteredItems.length,
    totalCount: items.length
  };
};

// Helper function for license status
export const getLicenseStatus = (expiryDate: string): 'active' | 'expiring' | 'expired' => {
  const days = differenceInDays(parseISO(expiryDate), new Date());
  
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
};

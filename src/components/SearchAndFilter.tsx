
import { useState } from 'react';
import { Search, Filter, X, Calendar, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  searchQuery: string;
  activeFilters: FilterOptions;
}

interface FilterOptions {
  status?: 'all' | 'active' | 'expiring' | 'expired';
  authority?: string;
  dateRange?: 'all' | 'thisMonth' | 'thisYear' | 'custom';
}

const SearchAndFilter = ({ onSearch, onFilter, searchQuery, activeFilters }: SearchAndFilterProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' }
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    onFilter(newFilters);
  };

  const clearFilters = () => {
    onFilter({});
    setIsFilterOpen(false);
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => 
      value && value !== 'all'
    ).length;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by license number, name, or authority..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Popover */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="relative gap-2 bg-white border-gray-200 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white border shadow-lg" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Filters</h4>
              {getActiveFilterCount() > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                License Status
              </Label>
              <Select 
                value={activeFilters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Date Range
              </Label>
              <Select 
                value={activeFilters.dateRange || 'all'} 
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Authority Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Issuing Authority</Label>
              <Input
                placeholder="Filter by authority..."
                value={activeFilters.authority || ''}
                onChange={(e) => handleFilterChange('authority', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchAndFilter;
export type { FilterOptions };

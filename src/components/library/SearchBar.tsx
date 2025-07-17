'use client';

import React, { useState, useEffect } from 'react';
import { Input, AutoComplete, Tag, Space, Typography } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { Paper } from '@/lib/types';

const { Text } = Typography;

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: SearchFilter[]) => void;
  className?: string;
}

interface SearchFilter {
  type: 'author' | 'tag' | 'year' | 'title';
  value: string;
}

interface SearchSuggestion {
  value: string;
  label: React.ReactNode;
  type: 'paper' | 'author' | 'tag';
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterChange,
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  
  const { papers } = useAppStore();

  // Generate search suggestions
  useEffect(() => {
    if (searchValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = searchValue.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Paper title suggestions
    papers.forEach(paper => {
      if (paper.title.toLowerCase().includes(query)) {
        newSuggestions.push({
          value: paper.title,
          label: (
            <div className="flex items-center space-x-2">
              <Text strong>📄</Text>
              <Text ellipsis className="flex-1">{paper.title}</Text>
            </div>
          ),
          type: 'paper',
        });
      }
    });

    // Author suggestions
    const authors = new Set<string>();
    papers.forEach(paper => {
      paper.authors.forEach(author => {
        if (author.toLowerCase().includes(query) && !authors.has(author)) {
          authors.add(author);
          newSuggestions.push({
            value: `author:${author}`,
            label: (
              <div className="flex items-center space-x-2">
                <Text strong>👤</Text>
                <Text>{author}</Text>
                <Tag size="small">Author</Tag>
              </div>
            ),
            type: 'author',
          });
        }
      });
    });

    // Tag suggestions
    const tags = new Set<string>();
    papers.forEach(paper => {
      paper.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query) && !tags.has(tag)) {
          tags.add(tag);
          newSuggestions.push({
            value: `tag:${tag}`,
            label: (
              <div className="flex items-center space-x-2">
                <Text strong>🏷️</Text>
                <Text>{tag}</Text>
                <Tag size="small">Tag</Tag>
              </div>
            ),
            type: 'tag',
          });
        }
      });
    });

    setSuggestions(newSuggestions.slice(0, 10));
  }, [searchValue, papers]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    // Parse search filters
    const filters: SearchFilter[] = [];
    let cleanQuery = value;

    // Extract author filters
    const authorMatches = value.match(/author:([^\s]+)/g);
    if (authorMatches) {
      authorMatches.forEach(match => {
        const author = match.replace('author:', '');
        filters.push({ type: 'author', value: author });
        cleanQuery = cleanQuery.replace(match, '').trim();
      });
    }

    // Extract tag filters
    const tagMatches = value.match(/tag:([^\s]+)/g);
    if (tagMatches) {
      tagMatches.forEach(match => {
        const tag = match.replace('tag:', '');
        filters.push({ type: 'tag', value: tag });
        cleanQuery = cleanQuery.replace(match, '').trim();
      });
    }

    // Extract year filters
    const yearMatches = value.match(/year:(\d{4})/g);
    if (yearMatches) {
      yearMatches.forEach(match => {
        const year = match.replace('year:', '');
        filters.push({ type: 'year', value: year });
        cleanQuery = cleanQuery.replace(match, '').trim();
      });
    }

    setActiveFilters(filters);
    onFilterChange?.(filters);
    onSearch(cleanQuery);
  };

  const handleSelect = (value: string) => {
    setSearchValue(value);
    handleSearch(value);
  };

  const removeFilter = (filterToRemove: SearchFilter) => {
    const newFilters = activeFilters.filter(f => 
      !(f.type === filterToRemove.type && f.value === filterToRemove.value)
    );
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
    
    // Update search value to remove the filter
    let newSearchValue = searchValue;
    const filterString = `${filterToRemove.type}:${filterToRemove.value}`;
    newSearchValue = newSearchValue.replace(filterString, '').trim();
    setSearchValue(newSearchValue);
    onSearch(newSearchValue);
  };

  const clearAll = () => {
    setSearchValue('');
    setActiveFilters([]);
    onFilterChange?.([]);
    onSearch('');
  };

  const getFilterColor = (type: string) => {
    switch (type) {
      case 'author': return 'blue';
      case 'tag': return 'green';
      case 'year': return 'orange';
      default: return 'default';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <AutoComplete
        value={searchValue}
        options={suggestions}
        onSelect={handleSelect}
        onSearch={handleSearch}
        className="w-full"
      >
        <Input
          size="large"
          placeholder="Search papers, authors, tags... (e.g., author:Smith tag:AI year:2023)"
          prefix={<SearchOutlined />}
          suffix={
            searchValue && (
              <CloseOutlined 
                className="cursor-pointer text-gray-400 hover:text-gray-600"
                onClick={clearAll}
              />
            )
          }
        />
      </AutoComplete>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Text type="secondary" className="text-sm">
            Filters:
          </Text>
          {activeFilters.map((filter, index) => (
            <Tag
              key={`${filter.type}-${filter.value}-${index}`}
              closable
              color={getFilterColor(filter.type)}
              onClose={() => removeFilter(filter)}
            >
              {filter.type}: {filter.value}
            </Tag>
          ))}
        </div>
      )}

      {/* Search Tips */}
      {searchValue.length === 0 && (
        <div className="text-xs text-gray-500">
          <Space wrap>
            <span>💡 Tips:</span>
            <span>author:Smith</span>
            <span>tag:AI</span>
            <span>year:2023</span>
            <span>Or just type to search everything</span>
          </Space>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

'use client';

import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Button, Space, Tooltip, Input, Spin } from 'antd';
import {
  BulbOutlined,
  SearchOutlined,
  BookOutlined,
  LinkOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Paper, Concept } from '@/lib/types';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { ANALYSIS_TYPES } from '@/lib/constants';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface ConceptExtractorProps {
  paper: Paper;
  className?: string;
}

const ConceptExtractor: React.FC<ConceptExtractorProps> = ({
  paper,
  className = '',
}) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<Concept[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const { analyzeDocument, isAnalyzing } = useAIAnalysis();

  useEffect(() => {
    extractConcepts();
  }, [paper.id]);

  useEffect(() => {
    filterConcepts();
  }, [concepts, searchTerm, selectedImportance]);

  const extractConcepts = async () => {
    try {
      const result = await analyzeDocument(paper, ANALYSIS_TYPES.CONCEPTS);
      if (result) {
        // Parse the AI response to extract concepts
        const parsedConcepts = parseConceptsFromResponse(result);
        setConcepts(parsedConcepts);
      }
    } catch (error) {
      console.error('Error extracting concepts:', error);
    }
  };

  const parseConceptsFromResponse = (response: string): Concept[] => {
    // This is a simplified parser - in a real implementation, you'd want more robust parsing
    const concepts: Concept[] = [];
    const lines = response.split('\n');
    
    let currentConcept: Partial<Concept> = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        // New concept term
        if (currentConcept.term) {
          concepts.push(currentConcept as Concept);
        }
        currentConcept = {
          term: trimmed.replace(/\*\*/g, ''),
          definition: '',
          importance: 'medium',
          relatedTerms: [],
        };
      } else if (trimmed.startsWith('Definition:')) {
        currentConcept.definition = trimmed.replace('Definition:', '').trim();
      } else if (trimmed.startsWith('Importance:')) {
        const importance = trimmed.replace('Importance:', '').trim().toLowerCase();
        currentConcept.importance = ['high', 'medium', 'low'].includes(importance) 
          ? importance as 'high' | 'medium' | 'low' 
          : 'medium';
      } else if (trimmed.startsWith('Related:')) {
        const related = trimmed.replace('Related:', '').trim();
        currentConcept.relatedTerms = related.split(',').map(t => t.trim()).filter(Boolean);
      }
    });
    
    // Add the last concept
    if (currentConcept.term) {
      concepts.push(currentConcept as Concept);
    }
    
    return concepts;
  };

  const filterConcepts = () => {
    let filtered = concepts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(concept =>
        concept.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.relatedTerms.some(term => 
          term.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by importance
    if (selectedImportance !== 'all') {
      filtered = filtered.filter(concept => concept.importance === selectedImportance);
    }

    setFilteredConcepts(filtered);
  };

  const toggleFavorite = (term: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(term)) {
      newFavorites.delete(term);
    } else {
      newFavorites.add(term);
    }
    setFavorites(newFavorites);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📝';
    }
  };

  const importanceFilters = [
    { key: 'all', label: 'All', count: concepts.length },
    { key: 'high', label: 'High', count: concepts.filter(c => c.importance === 'high').length },
    { key: 'medium', label: 'Medium', count: concepts.filter(c => c.importance === 'medium').length },
    { key: 'low', label: 'Low', count: concepts.filter(c => c.importance === 'low').length },
  ];

  return (
    <Card 
      title={
        <Space>
          <BulbOutlined />
          Key Concepts
        </Space>
      }
      className={className}
      extra={
        <Button 
          onClick={extractConcepts} 
          loading={isAnalyzing}
          size="small"
        >
          Refresh
        </Button>
      }
    >
      {/* Controls */}
      <div className="mb-4 space-y-3">
        <Search
          placeholder="Search concepts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
        />
        
        <div className="flex flex-wrap gap-2">
          {importanceFilters.map(filter => (
            <Button
              key={filter.key}
              size="small"
              type={selectedImportance === filter.key ? 'primary' : 'default'}
              onClick={() => setSelectedImportance(filter.key as any)}
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Concepts List */}
      {isAnalyzing ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-2">Extracting concepts...</div>
        </div>
      ) : (
        <List
          dataSource={filteredConcepts}
          locale={{ emptyText: 'No concepts found' }}
          renderItem={(concept) => (
            <List.Item className="border-b border-gray-100 last:border-b-0">
              <div className="w-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getImportanceIcon(concept.importance)}</span>
                    <Title level={5} className="m-0">
                      {concept.term}
                    </Title>
                    <Tag 
                      color={getImportanceColor(concept.importance)}
                    >
                      {concept.importance}
                    </Tag>
                  </div>
                  
                  <Tooltip title={favorites.has(concept.term) ? 'Remove from favorites' : 'Add to favorites'}>
                    <Button
                      type="text"
                      size="small"
                      icon={
                        favorites.has(concept.term) 
                          ? <StarFilled className="text-yellow-500" />
                          : <StarOutlined />
                      }
                      onClick={() => toggleFavorite(concept.term)}
                    />
                  </Tooltip>
                </div>

                <Paragraph className="text-sm text-gray-700 mb-3">
                  {concept.definition}
                </Paragraph>

                {concept.relatedTerms.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <LinkOutlined className="text-gray-400" />
                    <Text type="secondary" className="text-xs">Related:</Text>
                    <div className="flex flex-wrap gap-1">
                      {concept.relatedTerms.map((term, index) => (
                        <Tag 
                          key={index} 
                          className="cursor-pointer hover:bg-blue-50"
                          onClick={() => setSearchTerm(term)}
                        >
                          {term}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      )}

      {/* Summary */}
      {concepts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredConcepts.length} of {concepts.length} concepts
            </span>
            <span>
              {favorites.size} favorites
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ConceptExtractor;

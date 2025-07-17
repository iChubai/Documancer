'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Button, Empty, Typography, Dropdown, Pagination } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { Paper } from '@/lib/types';
import FileUpload from '@/components/upload/FileUpload';
import { LibraryViewSkeleton } from '@/components/common/LoadingStates';
import PaperCard from '@/components/library/PaperCard';
import { VIEW_MODES } from '@/lib/constants';
import { usePapers } from '@/hooks/usePapers';

const { Search } = Input;
const { Title } = Typography;

const LibraryView: React.FC = () => {
  const {
    setCurrentPaper,
    setCurrentView,
    isLoading,
  } = useAppStore();

  const { papers, deletePaper } = usePapers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>(papers);
  const [showUpload, setShowUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    // Filter papers based on search term
    if (searchTerm) {
      const filtered = papers.filter(paper =>
        paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPapers(filtered);
    } else {
      setFilteredPapers(papers);
    }
    setCurrentPage(1);
  }, [searchTerm, papers]);

  const handlePaperClick = (paper: Paper) => {
    setCurrentPaper(paper.id);
    setCurrentView(VIEW_MODES.READER);
  };

  const handleUploadSuccess = (paperId: string) => {
    setShowUpload(false);
    // Optionally navigate to the uploaded paper
    setCurrentPaper(paperId);
    setCurrentView(VIEW_MODES.READER);
  };

  const handleDeletePaper = async (paper: Paper) => {
    await deletePaper(paper.id);
  };



  const sortMenuItems = [
    {
      key: 'title',
      label: 'Sort by Title',
    },
    {
      key: 'date',
      label: 'Sort by Date',
    },
    {
      key: 'author',
      label: 'Sort by Author',
    },
  ];

  const filterMenuItems = [
    {
      key: 'all',
      label: 'All Papers',
    },
    {
      key: 'recent',
      label: 'Recently Added',
    },
    {
      key: 'favorites',
      label: 'Favorites',
    },
  ];

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPapers = filteredPapers.slice(startIndex, endIndex);

  if (isLoading) {
    return <LibraryViewSkeleton />;
  }

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Title level={2} className="m-0">
            Paper Library
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowUpload(!showUpload)}
            size="large"
          >
            Add Paper
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-4">
          <Search
            placeholder="Search papers, authors, or keywords..."
            allowClear
            size="large"
            className="flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Dropdown menu={{ items: sortMenuItems }} placement="bottomRight">
            <Button icon={<SortAscendingOutlined />} size="large">
              Sort
            </Button>
          </Dropdown>
          
          <Dropdown menu={{ items: filterMenuItems }} placement="bottomRight">
            <Button icon={<FilterOutlined />} size="large">
              Filter
            </Button>
          </Dropdown>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 text-gray-600">
          <span>{filteredPapers.length} papers</span>
          {searchTerm && (
            <span>Filtered from {papers.length} total</span>
          )}
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card className="mb-6">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </Card>
      )}

      {/* Papers Grid */}
      {paginatedPapers.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            searchTerm ? 'No papers found matching your search' : 'No papers in your library yet'
          }
        >
          {!searchTerm && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setShowUpload(true)}
            >
              Add Your First Paper
            </Button>
          )}
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {paginatedPapers.map((paper) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={paper.id}>
                <PaperCard
                  paper={paper}
                  onView={handlePaperClick}
                  onDelete={handleDeletePaper}
                  className="h-full"
                />
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {filteredPapers.length > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={currentPage}
                total={filteredPapers.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} of ${total} papers`
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryView;

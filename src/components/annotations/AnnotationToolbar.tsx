'use client';

import React, { useState } from 'react';
import { Button, Tooltip, Dropdown, ColorPicker, Input, Space, Popover } from 'antd';
import { 
  HighlightOutlined, 
  EditOutlined, 
  BookOutlined, 
  BgColorsOutlined,
  MessageOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { TextSelection, AnnotationColor, ANNOTATION_COLORS } from '@/lib/annotation-types';

interface AnnotationToolbarProps {
  selection: TextSelection | null;
  position?: { x: number; y: number; width: number; height: number } | null;
  onCreateHighlight: (selection: TextSelection, color: AnnotationColor) => void;
  onCreateNote: (selection: TextSelection, content: string) => void;
  onCreateBookmark: (pageNumber: number, title: string) => void;
  visible?: boolean;
  currentPage: number;
}

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  selection,
  position,
  onCreateHighlight,
  onCreateNote,
  onCreateBookmark,
  visible = false,
  currentPage,
}) => {
  const [selectedColor, setSelectedColor] = useState<AnnotationColor>('yellow');
  const [noteContent, setNoteContent] = useState('');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);

  if (!visible || !position) {
    return null;
  }

  const handleCreateHighlight = () => {
    if (selection) {
      onCreateHighlight(selection, selectedColor);
    }
  };

  const handleCreateNote = () => {
    if (selection && noteContent.trim()) {
      onCreateNote(selection, noteContent.trim());
      setNoteContent('');
      setShowNoteInput(false);
    }
  };

  const handleCreateBookmark = () => {
    const title = bookmarkTitle.trim() || `Bookmark - Page ${currentPage}`;
    onCreateBookmark(currentPage, title);
    setBookmarkTitle('');
    setShowBookmarkInput(false);
  };

  const colorOptions = Object.entries(ANNOTATION_COLORS).map(([key, value]) => ({
    key,
    label: (
      <div className="flex items-center space-x-2">
        <div 
          className="w-4 h-4 rounded border"
          style={{ backgroundColor: value }}
        />
        <span className="capitalize">{key}</span>
      </div>
    ),
    onClick: () => setSelectedColor(key as AnnotationColor),
  }));

  const notePopoverContent = (
    <div className="w-64 space-y-3">
      <Input.TextArea
        placeholder="Add your note..."
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        rows={3}
        maxLength={500}
      />
      <div className="flex justify-end space-x-2">
        <Button size="small" onClick={() => setShowNoteInput(false)}>
          Cancel
        </Button>
        <Button 
          type="primary" 
          size="small" 
          onClick={handleCreateNote}
          disabled={!noteContent.trim()}
        >
          Add Note
        </Button>
      </div>
    </div>
  );

  const bookmarkPopoverContent = (
    <div className="w-64 space-y-3">
      <Input
        placeholder={`Bookmark - Page ${currentPage}`}
        value={bookmarkTitle}
        onChange={(e) => setBookmarkTitle(e.target.value)}
        maxLength={100}
      />
      <div className="flex justify-end space-x-2">
        <Button size="small" onClick={() => setShowBookmarkInput(false)}>
          Cancel
        </Button>
        <Button 
          type="primary" 
          size="small" 
          onClick={handleCreateBookmark}
        >
          Add Bookmark
        </Button>
      </div>
    </div>
  );

  const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x - 100, // Center the toolbar
    top: position.y - 50, // Position above the selection
    zIndex: 1000,
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #d9d9d9',
    padding: '8px',
  };

  return (
    <div style={toolbarStyle} className="annotation-toolbar">
      <Space size="small">
        {/* Highlight Button with Color Picker */}
        <Dropdown
          menu={{ items: colorOptions }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Tooltip title={`Highlight (${selectedColor})`}>
            <Button
              type="text"
              icon={<HighlightOutlined />}
              onClick={handleCreateHighlight}
              style={{ 
                color: ANNOTATION_COLORS[selectedColor],
                borderColor: ANNOTATION_COLORS[selectedColor] 
              }}
              className="hover:bg-gray-50"
            />
          </Tooltip>
        </Dropdown>

        {/* Color Picker */}
        <Dropdown
          menu={{ items: colorOptions }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Tooltip title="Choose highlight color">
            <Button
              type="text"
              icon={<BgColorsOutlined />}
              size="small"
              className="hover:bg-gray-50"
            />
          </Tooltip>
        </Dropdown>

        {/* Note Button */}
        <Popover
          content={notePopoverContent}
          title="Add Note"
          trigger="click"
          open={showNoteInput}
          onOpenChange={setShowNoteInput}
          placement="bottom"
        >
          <Tooltip title="Add note">
            <Button
              type="text"
              icon={<MessageOutlined />}
              className="hover:bg-gray-50"
            />
          </Tooltip>
        </Popover>

        {/* Bookmark Button */}
        <Popover
          content={bookmarkPopoverContent}
          title="Add Bookmark"
          trigger="click"
          open={showBookmarkInput}
          onOpenChange={setShowBookmarkInput}
          placement="bottom"
        >
          <Tooltip title="Add bookmark">
            <Button
              type="text"
              icon={<BookOutlined />}
              className="hover:bg-gray-50"
            />
          </Tooltip>
        </Popover>
      </Space>
    </div>
  );
};

export default AnnotationToolbar;

'use client';

import { useState } from 'react';

interface ExpandableDescriptionProps {
  description: string;
  maxLines?: number;
  className?: string;
  expandedClassName?: string;
}

export default function ExpandableDescription({
  description,
  maxLines = 2,
  className = '',
  expandedClassName = ''
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show toggle for short descriptions
  const shouldShowToggle = description.length > 100;

  return (
    <div className={className}>
      <p
        className={`whitespace-pre-wrap ${
          !isExpanded && shouldShowToggle ? `line-clamp-${maxLines}` : ''
        } ${isExpanded ? expandedClassName : ''}`}
        style={!isExpanded && shouldShowToggle ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        } : {}}
      >
        {description}
      </p>
      {shouldShowToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-sm font-semibold text-gray-600 hover:text-gray-800 mt-1 transition-colors"
        >
          {isExpanded ? 'Show less' : '...more'}
        </button>
      )}
    </div>
  );
}

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
    <div className={className} suppressHydrationWarning>
      <p
        className={`whitespace-pre-wrap ${isExpanded ? expandedClassName : ''}`}
        style={!isExpanded && shouldShowToggle ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        } : {}}
        suppressHydrationWarning
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
          suppressHydrationWarning
        >
          {isExpanded ? 'Show less' : '...more'}
        </button>
      )}
    </div>
  );
}

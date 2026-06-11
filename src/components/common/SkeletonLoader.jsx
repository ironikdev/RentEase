import React from 'react';

export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-brand-section border border-brand-border rounded-xl overflow-hidden p-4 space-y-4">
            {/* Thumbnail */}
            <div className="aspect-[16/9] w-full rounded-lg shimmer-bg" />
            {/* Details */}
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded shimmer-bg" />
              <div className="h-3 w-1/2 rounded shimmer-bg" />
              <div className="h-3 w-5/6 rounded shimmer-bg" />
            </div>
          </div>
        );
      
      case 'detail':
        return (
          <div className="space-y-6">
            {/* Full-width image */}
            <div className="h-72 sm:h-96 w-full rounded-xl shimmer-bg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 w-2/3 rounded shimmer-bg" />
                <div className="h-4 w-1/3 rounded shimmer-bg" />
                <div className="space-y-2 pt-4">
                  <div className="h-4 w-full rounded shimmer-bg" />
                  <div className="h-4 w-5/6 rounded shimmer-bg" />
                  <div className="h-4 w-4/5 rounded shimmer-bg" />
                </div>
              </div>
              <div className="space-y-4">
                {/* Sticky sidebar mock */}
                <div className="h-64 rounded-xl shimmer-bg-dark" />
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-4">
            {items.map((_, i) => (
              <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="w-10 h-10 rounded-full shimmer-bg flex-shrink-0" />
                <div className="space-y-1">
                  <div className="h-8 w-48 sm:w-64 rounded-lg shimmer-bg" />
                  <div className="h-3 w-16 rounded shimmer-bg" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'chat-list':
        return (
          <div className="space-y-3">
            {items.map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-brand-section/40 rounded-xl border border-brand-border/30">
                <div className="w-12 h-12 rounded-full shimmer-bg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded shimmer-bg" />
                  <div className="h-3 w-2/3 rounded shimmer-bg" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'kpi':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((_, i) => (
              <div key={i} className="bg-brand-section border border-brand-border rounded-xl p-4 space-y-3">
                <div className="h-4 w-1/2 rounded shimmer-bg-dark" />
                <div className="h-8 w-3/4 rounded shimmer-bg-dark" />
              </div>
            ))}
          </div>
        );

      case 'table-row':
        return (
          <div className="space-y-2">
            {items.map((_, i) => (
              <div key={i} className="flex gap-4 p-3 bg-brand-section/20 rounded border border-brand-border/30">
                <div className="h-4 w-1/4 rounded shimmer-bg-dark" />
                <div className="h-4 w-1/3 rounded shimmer-bg-dark" />
                <div className="h-4 w-1/6 rounded shimmer-bg-dark" />
                <div className="h-4 w-1/6 rounded shimmer-bg-dark ml-auto" />
              </div>
            ))}
          </div>
        );

      default:
        return <div className="h-10 w-full rounded shimmer-bg" />;
    }
  };

  return (
    <>
      {type === 'card' || type === 'chat-list' || type === 'kpi' || type === 'table-row' ? (
        <div className={type === 'card' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
          {items.map((_, idx) => (
            <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
          ))}
        </div>
      ) : (
        renderSkeleton()
      )}
    </>
  );
};

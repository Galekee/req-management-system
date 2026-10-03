import React from 'react';

export function Skeleton({ width = '100%', height = 16, className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 6, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Skeleton width={48} height={48} style={{ borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
      <Skeleton width="80%" height={12} style={{ marginBottom: 6 }} />
      <Skeleton width="60%" height={12} style={{ marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton width={60} height={22} style={{ borderRadius: 5 }} />
        <Skeleton width={60} height={22} style={{ borderRadius: 5 }} />
      </div>
    </div>
  );
}

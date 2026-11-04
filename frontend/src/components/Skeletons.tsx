// Skeleton loaders for movie cards and sections

export function MovieCardSkeleton() {
  return (
    <div style={{ minWidth: 180, flex: '0 0 180px' }}>
      <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 14, marginTop: 8, borderRadius: 4, width: '80%' }} />
      <div className="skeleton" style={{ height: 12, marginTop: 6, borderRadius: 4, width: '50%' }} />
    </div>
  );
}

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="movies-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 14, marginTop: 8, borderRadius: 4, width: '80%' }} />
          <div className="skeleton" style={{ height: 12, marginTop: 6, borderRadius: 4, width: '50%' }} />
        </div>
      ))}
    </div>
  );
}

export function MovieRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="scroll-row no-scrollbar">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div style={{ minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 300, height: 40, borderRadius: 8, margin: '0 auto 16px' }} />
        <div className="skeleton" style={{ width: 500, height: 20, borderRadius: 4, margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ width: 400, height: 20, borderRadius: 4, margin: '0 auto' }} />
      </div>
    </div>
  );
}

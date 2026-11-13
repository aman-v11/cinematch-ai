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
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 600, padding: 20 }}>
        <div className="skeleton" style={{ width: 280, height: 36, borderRadius: 8, margin: '0 auto 16px' }} />
        <div className="skeleton" style={{ width: '80%', height: 20, borderRadius: 4, margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ width: '60%', height: 20, borderRadius: 4, margin: '0 auto' }} />
      </div>
    </div>
  );
}

export function MovieDetailSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Backdrop skeleton */}
      <div
        className="skeleton"
        style={{
          width: '100%',
          height: 380,
          borderRadius: 20,
          marginBottom: 32,
        }}
      />
      {/* Detail info skeleton */}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div
          className="skeleton"
          style={{
            width: 240,
            aspectRatio: '2/3',
            borderRadius: 16,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="skeleton" style={{ height: 36, width: '60%', borderRadius: 8, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 18, width: '40%', borderRadius: 6, marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <div className="skeleton" style={{ height: 28, width: 80, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 28, width: 80, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 28, width: 80, borderRadius: 14 }} />
          </div>
          <div className="skeleton" style={{ height: 14, width: '100%', borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '75%', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

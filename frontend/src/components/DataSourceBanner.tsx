import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { fetchStatus } from '../lib/api';

export default function DataSourceBanner() {
  const { data } = useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!data || data.dataSource === 'tmdb') return null;

  return (
    <div
      style={{
        background: 'rgba(251,191,36,0.08)',
        borderBottom: '1px solid rgba(251,191,36,0.2)',
        color: 'rgba(251,191,36,0.95)',
        fontSize: 13,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Info size={14} />
      Running on the local development catalog. Add a TMDB API key in backend/.env to load live posters and a larger movie library.
    </div>
  );
}

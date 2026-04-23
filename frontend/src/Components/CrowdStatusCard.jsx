import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const getCrowdStatus = (count) => {
  if (count <= 20) return 'Low';
  if (count <= 50) return 'Medium';
  return 'High';
};

const statusStyles = {
  Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  High: 'bg-red-100 text-red-700 border-red-200',
};

const CrowdStatusCard = ({ canteenId, canteenName }) => {
  const [count, setCount] = useState(0);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const status = useMemo(() => getCrowdStatus(count), [count]);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestCrowd = async () => {
      try {
        const url = canteenId ? `/api/crowd?canteenId=${canteenId}` : '/api/crowd';
        const response = await api.get(url);
        if (!isMounted) return;

        // Support both direct object and wrapped payload responses.
        const payload = response.data?.data || response.data;
        setCount(Number(payload?.count || 0));
        setTimestamp(payload?.timestamp || null);
        setError('');
      } catch (err) {
        if (!isMounted) return;
        console.error(`Failed to fetch latest crowd count for ${canteenName || 'global'}:`, err);
        setError('Unable to fetch live crowd data right now.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLatestCrowd();
    const intervalId = setInterval(fetchLatestCrowd, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [canteenId, canteenName]);

  return (
    <div className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            {canteenName ? `${canteenName} Live Monitor` : 'Live Crowd Monitor'}
          </p>
          <h3 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">
            {loading ? 'Loading...' : `${count} People`}
          </h3>
        </div>

        <div className={`rounded-full border px-4 py-2 text-sm font-['Gilroy_Bold'] ${statusStyles[status]}`}>
          {status}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <p>
          Current people count: <span className="font-['Gilroy_Bold'] text-gray-700">{count}</span>
        </p>
        <p>
          Crowd status: <span className="font-['Gilroy_Bold'] text-gray-700">{status}</span>
        </p>
        <p>
          Last update:{' '}
          <span className="font-['Gilroy_Bold'] text-gray-700">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : 'No data yet'}
          </span>
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CrowdStatusCard;

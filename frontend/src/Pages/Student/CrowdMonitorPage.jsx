import React, { useEffect, useState } from 'react';
import CrowdStatusCard from '../../Components/CrowdStatusCard';
import api from '../../services/api';

const CrowdMonitorPage = () => {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const response = await api.get('/api/canteens');
        // Handle wrapper vs direct array
        const canteensData = response.data?.data || response.data || [];
        setCanteens(canteensData);
        if (canteensData.length > 0) {
          setSelectedCanteenId(canteensData[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch canteens:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCanteens();
  }, []);

  const selectedCanteen = canteens.find(c => c._id === selectedCanteenId);

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-6 px-4">
      <div className="rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 px-8 py-10 text-white shadow-xl shadow-orange-200/40">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-100">QuickEats Live Feed</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-['Gilroy_Heavy'] leading-tight">Canteen Crowd Monitoring</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          This panel updates every 2 seconds from AI camera detection to show current canteen crowd activity in real time.
        </p>
      </div>

      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <label htmlFor="canteen-select" className="mb-2 block text-sm font-['Gilroy_Bold'] text-gray-700">
          Select Canteen to Monitor
        </label>
        <select
          id="canteen-select"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          value={selectedCanteenId}
          onChange={(e) => setSelectedCanteenId(e.target.value)}
          disabled={loading || canteens.length === 0}
        >
          {canteens.map((canteen) => (
            <option key={canteen._id} value={canteen._id}>
              {canteen.name}
            </option>
          ))}
          {canteens.length === 0 && !loading && <option value="">No canteens available</option>}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {loading ? (
          <p className="text-center text-gray-500">Loading canteens...</p>
        ) : selectedCanteen ? (
          <CrowdStatusCard 
            canteenId={selectedCanteen._id} 
            canteenName={selectedCanteen.name} 
          />
        ) : (
          <CrowdStatusCard />
        )}
      </div>

      <div className="rounded-[24px] border border-gray-100 bg-white p-5 text-sm text-gray-600">
        <p className="font-['Gilroy_Bold'] text-gray-900">Status thresholds</p>
        <p className="mt-2">Low: 0-20 people</p>
        <p>Medium: 21-50 people</p>
        <p>High: 51+ people</p>
      </div>
    </section>
  );
};

export default CrowdMonitorPage;

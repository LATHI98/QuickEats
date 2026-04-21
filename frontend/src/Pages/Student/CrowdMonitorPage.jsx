import React from 'react';
import CrowdStatusCard from '../../Components/CrowdStatusCard';

const CrowdMonitorPage = () => {
  return (
    <section className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 px-8 py-10 text-white shadow-xl shadow-orange-200/40">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-100">QuickEats Live Feed</p>
        <h1 className="mt-3 text-4xl font-['Gilroy_Heavy'] leading-tight">Canteen Crowd Monitoring</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          This panel updates every 2 seconds from AI camera detection to show current canteen crowd activity in real time.
        </p>
      </div>

      <CrowdStatusCard />

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

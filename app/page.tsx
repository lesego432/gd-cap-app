'use client';

import { useEffect, useState } from 'react';

interface School {
  school_id: string;
  emis_number: string;
  school_name: string;
  phase: string;
  district_name: string;
  total_capacity: number;
  current_enrollment: number;
  available_desks: number;
  longitude: number;
  latitude: number;
}

export default function Dashboard() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'District Manager' | 'School Principal' | 'Provincial Leadership'>('District Manager');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch('/api/schools');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success) {
          setSchools(json.data);
        }
      } catch (err) {
        console.error('Failed to load schools', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  const filteredSchools = selectedDistrict === 'ALL' 
    ? schools 
    : schools.filter(s => s.district_name === selectedDistrict);

  const totalCapacity = filteredSchools.reduce((acc, s) => acc + s.total_capacity, 0);
  const totalEnrollment = filteredSchools.reduce((acc, s) => acc + s.current_enrollment, 0);
  const netDesks = totalCapacity - totalEnrollment;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Gauteng Department of Education
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">GD-CAP Portal</h1>
            <p className="text-slate-400 text-sm mt-1">District Capacity Allocator & Spatial Intelligence</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Select Portal Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['District Manager', 'School Principal', 'Provincial Leadership'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserRole(role)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      userRole === role
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                        : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {role.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Government Email / Persal ID</label>
              <input
                type="text"
                placeholder="official@gauteng.gov.za"
                defaultValue="district.manager@gauteng.gov.za"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => setIsLoggedIn(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-amber-500/20 text-sm uppercase tracking-wider mt-2"
            >
              Sign In to {userRole} Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans transition-all duration-500">
      {/* Top Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white">
              GD<span className="text-amber-400">-CAP</span>
            </h1>
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-0.5 rounded-full text-xs font-semibold">
              Gauteng Provincial Government
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Gauteng District Capacity Allocator & Decision-Support System
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="text-xs font-bold text-amber-400">{userRole}</p>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-4 py-2 rounded-lg font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter District:</span>
          {['ALL', 'Tshwane South', 'Johannesburg Central'].map((district) => (
            <button
              key={district}
              onClick={() => setSelectedDistrict(district)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedDistrict === district
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {district}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transform transition hover:-translate-y-1">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Total Allocated Capacity</p>
          <p className="text-4xl font-black text-white">{totalCapacity.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transform transition hover:-translate-y-1">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Current Active Enrollment</p>
          <p className="text-4xl font-black text-blue-400">{totalEnrollment.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transform transition hover:-translate-y-1">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Net Provincial Capacity</p>
          <p className={`text-4xl font-black ${netDesks >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {netDesks >= 0 ? `+${netDesks.toLocaleString()}` : netDesks.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Live District Capacity Returns</h2>
          <span className="text-xs text-slate-400">{filteredSchools.length} Schools Reporting</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Querying Neon PostGIS Engine...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-4 px-6">EMIS ID</th>
                  <th className="py-4 px-6">School Name</th>
                  <th className="py-4 px-6">District</th>
                  <th className="py-4 px-6">Capacity</th>
                  <th className="py-4 px-6">Enrollment</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSchools.map((school) => {
                  const isOvercrowded = school.available_desks < 0;
                  return (
                    <tr key={school.school_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-400">{school.emis_number}</td>
                      <td className="py-4 px-6 font-semibold text-white">{school.school_name}</td>
                      <td className="py-4 px-6">{school.district_name}</td>
                      <td className="py-4 px-6">{school.total_capacity}</td>
                      <td className="py-4 px-6">{school.current_enrollment}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                            isOvercrowded
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isOvercrowded
                            ? `${Math.abs(school.available_desks)} Over Capacity`
                            : `${school.available_desks} Desks Available`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
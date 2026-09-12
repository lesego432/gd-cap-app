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

type UserRole = 'District Manager' | 'School Principal' | 'Provincial Leadership';

const ROLE_THEMES: Record<UserRole, { ringBorder: string; dotBg: string; glowRgb: string; badgeBg: string; textAccent: string }> = {
  'Provincial Leadership': {
    ringBorder: 'border-amber-400',
    dotBg: 'bg-amber-400',
    glowRgb: 'rgba(245, 158, 11, 0.15)',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    textAccent: 'text-amber-400',
  },
  'District Manager': {
    ringBorder: 'border-blue-400',
    dotBg: 'bg-blue-400',
    glowRgb: 'rgba(59, 130, 246, 0.15)',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    textAccent: 'text-blue-400',
  },
  'School Principal': {
    ringBorder: 'border-emerald-400',
    dotBg: 'bg-emerald-400',
    glowRgb: 'rgba(16, 185, 129, 0.15)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    textAccent: 'text-emerald-400',
  },
};

export default function Dashboard() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('District Manager');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  // Form State
  const [email, setEmail] = useState('district.manager@gauteng.gov.za');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Operational Action States
  const [actionSuccess, setActionSuccess] = useState('');

  // Mouse & Keyboard Tracking State
  const [pointerPos, setPointerPos] = useState({ x: -100, y: -100, isKeyboard: false });

  // Event Listener for Mouse & Keyboard Focus Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY, isKeyboard: false });
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        setPointerPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          isKeyboard: true,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('focusin', handleFocusIn);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials');
        return;
      }

      const roleMap: Record<string, UserRole> = {
        district: 'District Manager',
        school: 'School Principal',
        provincial: 'Provincial Leadership',
      };

      if (data.user?.role && roleMap[data.user.role]) {
        setUserRole(roleMap[data.user.role]);
      }

      setIsLoggedIn(true);
    } catch {
      setLoginError('Unable to connect to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerAction = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const filteredSchools = selectedDistrict === 'ALL' 
    ? schools 
    : schools.filter(s => s.district_name === selectedDistrict);

  const totalCapacity = filteredSchools.reduce((acc, s) => acc + s.total_capacity, 0);
  const totalEnrollment = filteredSchools.reduce((acc, s) => acc + s.current_enrollment, 0);
  const netDesks = totalCapacity - totalEnrollment;
  const overcrowdedCount = filteredSchools.filter(s => s.available_desks < 0).length;

  const activeTheme = ROLE_THEMES[userRole];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* Dynamic Role-Based Ambient Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${pointerPos.x}px ${pointerPos.y}px, ${activeTheme.glowRgb}, transparent 80%)`,
        }}
      />

      {/* Dynamic Cursor Target Ring (Mouse & Keyboard Tracking Visual) */}
      <div
        className="pointer-events-none fixed z-50 flex items-center justify-center transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${pointerPos.x}px`,
          top: `${pointerPos.y}px`,
        }}
      >
        <div className={`w-8 h-8 rounded-full border-2 ${activeTheme.ringBorder} ${pointerPos.isKeyboard ? 'animate-ping' : 'animate-pulse'} opacity-80 flex items-center justify-center shadow-lg shadow-black/50`}>
          <div className={`w-2 h-2 rounded-full ${activeTheme.dotBg}`} />
        </div>
      </div>

      {/* Ambient Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {!isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 rounded-2xl p-8 max-w-md w-full shadow-2xl transition-all duration-300 hover:shadow-amber-500/5 group">
            <div className="text-center mb-8">
              <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 animate-pulse">
                Gauteng Department of Education
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight group-hover:text-amber-400 transition-colors duration-300">
                GD-CAP Portal
              </h1>
              <p className="text-slate-400 text-sm mt-1">District Capacity Allocator & Spatial Intelligence</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium animate-bounce">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Select Portal Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['District Manager', 'School Principal', 'Provincial Leadership'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setUserRole(role);
                        if (role === 'District Manager') setEmail('district.manager@gauteng.gov.za');
                        if (role === 'School Principal') setEmail('school.principal@gauteng.gov.za');
                        if (role === 'Provincial Leadership') setEmail('provincial.admin@gauteng.gov.za');
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95 ${
                        userRole === role
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="official@gauteng.gov.za"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-amber-500/25 text-sm uppercase tracking-wider mt-2"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  `Sign In to ${userRole} Portal`
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <main className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-white transition-colors cursor-default">
                  GD<span className={activeTheme.textAccent}>-CAP</span>
                </h1>
                <span className={`border px-3 py-0.5 rounded-full text-xs font-semibold animate-pulse ${activeTheme.badgeBg}`}>
                  {userRole} Mode
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {userRole === 'Provincial Leadership' && 'Gauteng Strategic Infrastructure & Resource Allocation Command'}
                {userRole === 'District Manager' && 'District Capacity Balancing & Inter-School Transfer Hub'}
                {userRole === 'School Principal' && 'Live School Intake Management & Facility Capacity Control'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Authorized Personnel</p>
                <p className={`text-xs font-bold ${activeTheme.textAccent}`}>{userRole}</p>
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 border border-slate-800 text-xs px-4 py-2 rounded-lg font-semibold transition-all active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Action Notification Banner */}
          {actionSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span>{actionSuccess}</span>
              <button onClick={() => setActionSuccess('')} className="text-xs underline hover:opacity-80">Dismiss</button>
            </div>
          )}

          {/* Role-Specific Views */}
          {userRole === 'Provincial Leadership' && (
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Total Provincial Enrollment</p>
                  <p className="text-3xl font-black text-white">{totalEnrollment.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400 mt-1">↑ 4.2% YoY Growth</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Provincial Desk Net Surplus</p>
                  <p className={`text-3xl font-black ${netDesks >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {netDesks >= 0 ? `+${netDesks.toLocaleString()}` : netDesks.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Across all 15 GDE Districts</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Overcrowded Hotspots</p>
                  <p className="text-3xl font-black text-rose-500">{overcrowdedCount} Schools</p>
                  <p className="text-[10px] text-rose-400 mt-1">Requires Emergency Intervention</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">2026 Modular Budget</p>
                  <p className="text-3xl font-black text-amber-400">R 45.2 M</p>
                  <p className="text-[10px] text-slate-400 mt-1">62% Allocated to High-Growth Hubs</p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-amber-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    Provincial Infrastructure Taskforce Operations
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Authorize fast-track modular classroom deployment for districts experiencing over 110% capacity load.</p>
                </div>
                <button 
                  onClick={() => triggerAction('Emergency R12.5M Modular Budget Dispatched to High-Risk Districts.')}
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Release Emergency Modular Budget
                </button>
              </div>
            </div>
          )}

          {userRole === 'District Manager' && (
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">District Active Intake</p>
                  <p className="text-4xl font-black text-white">{totalEnrollment.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Available Capacity Deficit</p>
                  <p className={`text-4xl font-black ${netDesks >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {netDesks >= 0 ? `+${netDesks.toLocaleString()}` : netDesks.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Schools Needing Action</p>
                  <p className="text-4xl font-black text-amber-400">{overcrowdedCount}</p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-md font-bold text-white">Inter-School Resource Balancing Tool</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reallocate unused desks from under-utilized schools to nearby overcrowded institutions in your district.</p>
                </div>
                <button 
                  onClick={() => triggerAction('District capacity auto-balanced! 250 desks reallocated across neighboring schools.')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition active:scale-95 whitespace-nowrap"
                >
                  Auto-Balance District Desks
                </button>
              </div>
            </div>
          )}

          {userRole === 'School Principal' && (
            <div className="space-y-6 mb-8">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Assigned Institution</span>
                    <h2 className="text-2xl font-black text-white">Pretoria Primary School (EMIS: 700123891)</h2>
                    <p className="text-xs text-slate-400">Tshwane South District • Circuit 4</p>
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold">
                    Official Returns Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase">Gazetted Classroom Capacity</p>
                    <p className="text-2xl font-black text-white mt-1">1,200</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase">Active Enrolled Learners</p>
                    <p className="text-2xl font-black text-blue-400 mt-1">1,145</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase">Current Net Desk Margin</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">+55 Desks</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button 
                    onClick={() => triggerAction('Weekly enrollment return submitted successfully to GDE District Office.')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition active:scale-95"
                  >
                    Submit Live Weekly Return
                  </button>
                  <button 
                    onClick={() => triggerAction('Requisition for +2 Smart Modular Classrooms registered with Provincial Infrastructure.')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition active:scale-95"
                  >
                    Request Modular Classrooms
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* District Filter Bar */}
          {userRole !== 'School Principal' && (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter District:</span>
                {['ALL', 'Tshwane South', 'Johannesburg Central'].map((district) => (
                  <button
                    key={district}
                    onClick={() => setSelectedDistrict(district)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
                      selectedDistrict === district
                        ? `${activeTheme.dotBg} text-slate-950 font-bold shadow-md scale-105`
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Live District Capacity Returns</h2>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">{filteredSchools.length} Schools Reporting</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Querying PostGIS Engine...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/40 text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-4 px-6">EMIS ID</th>
                      <th className="py-4 px-6">School Name</th>
                      <th className="py-4 px-6">District</th>
                      <th className="py-4 px-6">Capacity</th>
                      <th className="py-4 px-6">Enrollment</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSchools.map((school) => {
                      const isOvercrowded = school.available_desks < 0;
                      return (
                        <tr 
                          key={school.school_id} 
                          className="hover:bg-slate-800/50 hover:translate-x-1 transition-all duration-200"
                        >
                          <td className="py-4 px-6 font-mono text-slate-400">{school.emis_number}</td>
                          <td className="py-4 px-6 font-semibold text-white">{school.school_name}</td>
                          <td className="py-4 px-6">{school.district_name}</td>
                          <td className="py-4 px-6">{school.total_capacity}</td>
                          <td className="py-4 px-6">{school.current_enrollment}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 ${
                                isOvercrowded
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
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
      )}
    </div>
  );
}
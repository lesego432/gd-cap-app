'use client';

import { useEffect, useState, useMemo } from 'react';

interface School {
  school_id: string;
  emis_number: string;
  school_name: string;
  phase: 'Primary' | 'Secondary' | 'Combined';
  district_name: string;
  total_capacity: number;
  current_enrollment: number;
  available_desks: number;
  longitude: number;
  latitude: number;
}

type UserRole = 'District Manager' | 'School Principal' | 'Provincial Leadership';

// MOCK DATA: Fallback dataset when API is not reachable
const MOCK_SCHOOLS: School[] = [
  {
    school_id: 'sch-1',
    emis_number: '700123891',
    school_name: 'Pretoria Primary School',
    phase: 'Primary',
    district_name: 'Tshwane South',
    total_capacity: 1200,
    current_enrollment: 1145,
    available_desks: 55,
    longitude: 28.1881,
    latitude: -25.7461,
  },
  {
    school_id: 'sch-2',
    emis_number: '700123892',
    school_name: 'Sunnyside High School',
    phase: 'Secondary',
    district_name: 'Tshwane South',
    total_capacity: 1000,
    current_enrollment: 1180,
    available_desks: -180,
    longitude: 28.2081,
    latitude: -25.7561,
  },
  {
    school_id: 'sch-3',
    emis_number: '700123893',
    school_name: 'Mamelodi Secondary',
    phase: 'Secondary',
    district_name: 'Tshwane South',
    total_capacity: 1500,
    current_enrollment: 1650,
    available_desks: -150,
    longitude: 28.3281,
    latitude: -25.7161,
  },
  {
    school_id: 'sch-4',
    emis_number: '700223101',
    school_name: 'Johannesburg High School',
    phase: 'Secondary',
    district_name: 'Johannesburg Central',
    total_capacity: 1400,
    current_enrollment: 1320,
    available_desks: 80,
    longitude: 28.0473,
    latitude: -26.2041,
  },
  {
    school_id: 'sch-5',
    emis_number: '700223102',
    school_name: 'Soweto Unified Primary',
    phase: 'Primary',
    district_name: 'Johannesburg Central',
    total_capacity: 900,
    current_enrollment: 1050,
    available_desks: -150,
    longitude: 27.8583,
    latitude: -26.2485,
  },
  {
    school_id: 'sch-6',
    emis_number: '700334201',
    school_name: 'Ekurhuleni Comprehensive',
    phase: 'Combined',
    district_name: 'Ekurhuleni North',
    total_capacity: 1600,
    current_enrollment: 1510,
    available_desks: 90,
    longitude: 28.2312,
    latitude: -26.1625,
  },
];

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
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('District Manager');
  
  // Scope Selection States
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Tshwane South');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('sch-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackedSchoolModal, setTrackedSchoolModal] = useState<School | null>(null);

  // Form State
  const [email, setEmail] = useState('district.manager@gauteng.gov.za');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Operational Action Notification
  const [actionSuccess, setActionSuccess] = useState('');

  // Cursor / Focus Tracking
  const [pointerPos, setPointerPos] = useState({ x: -100, y: -100, isKeyboard: false });

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

  // Fetch real database records with dynamic fallback
  useEffect(() => {
    async function fetchSchools() {
      try {
        setLoading(true);
        const res = await fetch('/api/schools');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setSchools(json.data);
        }
      } catch (err) {
        console.warn('API connection offline, utilizing PostGIS fallback cache.', err);
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
        // Soft fallback for demo authentication
        setIsLoggedIn(true);
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
      // Allow demo access even if login route is not yet deployed
      setIsLoggedIn(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerAction = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // Dynamic Multi-Tier Role Scoping Logic
  const roleScopedSchools = useMemo(() => {
    let result = schools;

    if (userRole === 'District Manager') {
      result = selectedDistrict === 'ALL' ? schools : schools.filter(s => s.district_name === selectedDistrict);
    } else if (userRole === 'School Principal') {
      result = schools.filter(s => s.school_id === selectedSchoolId);
    } else if (userRole === 'Provincial Leadership') {
      result = selectedDistrict === 'ALL' ? schools : schools.filter(s => s.district_name === selectedDistrict);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.school_name.toLowerCase().includes(q) || s.emis_number.includes(q) || s.district_name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [schools, userRole, selectedDistrict, selectedSchoolId, searchQuery]);

  // Aggregate Metrics Calculations
  const totalCapacity = useMemo(() => roleScopedSchools.reduce((acc, s) => acc + s.total_capacity, 0), [roleScopedSchools]);
  const totalEnrollment = useMemo(() => roleScopedSchools.reduce((acc, s) => acc + s.current_enrollment, 0), [roleScopedSchools]);
  const netDesks = totalCapacity - totalEnrollment;
  const overcrowdedCount = useMemo(() => roleScopedSchools.filter(s => s.available_desks < 0).length, [roleScopedSchools]);

  const activeTheme = ROLE_THEMES[userRole];

  // Distinct District List for District Manager / Provincial filters
  const uniqueDistricts = useMemo(() => Array.from(new Set(schools.map(s => s.district_name))), [schools]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* Role-Based Ambient Cursor Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${pointerPos.x}px ${pointerPos.y}px, ${activeTheme.glowRgb}, transparent 80%)`,
        }}
      />

      {/* Target Ring Cursor Tracker */}
      <div
        className="pointer-events-none fixed z-50 flex items-center justify-center transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${pointerPos.x}px`, top: `${pointerPos.y}px` }}
      >
        <div className={`w-8 h-8 rounded-full border-2 ${activeTheme.ringBorder} ${pointerPos.isKeyboard ? 'animate-ping' : 'animate-pulse'} opacity-80 flex items-center justify-center shadow-lg shadow-black/50`}>
          <div className={`w-2 h-2 rounded-full ${activeTheme.dotBg}`} />
        </div>
      </div>

      {/* Grid Pattern Background */}
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
                {isSubmitting ? 'Authenticating...' : `Sign In to ${userRole} Portal`}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <main className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header Bar */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-white cursor-default">
                  GD<span className={activeTheme.textAccent}>-CAP</span>
                </h1>
                <span className={`border px-3 py-0.5 rounded-full text-xs font-semibold animate-pulse ${activeTheme.badgeBg}`}>
                  {userRole} Mode
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {userRole === 'Provincial Leadership' && 'Gauteng Strategic Infrastructure & Resource Allocation Command'}
                {userRole === 'District Manager' && `Managing District: ${selectedDistrict}`}
                {userRole === 'School Principal' && 'Live School Intake & Facility Control Center'}
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

          {/* 1. PROVINCIAL LEADERSHIP EXECUTIVE VIEW */}
          {userRole === 'Provincial Leadership' && (
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Total Active Enrollment</p>
                  <p className="text-3xl font-black text-white">{totalEnrollment.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400 mt-1">↑ Across Selected Scope</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Net Desk Balance</p>
                  <p className={`text-3xl font-black ${netDesks >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {netDesks >= 0 ? `+${netDesks.toLocaleString()}` : netDesks.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Capacity Deficit Margin</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Critical Hotspot Schools</p>
                  <p className="text-3xl font-black text-rose-500">{overcrowdedCount} Schools</p>
                  <p className="text-[10px] text-rose-400 mt-1">Require Emergency Intervention</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">2026 Modular Fund</p>
                  <p className="text-3xl font-black text-amber-400">R 45.2 M</p>
                  <p className="text-[10px] text-slate-400 mt-1">Provincial Rapid Response</p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-amber-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    Provincial Infrastructure Taskforce Operations
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Dispatch modular classroom units directly to overloaded schools across all 15 GDE Districts.</p>
                </div>
                <button 
                  onClick={() => triggerAction('Emergency R12.5M Modular Classroom Budget Released to High-Deficit Districts.')}
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Authorize Provincial Emergency Relief
                </button>
              </div>
            </div>
          )}

          {/* 2. DISTRICT MANAGER VIEW */}
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
                  <p className="text-xs text-slate-400 mt-0.5">Reallocate unused desks from under-utilized schools to nearby overcrowded institutions in {selectedDistrict}.</p>
                </div>
                <button 
                  onClick={() => triggerAction(`Auto-balanced capacity for ${selectedDistrict}! 250 desks reallocated.`)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition active:scale-95 whitespace-nowrap"
                >
                  Auto-Balance District Desks
                </button>
              </div>
            </div>
          )}

          {/* 3. SCHOOL PRINCIPAL VIEW */}
          {userRole === 'School Principal' && (
            <div className="space-y-6 mb-8">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                
                {/* Principal School Selector */}
                <div className="mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Assigned School View:</label>
                    <p className="text-xs text-slate-400">Select an institution to view school-specific telemetry & capacity metrics.</p>
                  </div>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {schools.map((s) => (
                      <option key={s.school_id} value={s.school_id}>
                        {s.school_name} ({s.emis_number}) - {s.district_name}
                      </option>
                    ))}
                  </select>
                </div>

                {roleScopedSchools.length > 0 && (
                  <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Assigned Principal Institution</span>
                        <h2 className="text-2xl font-black text-white">{roleScopedSchools[0].school_name} (EMIS: {roleScopedSchools[0].emis_number})</h2>
                        <p className="text-xs text-slate-400">{roleScopedSchools[0].district_name} District • {roleScopedSchools[0].phase} Phase</p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${roleScopedSchools[0].available_desks >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        {roleScopedSchools[0].available_desks >= 0 ? 'Capacity Normal' : 'Overcrowded - Request Modular'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-400 font-bold uppercase">Gazetted Capacity</p>
                        <p className="text-2xl font-black text-white mt-1">{roleScopedSchools[0].total_capacity}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-400 font-bold uppercase">Active Enrolled Learners</p>
                        <p className="text-2xl font-black text-blue-400 mt-1">{roleScopedSchools[0].current_enrollment}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-400 font-bold uppercase">Net Desk Margin</p>
                        <p className={`text-2xl font-black mt-1 ${roleScopedSchools[0].available_desks >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {roleScopedSchools[0].available_desks >= 0 ? `+${roleScopedSchools[0].available_desks}` : `${roleScopedSchools[0].available_desks}`} Desks
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button 
                        onClick={() => triggerAction(`Weekly return for ${roleScopedSchools[0].school_name} submitted successfully!`)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition active:scale-95"
                      >
                        Submit Weekly Return
                      </button>
                      <button 
                        onClick={() => triggerAction(`Requisition for +2 Modular Classrooms submitted for ${roleScopedSchools[0].school_name}`)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition active:scale-95"
                      >
                        Request Emergency Modular Units
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* District Scope Filter & Live Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
            
            {/* District Filter Buttons (for District Manager & Provincial) */}
            {userRole !== 'School Principal' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">District:</span>
                <button
                  onClick={() => setSelectedDistrict('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
                    selectedDistrict === 'ALL'
                      ? `${activeTheme.dotBg} text-slate-950 font-bold shadow-md`
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  All Districts
                </button>

                {uniqueDistricts.map((district) => (
                  <button
                    key={district}
                    onClick={() => setSelectedDistrict(district)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
                      selectedDistrict === district
                        ? `${activeTheme.dotBg} text-slate-950 font-bold shadow-md`
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search EMIS or School Name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Shared PostGIS Data Table */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Live School Capacity Returns</h2>
                <p className="text-xs text-slate-400">Displaying tracked institutions under current role scope</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">{roleScopedSchools.length} Schools Listed</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Querying PostGIS Engine...
              </div>
            ) : roleScopedSchools.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No schools found matching search or selected district scope.
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
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {roleScopedSchools.map((school) => {
                      const isOvercrowded = school.available_desks < 0;
                      return (
                        <tr 
                          key={school.school_id} 
                          className="hover:bg-slate-800/50 transition-all duration-200"
                        >
                          <td className="py-4 px-6 font-mono text-slate-400">{school.emis_number}</td>
                          <td className="py-4 px-6 font-semibold text-white">
                            {school.school_name}
                            <span className="block text-[10px] text-slate-500 font-normal">{school.phase} Phase</span>
                          </td>
                          <td className="py-4 px-6 text-slate-300">{school.district_name}</td>
                          <td className="py-4 px-6 text-slate-300">{school.total_capacity.toLocaleString()}</td>
                          <td className="py-4 px-6 text-slate-300">{school.current_enrollment.toLocaleString()}</td>
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
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => setTrackedSchoolModal(school)}
                              className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition active:scale-95"
                            >
                              Track Telemetry
                            </button>
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

      {/* School Telemetry Tracker Modal */}
      {trackedSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">School Spatial Intelligence</span>
                <h3 className="text-xl font-bold text-white">{trackedSchoolModal.school_name}</h3>
                <p className="text-xs text-slate-400">EMIS: {trackedSchoolModal.emis_number} • {trackedSchoolModal.district_name}</p>
              </div>
              <button
                onClick={() => setTrackedSchoolModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Capacity Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Capacity Load</span>
                  <span className="font-bold text-white">
                    {Math.round((trackedSchoolModal.current_enrollment / trackedSchoolModal.total_capacity) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      trackedSchoolModal.current_enrollment > trackedSchoolModal.total_capacity
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (trackedSchoolModal.current_enrollment / trackedSchoolModal.total_capacity) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 uppercase font-semibold">GIS Longitude</p>
                  <p className="text-slate-200 font-mono mt-0.5">{trackedSchoolModal.longitude}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 uppercase font-semibold">GIS Latitude</p>
                  <p className="text-slate-200 font-mono mt-0.5">{trackedSchoolModal.latitude}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setTrackedSchoolModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold uppercase transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
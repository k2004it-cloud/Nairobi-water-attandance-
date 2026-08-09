import { useMemo } from 'react';
import { MapPin, ShieldCheck, Layers } from 'lucide-react';
import { REGION_OPTIONS, isGlobalRegionScope, type AppUser } from '../auth';
import type { Employee } from '../types';

interface RegionTabProps {
  currentUser: AppUser | null;
  activeRegion: string;
  fixedRegion: string;
  employees: Employee[];
  onChangeRegion: (region: string) => void;
}

export default function RegionTab({ currentUser, activeRegion, fixedRegion, employees, onChangeRegion }: RegionTabProps) {
  const deploymentRegion = fixedRegion !== 'All Regions' ? fixedRegion : activeRegion;
  const isDeploymentFixed = fixedRegion !== 'All Regions';
  const isFixedUser = currentUser && !isGlobalRegionScope(currentUser);
  const regionSelected = deploymentRegion && deploymentRegion !== 'All Regions';
  const regionCounts = useMemo(() => {
    return REGION_OPTIONS.filter((region) => region !== 'All Regions').reduce((counts, region) => {
      counts[region] = employees.filter((employee) => employee.region === region).length;
      return counts;
    }, {} as Record<string, number>);
  }, [employees]);

  const isFixedRegion = currentUser && !isGlobalRegionScope(currentUser);
  const currentRegion = isFixedRegion ? currentUser.region : activeRegion;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Deployment region management
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Select the active region</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Use this page to bind the app to a target region during deployment. The selected region limits employee, attendance and report data to that area.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Active region</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{deploymentRegion || 'All Regions'}</p>
            <p className="mt-2 text-sm text-slate-600">
              {isDeploymentFixed
                ? 'This deployment is fixed to a single region and cannot switch regions.'
                : isFixedUser
                  ? 'Your account region is fixed by your assigned region.'
                  : 'This region is applied to all region-aware views.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Deployment region selector</h3>
          <p className="mt-2 text-sm text-slate-600">
            Choose the region that the system will operate in for the current admin session. This ensures data is bounded to a single region.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700">Region</span>
              <select
                value={deploymentRegion}
                onChange={(event) => onChangeRegion(event.target.value)}
                disabled={isDeploymentFixed || isFixedUser}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {(isDeploymentFixed ? [deploymentRegion] : REGION_OPTIONS).map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Selection rule</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {isFixedRegion
                  ? 'Your access is scoped by your assigned region. The selection is locked to the user region.'
                  : 'As a global admin, you may choose the region that will be enforced for this deployment session.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-slate-900">
            <Layers className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-black">Region staffing summary</h3>
          </div>
          <div className="space-y-3">
            {REGION_OPTIONS.filter((region) => region !== 'All Regions').map((region) => (
              <div key={region} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{region}</p>
                  <p className="text-xs text-slate-500">Staff records assigned to this region</p>
                </div>
                <div className="text-xl font-black text-slate-900">{regionCounts[region] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-blue-700">
          <MapPin className="h-5 w-5" />
          <h3 className="text-lg font-black">How region binding works</h3>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>• The selected region is the active deployment scope for this session.</li>
          <li>• Staff, check-in logs, and reports are filtered by the active region.</li>
          <li>• Users assigned to a specific region cannot switch the active region.</li>
          <li>• Global system admins may switch between regions for deployment or review.</li>
        </ul>
      </div>
    </div>
  );
}

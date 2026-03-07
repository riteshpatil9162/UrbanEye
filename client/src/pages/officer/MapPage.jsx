import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { getOfficerIssues } from '../../services/officerService';
import { MapPin, Layers, List, Filter, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { getIssueTypeIcon } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Kolhapur city center
const KOLHAPUR_CENTER = { lat: 16.7050, lng: 74.2433 };
const LIBRARIES = ['visualization'];

const STATUS_COLORS = {
  pending:      '#f59e0b',
  verified:     '#3b82f6',
  assigned:     '#8b5cf6',
  'in-progress':'#06b6d4',
  resolved:     '#10b981',
  rejected:     '#ef4444',
};

const STATUS_LABELS = {
  pending:      'Pending',
  verified:     'Verified',
  assigned:     'Assigned',
  'in-progress':'In Progress',
  resolved:     'Resolved',
  rejected:     'Rejected',
};

const ALL_STATUSES = ['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'];

export default function MapPage() {
  const [issues, setIssues]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('markers'); // 'markers' | 'heatmap'
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [mapRef, setMapRef]     = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOfficerIssues({ limit: 500, page: 1 });
      setIssues(res.data?.issues || []);
    } catch {
      toast.error('Failed to load issues for map.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const onLoad = useCallback((map) => setMapRef(map), []);

  // Only keep issues that have valid lat/lng
  const geoIssues = issues.filter(
    (i) => i.location && typeof i.location.lat === 'number' && typeof i.location.lng === 'number'
  );

  const filteredIssues = geoIssues.filter(
    (i) => filterStatus === 'all' || i.status === filterStatus
  );

  const heatmapData = isLoaded && window.google?.maps
    ? filteredIssues.map((i) => ({
        location: new window.google.maps.LatLng(i.location.lat, i.location.lng),
        weight: 1,
      }))
    : [];

  // Summary counts per status
  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = geoIssues.filter((i) => i.status === s).length;
    return acc;
  }, {});

  if (loadError) return (
    <div className="card p-8 text-center">
      <MapPin className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-slate-600 font-medium">Google Maps failed to load.</p>
      <p className="text-sm text-slate-400 mt-1">Check your <code>VITE_GOOGLE_MAPS_API_KEY</code> in the client <code>.env</code> file.</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Issue Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kolhapur district · {filteredIssues.length} of {geoIssues.length} issue{geoIssues.length !== 1 ? 's' : ''} plotted
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Refresh */}
          <button
            onClick={fetchIssues}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('markers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'markers' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List className="w-4 h-4" /> Markers
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'heatmap' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4" /> Heatmap
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setSelected(null); }}
              className="input py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]} ({counts[s]})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Map — legend floats inside */}
      <div className="card overflow-hidden relative" style={{ height: '580px' }}>

        {/* Floating legend — always visible over the map */}
        {isLoaded && !loading && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 12,
              zIndex: 10,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(6px)',
              borderRadius: 10,
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              padding: '10px 14px',
              minWidth: 160,
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Legend
            </p>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(filterStatus === s ? 'all' : s); setSelected(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  background: filterStatus === s ? STATUS_COLORS[s] + '18' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  marginBottom: 2,
                }}
              >
                <span style={{
                  width: 12, height: 12,
                  borderRadius: '50%',
                  backgroundColor: STATUS_COLORS[s],
                  flexShrink: 0,
                  border: filterStatus === s ? '2px solid ' + STATUS_COLORS[s] : '2px solid #fff',
                  boxShadow: '0 0 0 1px ' + STATUS_COLORS[s],
                }} />
                <span style={{
                  fontSize: 12,
                  fontWeight: filterStatus === s ? 700 : 500,
                  color: filterStatus === s ? STATUS_COLORS[s] : '#475569',
                  flex: 1,
                  textAlign: 'left',
                }}>
                  {STATUS_LABELS[s]}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: filterStatus === s ? STATUS_COLORS[s] : '#94a3b8',
                  minWidth: 18,
                  textAlign: 'right',
                }}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>
        )}

        {!isLoaded || loading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                {!isLoaded ? 'Loading Google Maps…' : 'Fetching issues…'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Kolhapur district</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={KOLHAPUR_CENTER}
            zoom={11}
            onLoad={onLoad}
            options={{
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
              mapTypeControlOptions: {
                style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
              },
              styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            {/* Markers mode */}
            {viewMode === 'markers' && filteredIssues.map((issue) => (
              <Marker
                key={issue._id}
                position={{ lat: issue.location.lat, lng: issue.location.lng }}
                onClick={() => setSelected(issue)}
                title={`${issue.title} (${STATUS_LABELS[issue.status]})`}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 9,
                  fillColor: STATUS_COLORS[issue.status] || '#94a3b8',
                  fillOpacity: 0.92,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            ))}

            {/* Heatmap mode */}
            {viewMode === 'heatmap' && heatmapData.length > 0 && window.google?.maps?.visualization && (
              <HeatmapLayer
                data={heatmapData}
                options={{ radius: 35, opacity: 0.75 }}
              />
            )}

            {/* Info window on click */}
            {selected && (
              <InfoWindow
                position={{ lat: selected.location.lat, lng: selected.location.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ minWidth: 220, maxWidth: 260, fontFamily: 'inherit' }}>
                  {/* Status bar */}
                  <div
                    className="h-1 w-full rounded-t mb-2"
                    style={{ backgroundColor: STATUS_COLORS[selected.status] || '#94a3b8' }}
                  />
                  {/* Issue type icon + title */}
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-lg leading-none mt-0.5">{getIssueTypeIcon(selected.issueType)}</span>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{selected.title}</p>
                  </div>
                  {/* Meta */}
                  <p className="text-xs text-slate-500 mb-1">
                    <MapPin className="w-3 h-3 inline mr-0.5" />
                    {selected.area}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    {selected.issueType} · {selected.location.lat.toFixed(5)}, {selected.location.lng.toFixed(5)}
                  </p>
                  {/* Status badge */}
                  <div className="mb-2">
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLORS[selected.status] }}
                    >
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>
                  {/* Assigned worker */}
                  {selected.assignedTo && (
                    <p className="text-xs text-slate-500 mb-2">
                      Worker: <span className="font-medium text-slate-700">{selected.assignedTo.name}</span>
                    </p>
                  )}
                  {/* Before image thumbnail */}
                  {(selected.beforeImage || selected.image) && (
                    <img
                      src={selected.beforeImage || selected.image}
                      alt="Issue"
                      style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 6 }}
                    />
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* No geo-data notice */}
      {!loading && geoIssues.length === 0 && issues.length > 0 && (
        <div className="mt-4 card p-4 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200">
          <MapPin className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          {issues.length} issue{issues.length !== 1 ? 's' : ''} found but none have GPS coordinates yet.
          Citizens must allow location access when reporting.
        </div>
      )}
    </div>
  );
}

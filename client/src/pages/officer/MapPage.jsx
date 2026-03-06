import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { getIssues } from '../../services/issueService';
import { MapPin, Layers, List, Filter } from 'lucide-react';
import { ISSUE_TYPES, AREAS } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };
const LIBRARIES = ['visualization'];

const STATUS_COLORS = {
  pending: '#f59e0b',
  verified: '#3b82f6',
  assigned: '#8b5cf6',
  'in-progress': '#06b6d4',
  resolved: '#10b981',
  rejected: '#ef4444',
};

export default function MapPage() {
  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [viewMode, setViewMode] = useState('markers'); // 'markers' | 'heatmap'
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await getIssues({ limit: 200 });
        setIssues(res.data?.issues || res.data || []);
      } catch {
        toast.error('Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const onLoad = useCallback((map) => setMapRef(map), []);

  const filteredIssues = issues.filter(issue => {
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    return issue.location?.coordinates?.length === 2;
  });

  const heatmapData = filteredIssues
    .filter(i => i.location?.coordinates?.length === 2)
    .map(i => ({
      location: new window.google.maps.LatLng(
        i.location.coordinates[1],
        i.location.coordinates[0]
      ),
      weight: 1,
    }));

  if (loadError) return (
    <div className="card p-8 text-center">
      <MapPin className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-slate-600">Google Maps failed to load.</p>
      <p className="text-sm text-slate-400 mt-1">Check your API key in the .env file.</p>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Issue Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} plotted
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
              onChange={e => setFilterStatus(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              {['pending','verified','assigned','in-progress','resolved','rejected'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-3 mb-4 flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-600 capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="card overflow-hidden" style={{ height: '560px' }}>
        {!isLoaded || loading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading map...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={PUNE_CENTER}
            zoom={12}
            onLoad={onLoad}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            {viewMode === 'markers' && filteredIssues.map(issue => (
              <Marker
                key={issue._id}
                position={{
                  lat: issue.location.coordinates[1],
                  lng: issue.location.coordinates[0],
                }}
                onClick={() => setSelected(issue)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: STATUS_COLORS[issue.status] || '#94a3b8',
                  fillOpacity: 0.9,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />
            ))}

            {viewMode === 'heatmap' && isLoaded && window.google?.maps?.visualization && (
              <HeatmapLayer
                data={heatmapData}
                options={{ radius: 30, opacity: 0.7 }}
              />
            )}

            {selected && (
              <InfoWindow
                position={{
                  lat: selected.location.coordinates[1],
                  lng: selected.location.coordinates[0],
                }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="min-w-[200px]">
                  <p className="font-semibold text-slate-800 text-sm mb-1">{selected.title}</p>
                  <p className="text-xs text-slate-500 mb-2">{selected.area} · {selected.type}</p>
                  <StatusBadge status={selected.status} />
                  {selected.beforeImage && (
                    <img
                      src={selected.beforeImage}
                      alt="Issue"
                      className="w-full h-24 object-cover rounded mt-2"
                    />
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

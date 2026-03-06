import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { getWorkerIssues, getOptimizedRoute } from '../../services/workerService';
import { Navigation, RefreshCw, MapPin, Clock, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };
const LIBRARIES = [];

export default function RoutePlannerPage() {
  const [issues, setIssues] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [directions, setDirections] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  // Fetch active issues assigned to this worker
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await getWorkerIssues();
        const data = res.data?.issues ?? [];
        const active = (Array.isArray(data) ? data : []).filter(i => ['assigned', 'in-progress'].includes(i.status) && i.location?.coordinates?.length === 2);
        setIssues(active);
      } catch {
        toast.error('Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const handleOptimize = async () => {
    if (issues.length === 0) {
      toast.error('No active issues with location data');
      return;
    }
    setOptimizing(true);
    try {
      const res = await getOptimizedRoute();
      const data = res.data;
      setRouteData(data);

      // Build Directions request using Google Maps
      if (isLoaded && window.google && data.waypoints?.length > 0) {
        const directionsService = new window.google.maps.DirectionsService();
        const origin = data.startLocation
          ? { lat: data.startLocation.lat, lng: data.startLocation.lng }
          : PUNE_CENTER;

        const waypoints = data.waypoints.slice(0, -1).map(wp => ({
          location: new window.google.maps.LatLng(wp.lat, wp.lng),
          stopover: true,
        }));
        const destination = new window.google.maps.LatLng(
          data.waypoints[data.waypoints.length - 1].lat,
          data.waypoints[data.waypoints.length - 1].lng
        );

        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            optimizeWaypoints: false,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK') {
              setDirections(result);
            } else {
              toast.error('Could not compute route directions');
            }
          }
        );
      }
      toast.success('Route optimized!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const onLoad = useCallback((map) => setMapRef(map), []);

  if (loadError) return (
    <div className="card p-8 text-center">
      <MapPin className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-slate-600">Google Maps failed to load.</p>
      <p className="text-sm text-slate-400 mt-1">Check your VITE_GOOGLE_MAPS_API_KEY in client/.env</p>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Route Planner</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {issues.length} active issue{issues.length !== 1 ? 's' : ''} with GPS location
          </p>
        </div>
        <button
          onClick={handleOptimize}
          disabled={optimizing || loading || issues.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          {optimizing
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Optimizing...</>
            : <><Navigation className="w-4 h-4" /> Optimize Route</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden" style={{ height: '500px' }}>
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
                }}
              >
                {!directions && issues.map((issue, idx) => (
                  <Marker
                    key={issue._id}
                    position={{
                      lat: issue.location.coordinates[1],
                      lng: issue.location.coordinates[0],
                    }}
                    label={{ text: String(idx + 1), color: 'white', fontSize: '12px', fontWeight: 'bold' }}
                    onClick={() => setSelected(issue)}
                  />
                ))}

                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: false,
                      polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 4 },
                    }}
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
                    <div>
                      <p className="font-semibold text-sm">{selected.title}</p>
                      <p className="text-xs text-slate-500">{selected.area}</p>
                      <StatusBadge status={selected.status} />
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </div>

        {/* Sidebar: stop list + route summary */}
        <div className="space-y-4">
          {/* Route summary */}
          {routeData && (
            <div className="card p-4 bg-primary-50 border border-primary-200">
              <h3 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4" /> Route Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Stops</span>
                  <span className="font-semibold text-slate-700">{routeData.totalStops || issues.length}</span>
                </div>
                {routeData.totalDistance && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance</span>
                    <span className="font-semibold text-slate-700">{routeData.totalDistance}</span>
                  </div>
                )}
                {routeData.estimatedTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />Est. Time</span>
                    <span className="font-semibold text-slate-700">{routeData.estimatedTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issue list */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" /> Stops
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No active issues with GPS data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((issue, idx) => (
                  <div
                    key={issue._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(issue)}
                  >
                    <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{issue.title}</p>
                      <p className="text-xs text-slate-400">{issue.area}</p>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Calculate distance matrix between worker and multiple issues
 */
const getDistanceMatrix = async (workerLocation, issueLocations) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback: use Haversine formula
      return issueLocations.map((loc) => ({
        distance: haversineDistance(workerLocation, loc),
        duration: 'N/A',
      }));
    }

    const origins = `${workerLocation.lat},${workerLocation.lng}`;
    const destinations = issueLocations
      .map((loc) => `${loc.lat},${loc.lng}`)
      .join('|');

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins,
          destinations,
          key: GOOGLE_MAPS_API_KEY,
          mode: 'driving',
        },
      }
    );

    const elements = response.data.rows[0]?.elements || [];
    return elements.map((el) => ({
      distance: el.distance?.value || 999999,
      distanceText: el.distance?.text || 'N/A',
      duration: el.duration?.value || 999999,
      durationText: el.duration?.text || 'N/A',
    }));
  } catch (error) {
    console.error('Google Maps Distance Matrix Error:', error.message);
    return issueLocations.map((loc) => ({
      distance: haversineDistance(workerLocation, loc),
      distanceText: 'Calculated',
      duration: 0,
      durationText: 'N/A',
    }));
  }
};

/**
 * Find nearest available worker to an issue location
 */
const findNearestWorker = (issueLocation, workers) => {
  if (!workers || workers.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  workers.forEach((worker) => {
    if (worker.location && worker.location.lat && worker.location.lng) {
      const dist = haversineDistance(issueLocation, worker.location);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = worker;
      }
    }
  });

  // If no worker has location, return first available
  return nearest || workers[0];
};

/**
 * Haversine distance formula (km)
 */
const haversineDistance = (coord1, coord2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

module.exports = { getDistanceMatrix, findNearestWorker, haversineDistance };

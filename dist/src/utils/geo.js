"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistanceKm = void 0;
/**
 * Calculate distance between two geo coordinates (KM)
 * Uses Haversine formula
 * Pure utility – no side effects
 */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    // Uncomment only if debugging distance issues
    // console.log("📐 [Geo] Input:", { lat1, lon1, lat2, lon2 });
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in KM
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    const rounded = Math.round(km * 100) / 100;
    // console.log("📏 [Geo] Distance (km):", rounded);
    return rounded;
};
exports.getDistanceKm = getDistanceKm;

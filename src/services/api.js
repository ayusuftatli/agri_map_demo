const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const searchParcels = async (query, type = 'parno') => {
    const response = await fetch(`${API_BASE}/parcels/search?q=${encodeURIComponent(query)}&type=${type}`);
    return response.json();
};

export const getParcelDetails = async (parcelId) => {
    const response = await fetch(`${API_BASE}/parcels/${parcelId}`);
    return response.json();
};

export const getParcelAssessments = async (parcelId) => {
    const response = await fetch(`${API_BASE}/parcels/${parcelId}/assessments`);
    return response.json();
};

export const getParcelOwners = async (parcelId) => {
    const response = await fetch(`${API_BASE}/parcels/${parcelId}/owners`);
    return response.json();
};
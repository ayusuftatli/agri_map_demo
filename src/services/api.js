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

export const getFilterOptions = async () => {
    const response = await fetch(`${API_BASE}/parcels/filter-options`);
    return response.json();
};

export const advancedSearchParcels = async (filters) => {
    const response = await fetch(`${API_BASE}/parcels/advanced-search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
    });
    return response.json();
};
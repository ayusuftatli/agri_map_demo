import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getFilterOptions, advancedSearchParcels } from '../services/api';
import './AdvancedSearchModal.css';

function AdvancedSearchModal({ isOpen, onClose, onParcelSelect }) {
    const [filterOptions, setFilterOptions] = useState({
        townships: [],
        zoning_codes: [],
        classifications: [],
        tax_years: [],
    });
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    // Filter state
    const [filters, setFilters] = useState({
        parno: '',
        address: '',
        owner_name: '',
        township: '',
        zoning_code: '',
        classification: '',
        deeded_acres_min: '',
        deeded_acres_max: '',
        calc_acres_min: '',
        calc_acres_max: '',
        gis_acres_min: '',
        gis_acres_max: '',
        land_value_min: '',
        land_value_max: '',
        building_value_min: '',
        building_value_max: '',
        total_value_min: '',
        total_value_max: '',
        taxable_value_min: '',
        taxable_value_max: '',
        tax_year: '',
    });

    // Load filter options when modal opens
    useEffect(() => {
        if (isOpen) {
            loadFilterOptions();
        }
    }, [isOpen]);

    const loadFilterOptions = async () => {
        setLoading(true);
        try {
            const response = await getFilterOptions();
            if (response.success) {
                setFilterOptions(response.data);
            }
        } catch (err) {
            console.error('Failed to load filter options:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSearch = async () => {
        setSearching(true);
        setError(null);
        setResults([]);

        // Build filter object, converting empty strings to null and numbers
        const searchFilters = {};

        // Text search fields
        if (filters.parno) searchFilters.parno = filters.parno;
        if (filters.address) searchFilters.address = filters.address;
        if (filters.owner_name) searchFilters.owner_name = filters.owner_name;

        // Dropdown filters
        if (filters.township) searchFilters.township = filters.township;
        if (filters.zoning_code) searchFilters.zoning_code = filters.zoning_code;
        if (filters.classification) searchFilters.classification = filters.classification;
        if (filters.tax_year) searchFilters.tax_year = parseInt(filters.tax_year);

        // Numeric range filters
        const numericFields = [
            'deeded_acres_min', 'deeded_acres_max',
            'calc_acres_min', 'calc_acres_max',
            'gis_acres_min', 'gis_acres_max',
            'land_value_min', 'land_value_max',
            'building_value_min', 'building_value_max',
            'total_value_min', 'total_value_max',
            'taxable_value_min', 'taxable_value_max',
        ];

        numericFields.forEach(field => {
            if (filters[field] !== '' && filters[field] !== null) {
                searchFilters[field] = parseFloat(filters[field]);
            }
        });

        // Check if at least one filter is set
        if (Object.keys(searchFilters).length === 0) {
            setError('Please set at least one filter');
            setSearching(false);
            return;
        }

        try {
            const response = await advancedSearchParcels(searchFilters);
            if (response.success) {
                setResults(response.data);
                if (response.data.length === 0) {
                    setError('No parcels found matching your criteria');
                }
            } else {
                setError(response.error || 'Search failed');
            }
        } catch (err) {
            console.error('Advanced search error:', err);
            setError('Failed to perform search');
        } finally {
            setSearching(false);
        }
    };

    const handleClear = () => {
        setFilters({
            parno: '',
            address: '',
            owner_name: '',
            township: '',
            zoning_code: '',
            classification: '',
            deeded_acres_min: '',
            deeded_acres_max: '',
            calc_acres_min: '',
            calc_acres_max: '',
            gis_acres_min: '',
            gis_acres_max: '',
            land_value_min: '',
            land_value_max: '',
            building_value_min: '',
            building_value_max: '',
            total_value_min: '',
            total_value_max: '',
            taxable_value_min: '',
            taxable_value_max: '',
            tax_year: '',
        });
        setResults([]);
        setError(null);
    };

    const handleResultClick = (parcel) => {
        onParcelSelect(parcel.parcel_id);
        onClose();
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatAcres = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return `${parseFloat(value).toFixed(2)} ac`;
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="advanced-search-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Advanced Search</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="modal-loading">Loading filter options...</div>
                    ) : (
                        <div className="filter-sections">
                            {/* Basic Search Section */}
                            <div className="filter-section">
                                <h3>Basic Search</h3>
                                <div className="filter-row">
                                    <div className="filter-field">
                                        <label htmlFor="parno">Parcel Number</label>
                                        <input
                                            type="text"
                                            id="parno"
                                            name="parno"
                                            placeholder="Enter parcel number..."
                                            value={filters.parno}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="filter-field">
                                        <label htmlFor="address">Address</label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            placeholder="Enter address..."
                                            value={filters.address}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="filter-row">
                                    <div className="filter-field">
                                        <label htmlFor="owner_name">Owner Name</label>
                                        <input
                                            type="text"
                                            id="owner_name"
                                            name="owner_name"
                                            placeholder="Enter owner name..."
                                            value={filters.owner_name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="filter-section">
                                <h3>Location</h3>
                                <div className="filter-row">
                                    <div className="filter-field">
                                        <label htmlFor="township">Township</label>
                                        <select
                                            id="township"
                                            name="township"
                                            value={filters.township}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">All Townships</option>
                                            {filterOptions.townships.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="filter-field">
                                        <label htmlFor="zoning_code">Zoning Code</label>
                                        <select
                                            id="zoning_code"
                                            name="zoning_code"
                                            value={filters.zoning_code}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">All Zoning</option>
                                            {filterOptions.zoning_codes.map(z => (
                                                <option key={z} value={z}>{z}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Property Section */}
                            <div className="filter-section">
                                <h3>Property Attributes</h3>
                                <div className="filter-row">
                                    <div className="filter-field">
                                        <label htmlFor="classification">Classification</label>
                                        <select
                                            id="classification"
                                            name="classification"
                                            value={filters.classification}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">All Classifications</option>
                                            {filterOptions.classifications.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="filter-row">
                                    <div className="filter-field range-field">
                                        <label>Deeded Acres</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="deeded_acres_min"
                                                placeholder="Min"
                                                value={filters.deeded_acres_min}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="deeded_acres_max"
                                                placeholder="Max"
                                                value={filters.deeded_acres_max}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="filter-field range-field">
                                        <label>Calc Acres</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="calc_acres_min"
                                                placeholder="Min"
                                                value={filters.calc_acres_min}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="calc_acres_max"
                                                placeholder="Max"
                                                value={filters.calc_acres_max}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="filter-row">
                                    <div className="filter-field range-field">
                                        <label>GIS Acres</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="gis_acres_min"
                                                placeholder="Min"
                                                value={filters.gis_acres_min}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="gis_acres_max"
                                                placeholder="Max"
                                                value={filters.gis_acres_max}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Value Section */}
                            <div className="filter-section">
                                <h3>Assessment Values</h3>
                                <div className="filter-row">
                                    <div className="filter-field">
                                        <label htmlFor="tax_year">Tax Year</label>
                                        <select
                                            id="tax_year"
                                            name="tax_year"
                                            value={filters.tax_year}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Latest Available</option>
                                            {filterOptions.tax_years.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="filter-row">
                                    <div className="filter-field range-field">
                                        <label>Land Value ($)</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="land_value_min"
                                                placeholder="Min"
                                                value={filters.land_value_min}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="land_value_max"
                                                placeholder="Max"
                                                value={filters.land_value_max}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="filter-field range-field">
                                        <label>Building Value ($)</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="building_value_min"
                                                placeholder="Min"
                                                value={filters.building_value_min}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="building_value_max"
                                                placeholder="Max"
                                                value={filters.building_value_max}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="filter-row">
                                    <div className="filter-field range-field">
                                        <label>Total Value ($)</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="total_value_min"
                                                placeholder="Min"
                                                value={filters.total_value_min}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="total_value_max"
                                                placeholder="Max"
                                                value={filters.total_value_max}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="filter-field range-field">
                                        <label>Taxable Value ($)</label>
                                        <div className="range-inputs">
                                            <input
                                                type="number"
                                                name="taxable_value_min"
                                                placeholder="Min"
                                                value={filters.taxable_value_min}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                name="taxable_value_max"
                                                placeholder="Max"
                                                value={filters.taxable_value_max}
                                                onChange={handleInputChange}
                                                step="1000"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="modal-actions">
                        <button
                            className="btn-clear"
                            onClick={handleClear}
                            disabled={searching}
                        >
                            Clear Filters
                        </button>
                        <button
                            className="btn-search"
                            onClick={handleSearch}
                            disabled={searching || loading}
                        >
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="search-error">{error}</div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="search-results-section">
                            <h3>Results ({results.length} parcels found)</h3>
                            <div className="results-list">
                                {results.map((parcel, index) => (
                                    <div
                                        key={`${parcel.parcel_id}-${index}`}
                                        className="result-item"
                                        onClick={() => handleResultClick(parcel)}
                                    >
                                        <div className="result-main">
                                            <span className="result-parno">{parcel.parno}</span>
                                            <span className="result-address">{parcel.physical_address || 'No address'}</span>
                                        </div>
                                        <div className="result-details">
                                            <span className="result-township">{parcel.township || 'N/A'}</span>
                                            <span className="result-acres">{formatAcres(parcel.deeded_acres || parcel.calc_acres)}</span>
                                            <span className="result-value">{formatCurrency(parcel.total_value)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AdvancedSearchModal;
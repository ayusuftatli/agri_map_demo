import { useState, useEffect, useRef } from 'react';
import { searchParcels } from '../services/api';
import './SearchBar.css';

function SearchBar({ onParcelSelect }) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('parno');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);
    const isSelectingRef = useRef(false); // Flag to prevent search after selection

    // Handle click outside to close results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Skip search if we just selected a result
        if (isSelectingRef.current) {
            isSelectingRef.current = false;
            return;
        }

        if (query.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchParcels(query, searchType);
                setResults(data.data || []);
                setShowResults(true);
            } catch (err) {
                console.error('Search error:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, searchType]);

    const handleResultClick = (result) => {
        // Set flag to prevent debounced search from triggering
        isSelectingRef.current = true;

        // Clear any pending debounced search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        onParcelSelect(result.parcel_id);
        setQuery(result.parno || '');
        setResults([]); // Clear results to prevent "No parcels found" from showing
        setShowResults(false);
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleTypeChange = (e) => {
        setSearchType(e.target.value);
        if (query.length >= 2) {
            // Trigger new search with new type
            setResults([]);
        }
    };

    const getResultLabel = (result) => {
        switch (searchType) {
            case 'address':
                return result.physical_address || result.parno;
            case 'owner':
                return `${result.owner_name || 'Unknown'} - ${result.parno}`;
            default:
                return result.parno;
        }
    };

    const getResultSubLabel = (result) => {
        switch (searchType) {
            case 'address':
                return result.parno;
            case 'owner':
                return result.physical_address || '';
            default:
                return result.physical_address || result.township || '';
        }
    };

    return (
        <div className="search-bar" ref={searchRef}>
            <div className="search-input-group">
                <select
                    className="search-type-select"
                    value={searchType}
                    onChange={handleTypeChange}
                >
                    <option value="parno">Parcel #</option>
                    <option value="address">Address</option>
                    <option value="owner">Owner</option>
                </select>

                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder={`Search by ${searchType === 'parno' ? 'parcel number' : searchType}...`}
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => results.length > 0 && setShowResults(true)}
                    />
                    {loading && <div className="search-spinner"></div>}
                </div>
            </div>

            {showResults && results.length > 0 && (
                <div className="search-results">
                    {results.map((result, index) => (
                        <div
                            key={`${result.parcel_id}-${index}`}
                            className="search-result-item"
                            onClick={() => handleResultClick(result)}
                        >
                            <span className="result-label">{getResultLabel(result)}</span>
                            <span className="result-sublabel">{getResultSubLabel(result)}</span>
                        </div>
                    ))}
                </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && !loading && (
                <div className="search-results">
                    <div className="search-no-results">No parcels found</div>
                </div>
            )}
        </div>
    );
}

export default SearchBar;
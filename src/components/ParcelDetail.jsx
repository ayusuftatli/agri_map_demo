import { useState, useEffect } from 'react';
import { getParcelDetails, getParcelAssessments, getParcelOwners } from '../services/api';
import './ParcelDetail.css';

function ParcelDetail({ parcelId, soilData, onClose }) {
    const [parcel, setParcel] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAllOwners, setShowAllOwners] = useState(false);

    // Debug: log soilData when it changes
    useEffect(() => {
        console.log('[ParcelDetail] DIAGNOSTIC: soilData received:', soilData);
        console.log('[ParcelDetail] DIAGNOSTIC: soilData type:', typeof soilData);
        console.log('[ParcelDetail] DIAGNOSTIC: soilData is array:', Array.isArray(soilData));
        console.log('[ParcelDetail] DIAGNOSTIC: soilData has farmland:', soilData?.farmland);
        console.log('[ParcelDetail] DIAGNOSTIC: soilData has landCapabilityClasses:', soilData?.landCapabilityClasses);
        if (soilData) {
            console.log('[ParcelDetail] DIAGNOSTIC: Full soilData object:', JSON.stringify(soilData, null, 2));
        }
    }, [soilData]);

    useEffect(() => {
        if (!parcelId) return;

        console.log('[ParcelDetail] DIAGNOSTIC: parcelId changed to:', parcelId);

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [parcelResponse, assessmentResponse, ownerResponse] = await Promise.all([
                    getParcelDetails(parcelId),
                    getParcelAssessments(parcelId),
                    getParcelOwners(parcelId)
                ]);

                if (!parcelResponse.success) {
                    throw new Error(parcelResponse.error || 'Failed to load parcel');
                }

                setParcel(parcelResponse.data);
                setAssessments(assessmentResponse.data || []);
                setOwners(ownerResponse.data || []);
            } catch (err) {
                setError(err.message || 'Failed to load parcel data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [parcelId]);

    const formatCurrency = (value) => {
        if (value == null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatAcres = (value) => {
        if (value == null) return 'N/A';
        return `${parseFloat(value).toFixed(2)} acres`;
    };

    if (!parcelId) return null;

    return (
        <div className="parcel-detail-panel">
            <div className="parcel-detail-header">
                <h2>Parcel Details</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="parcel-detail-content">
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading parcel data...</p>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <p className="error-message">⚠️ {error}</p>
                        <button onClick={() => window.location.reload()}>Retry</button>
                    </div>
                )}

                {!loading && !error && parcel && (
                    <>
                        {/* Basic Info Section */}
                        <section className="detail-section">
                            <h3>Basic Information</h3>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Parcel Number</label>
                                    <span>{parcel.parno || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Address</label>
                                    <span>{parcel.physical_address || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Township</label>
                                    <span>{parcel.township || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Zoning</label>
                                    <span>{parcel.zoning_code || 'N/A'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Property Attributes Section */}
                        <section className="detail-section">
                            <h3>Property Attributes</h3>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Acres</label>
                                    <span>{formatAcres(parcel.attributes?.gis_acres || parcel.attributes?.calc_acres)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Classification</label>
                                    <span>{parcel.attributes?.classification || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Road Type</label>
                                    <span>{parcel.attributes?.road_type || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Utilities</label>
                                    <span>{parcel.attributes?.utilities || 'N/A'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Assessment Section */}
                        {assessments.length > 0 && (
                            <section className="detail-section">
                                <h3>Latest Assessment</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Tax Year</label>
                                        <span>{assessments[0].tax_year || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Land Value</label>
                                        <span>{formatCurrency(assessments[0].land_value)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Building Value</label>
                                        <span>{formatCurrency(assessments[0].building_value)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Total Value</label>
                                        <span className="total-value">{formatCurrency(assessments[0].total_value)}</span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Owner Section */}
                        {owners.length > 0 && (
                            <section className="detail-section">
                                <h3>Owner Information</h3>
                                {(showAllOwners ? owners : owners.slice(0, 1)).map((owner, index) => (
                                    <div key={index} className="owner-card">
                                        <div className="detail-item">
                                            <label>Name</label>
                                            <span>{owner.owner_name || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Mailing Address</label>
                                            <span>
                                                {owner.mailing_address || 'N/A'}
                                                {owner.mailing_city && `, ${owner.mailing_city}`}
                                                {owner.mailing_state && `, ${owner.mailing_state}`}
                                                {owner.mailing_zip && ` ${owner.mailing_zip}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {owners.length > 1 && (
                                    <button
                                        className="toggle-owners-button"
                                        onClick={() => setShowAllOwners(!showAllOwners)}
                                    >
                                        {showAllOwners
                                            ? '▲ Show Less'
                                            : `▼ Show ${owners.length - 1} More Owner${owners.length - 1 > 1 ? 's' : ''}`
                                        }
                                    </button>
                                )}
                            </section>
                        )}

                        {/* Soil Information Section */}
                        {soilData && typeof soilData === 'object' && (
                            <section className="detail-section">
                                <h3>Soil Information</h3>

                                {/* Farmland Classification */}
                                {soilData.farmland && soilData.farmland.length > 0 && (
                                    <div className="soil-subsection">
                                        <h4 className="soil-subsection-title">Farmland Classification</h4>
                                        <div className="farmland-list">
                                            {soilData.farmland.map((farmlandValue, index) => (
                                                <div key={index} className="farmland-item">
                                                    <span className="farmland-value">{farmlandValue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Land Capability Classes */}
                                {soilData.landCapabilityClasses && soilData.landCapabilityClasses.length > 0 && (
                                    <div className="soil-subsection">
                                        <h4 className="soil-subsection-title">Land Capability Classes</h4>
                                        <div className="land-capability-list">
                                            {soilData.landCapabilityClasses.map((classValue, index) => (
                                                <span key={index} className="land-capability-badge">
                                                    Class {classValue}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="land-capability-note">
                                            This parcel contains {soilData.landCapabilityClasses.length} different land capability {soilData.landCapabilityClasses.length === 1 ? 'class' : 'classes'}.
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ParcelDetail;
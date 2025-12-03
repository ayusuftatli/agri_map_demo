import { useState, useEffect } from 'react';
import { getParcelDetails, getParcelAssessments, getParcelOwners } from '../services/api';
import './ParcelDetail.css';

function ParcelDetail({ parcelId, soilData, onClose }) {
    const [parcel, setParcel] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!parcelId) return;

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
                                {owners.map((owner, index) => (
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
                            </section>
                        )}

                        {/* Soil Information Section */}
                        {soilData && (
                            <section className="detail-section">
                                <h3>Soil Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Farmland</label>
                                        <span>{soilData.Farmland || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Land Capability Class</label>
                                        <span>{soilData.land_capability_class || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Slope</label>
                                        <span>{soilData.Slope || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Soil Type</label>
                                        <span>{soilData['Soil Type'] || 'N/A'}</span>
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ParcelDetail;
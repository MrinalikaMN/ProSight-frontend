import React, { useState, useEffect } from 'react';

const RecommendationPanel = ({ projectId = 1 }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Updated to use the Vite environment variable
        fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/project/${projectId}`)
            .then(res => res.json())
            .then(data => {
                setRecommendations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching recommendations:", err);
                setLoading(false);
            });
    }, [projectId]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
            {/* Header with AI Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                        ⚡
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">AI Mitigation Engine</h3>
                        <p className="text-xs text-slate-500">Automated risk containment recommendations</p>
                    </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    ProSight Intelligence
                </span>
            </div>

            {/* Content Area */}
            <div className="mt-5">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-16 bg-slate-100 rounded-xl"></div>
                        <div className="h-16 bg-slate-100 rounded-xl"></div>
                    </div>
                ) : recommendations.length > 0 ? (
                    <div className="grid gap-3.5">
                        {recommendations.map((rec, index) => (
                            <div 
                                key={rec.id || index}
                                className="group relative border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-indigo-200 rounded-xl p-4 transition-all duration-200 hover:shadow-sm border-l-4 border-l-indigo-500"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-800 leading-snug">
                                            {rec.suggestedAction}
                                        </p>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <p className="text-xs text-slate-500">
                                                <span className="font-semibold text-slate-600">Trigger:</span> {rec.triggerEvent}
                                            </p>
                                            <p className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                                                ↓ {rec.expectedImpactPercentage}% Impact
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                        Action Ready
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-sm font-medium text-slate-600">No active recommendations</p>
                        <p className="text-xs text-slate-400 mt-1">Recommendations will generate once risks are assessed.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationPanel;
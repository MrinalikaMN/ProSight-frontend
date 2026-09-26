import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiskChart from '../components/RiskChart';
import RecommendationPanel from '../components/RecommendationPanel';
import AddRiskForm from '../components/AddRiskForm';
import RiskList from '../components/RiskList';

export default function Dashboard() {
  const [risks, setRisks] = useState([]);

  const handleRiskAdded = (newRisk) => {
    setRisks([...risks, newRisk]);
  };

  const handleRiskDeleted = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/risks/${id}`);
      setRisks(risks.filter(risk => risk.id !== id));
    } catch (error) {
      console.error("Failed to delete risk:", error);
    }
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/risks/project/1`)
      .then(response => {
        setRisks(response.data);
      })
      .catch(error => {
        console.error("Connection error:", error);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Project Phoenix Overview</h1>
      <p className="text-slate-500 font-medium mb-8">System Health: 72/100</p>
      
      <AddRiskForm onRiskAdded={handleRiskAdded} />
      <RiskList risks={risks} onDelete={handleRiskDeleted} />
      <RecommendationPanel />
      <RiskChart />
    </div>
  );
}
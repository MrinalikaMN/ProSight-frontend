import RiskChart from './components/RiskChart';
import RecommendationPanel from './components/RecommendationPanel';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddRiskForm from './components/AddRiskForm';
import RiskList from './components/RiskList';

function App() {
  const [risks, setRisks] = useState([]);

  const handleRiskAdded = (newRisk) => {
    setRisks([...risks, newRisk]);
  };

  // New function to handle deletion
  const handleRiskDeleted = async (id) => {
    try {
      await axios.delete(`https://prosight-backend-production.up.railway.app/api/risks/${id}`);
      setRisks(risks.filter(risk => risk.id !== id));
    } catch (error) {
      console.error("Failed to delete risk:", error);
    }
  };

  useEffect(() => {
    axios.get('https://prosight-backend-production.up.railway.app/api/risks/project/1')
      .then(response => {
        setRisks(response.data);
      })
      .catch(error => {
        console.error("Connection error:", error);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">ProSight Enterprise Dashboard</h1>
      <p className="text-green-600 font-medium mb-8">Live Backend Connection Established.</p>
      
      <AddRiskForm onRiskAdded={handleRiskAdded} />
      
      {/* The old hardcoded list is now replaced by your new component */}
      <RiskList risks={risks} onDelete={handleRiskDeleted} />
      <RecommendationPanel/><RiskChart/>
    </div>
  );
}

export default App;
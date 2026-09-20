export default function RiskList({ risks, onDelete }) {
  if (risks.length === 0) {
    return (
      <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-slate-500">No risks detected.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Active Risks</h3>
      <ul className="space-y-3">
        {risks.map((risk) => (
          <li key={risk.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex justify-between items-center">
            <div>
              <strong className="text-slate-800 block text-lg">{risk.title}</strong> 
              <span className="text-slate-600">{risk.description}</span> 
              <em className="text-sm text-blue-600 font-semibold ml-2">({risk.impact} Impact)</em>
            </div>
            <button 
              onClick={() => onDelete(risk.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
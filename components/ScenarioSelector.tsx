import React from 'react';
import { SCENARIOS } from '../constants';
import { Scenario } from '../types';

interface ScenarioSelectorProps {
  onSelect: (scenario: Scenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3">
          Vamos praticar Inglês! 🇺🇸
        </h1>
        <p className="text-slate-500 text-lg">
          Escolha uma situação para começar sua jornada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-blue-400 bg-white shadow-md`}
          >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl`}>
              {scenario.icon}
            </div>
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner ${scenario.color}`}>
                {scenario.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {scenario.title}
                </h3>
                <p className="text-slate-500 mt-1 text-sm leading-relaxed">
                  {scenario.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
                    ${scenario.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                      scenario.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'}`}>
                    {scenario.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

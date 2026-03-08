import { useState } from 'react';





export function LoginScreen({ onLogin }) {
  const [agentName, setAgentName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (agentName.trim()) {
      onLogin(agentName.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md">
        <h1 className="text-2xl mb-2 text-center tracking-wider" style={{ color: '#00ff9c', textShadow: '0 0 10px #00ff9c' }}>
          PARANORMAL DETECTION SYSTEM
        </h1>
        
        <div className="text-center mb-12 text-sm" style={{ color: '#00ff9c', opacity: 0.7 }}>
          Ghost Hunter Radar v2.0
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-3 text-center tracking-wide" style={{ color: '#00ff9c' }}>
              ENTER AGENT NAME
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-4 py-3 bg-black rounded text-center tracking-wider focus:outline-none transition-all"
              style={{
                color: '#00ff9c',
                border: '2px solid #00ff9c',
                boxShadow: '0 0 10px rgba(0, 255, 156, 0.3)'
              }}
              placeholder="Agent_001"
              autoFocus />
            
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: '#00ff9c',
              color: '#0a0a0a',
              boxShadow: '0 0 20px rgba(0, 255, 156, 0.5)'
            }}>
            
            START HUNT
          </button>
        </form>
      </div>
    </div>);

}
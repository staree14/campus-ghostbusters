import { useState } from 'react';
import { BootScreen } from './components/BootScreen';
import { LoginScreen } from './components/LoginScreen';
import { DetectorScreen } from './components/DetectorScreen';



export default function App() {
  const [currentScreen, setCurrentScreen] = useState('boot');
  const [agentName, setAgentName] = useState('');

  const handleBootComplete = () => {
    setCurrentScreen('login');
  };

  const handleLogin = (name) => {
    setAgentName(name);
    setCurrentScreen('detector');
  };

  return (
    <div className="size-full">
      {currentScreen === 'boot' && <BootScreen onComplete={handleBootComplete} />}
      {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {currentScreen === 'detector' && <DetectorScreen agentName={agentName} />}
    </div>);

}
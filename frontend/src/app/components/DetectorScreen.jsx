import { useEffect, useState, useRef } from 'react';







// Helper: Calculate distance between two points in meters using Haversine formula
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
  Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate a random ghost position 15-30 meters away from origin
function generateGhostPosition(lat, lon) {
  const R = 6371e3;
  // random distance 15m to 30m
  const distance = Math.random() * 15 + 15;
  // random bearing 0 to 360 degrees
  const brng = Math.random() * 360 * Math.PI / 180;

  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
  Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
  Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));

  return { lat: lat2 * 180 / Math.PI, lon: lon2 * 180 / Math.PI };
}

export function DetectorScreen({ agentName }) {
  const [signalStrength, setSignalStrength] = useState('none');
  const [logs, setLogs] = useState(['GPS INITIALIZING', 'AWAITING LOCK...']);
  const [rotation, setRotation] = useState(0);
  const [ghostVisible, setGhostVisible] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [distance, setDistance] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);

  // Camera AR Mode State
  const [cameraMode, setCameraMode] = useState(false);
  const videoRef = useRef(null);

  // Radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLogs((prev) => [...prev.slice(-4), 'ERROR: GEOLOCATION NOT SUPPORTED'].slice(-5));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        let currentGhost = ghostPos;
        // Generate ghost if not present
        if (!currentGhost) {
          currentGhost = generateGhostPosition(latitude, longitude);
          setGhostPos(currentGhost);
          setLogs((prev) => [...prev.slice(-4), 'GPS LOCK ACQUIRED', 'SCANNING AREA...'].slice(-5));
        }

        // Calculate distance
        const dist = getDistanceInMeters(latitude, longitude, currentGhost.lat, currentGhost.lon);
        setDistance(dist);

        // Update signals based on physical distance
        let newSignal = 'none';
        if (dist <= 5) {
          newSignal = 'very-strong';
        } else if (dist <= 15) {
          newSignal = 'strong';
        } else if (dist <= 30) {
          newSignal = 'faint';
        }

        setSignalStrength(newSignal);

        // Update UI states based on signal
        if (newSignal === 'very-strong' && !ghostVisible) {
          setGhostVisible(true);
          setLogs((prev) => [...prev.slice(-4), 'PARANORMAL SIGNAL DETECTED', `ENTITY IN PROXIMITY (${dist.toFixed(1)}m)`].slice(-5));
        } else if (newSignal === 'strong') {
          setLogs((prev) => [...prev.slice(-4), `APPROACHING TARGET: ${dist.toFixed(1)}m`].slice(-5));
          if (ghostVisible) setGhostVisible(false);
        } else if (newSignal === 'faint') {
          setLogs((prev) => [...prev.slice(-4), `FAINT SIGNAL: ${dist.toFixed(1)}m`].slice(-5));
          if (ghostVisible) setGhostVisible(false);
        } else if (newSignal === 'none') {
          if (ghostVisible) setGhostVisible(false);
        }

      },
      (error) => {
        setLogs((prev) => [...prev.slice(-4), `GPS ERROR: ${error.message}`].slice(-5));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [ghostPos, ghostVisible]);

  // Handle opening AR Camera Mode
  const handleOpenAR = async () => {
    if (signalStrength === 'very-strong') {
      try {
        setCameraMode(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setLogs((prev) => [...prev.slice(-4), 'CAMERA ERROR: ACCESS DENIED'].slice(-5));
        setCameraMode(false);
      }
    }
  };

  // Handle capturing ghost in AR
  const handleCapture = () => {
    setCaptured(true);
    setLogs((prev) => [...prev.slice(-4), '>>> GHOST CAPTURED! <<<', 'LOGGING PARANORMAL ENTITY...'].slice(-5));

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
    }

    setTimeout(() => {
      setCaptured(false);
      setCameraMode(false);
      setSignalStrength('none');
      setGhostVisible(false);
      setGhostPos(null); // Reset ghost position so a new one spawns next tick
      setLogs((prev) => [...prev.slice(-4), 'RESUMING SCAN FOR NEW ENTITIES...'].slice(-5));
    }, 3000);
  };

  const getSignalColor = () => {
    switch (signalStrength) {
      case 'very-strong':return '#ff3b3b';
      case 'strong':return '#ffaa00';
      case 'faint':return '#00ff9c';
      default:return '#00ff9c';
    }
  };

  const getSignalBars = () => {
    switch (signalStrength) {
      case 'very-strong':return 4;
      case 'strong':return 3;
      case 'faint':return 1;
      default:return 0;
    }
  };

  // --- AR CAMERA SCREEN ---
  if (cameraMode) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Underlay Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0" />
        

        {/* Ghost Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="text-8xl mb-20 animate-bounce"
            style={{
              filter: 'drop-shadow(0 0 20px #ff3b3b)',
              opacity: captured ? 0 : 0.8,
              transition: 'opacity 0.5s',
              animation: captured ? 'spin 1s ease-in' : 'float 3s ease-in-out infinite'
            }}>
            
            👻
          </div>
        </div>

        {/* UI Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 bg-gradient-to-t from-black/80 via-transparent to-black/80">
          <div className="text-center pt-8">
            <div className="text-xl tracking-widest text-red-500 font-bold mb-2 animate-pulse">
              ENTITY TARGET ACQUIRED
            </div>
            <div className="text-[#00ff9c] font-mono text-sm">DISTANCE: {distance?.toFixed(1)}m</div>
          </div>

          <div className="pb-8">
            <button
              onClick={handleCapture}
              disabled={captured}
              className="w-full py-4 rounded-xl border-2 tracking-wider transition-all font-bold text-xl active:scale-95 disabled:opacity-50"
              style={{
                borderColor: '#ff3b3b',
                backgroundColor: 'rgba(255, 59, 59, 0.2)',
                color: '#ff3b3b'
              }}>
              
              {captured ? 'CAPTURED!' : 'SNAP PICTURE'}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg) scale(0); opacity: 0; }
          }
        `}</style>
      </div>);

  }

  // --- RADAR SCREEN ---
  return (
    <div className="min-h-screen flex flex-col px-6 py-6" style={{ backgroundColor: '#0a0a0a', color: '#00ff9c' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl mb-1 tracking-wider" style={{ textShadow: '0 0 10px #00ff9c' }}>
          PARANORMAL DETECTION SYSTEM
        </h1>
        <div className="text-xs opacity-70 mb-2">Ghost Hunter Radar</div>
        <div className="flex justify-between text-xs font-mono px-4">
          <span>Agent: {agentName}</span>
          <span>{distance !== null ? `${distance.toFixed(1)}m` : 'CALCULATING...'}</span>
        </div>
      </div>

      {/* Radar */}
      <div className="flex-1 flex items-center justify-center mb-6 relative">
        <div className="relative">
          {/* Radar circle */}
          <div
            className="w-64 h-64 rounded-full relative border-2"
            style={{
              borderColor: getSignalColor(),
              backgroundColor: 'rgba(0, 255, 156, 0.05)',
              boxShadow: `0 0 30px ${getSignalColor()}40`
            }}>
            
            {/* Grid lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px" style={{ backgroundColor: getSignalColor(), opacity: 0.3 }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-px h-full" style={{ backgroundColor: getSignalColor(), opacity: 0.3 }} />
            </div>
            <div
              className="absolute inset-8 rounded-full border"
              style={{ borderColor: getSignalColor(), opacity: 0.3 }} />
            
            <div
              className="absolute inset-16 rounded-full border"
              style={{ borderColor: getSignalColor(), opacity: 0.3 }} />
            

            {/* Sweep line */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}>
              
              <div
                className="absolute h-px w-1/2 right-1/2"
                style={{
                  background: `linear-gradient(to left, ${getSignalColor()}, transparent)`,
                  boxShadow: `0 0 10px ${getSignalColor()}`
                }} />
              
            </div>

            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ backgroundColor: getSignalColor(), boxShadow: `0 0 10px ${getSignalColor()}` }} />
            
          </div>

          {/* Ghost indicator */}
          {ghostVisible &&
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl animate-bounce"
            style={{
              animation: 'float 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 10px #ff3b3b)'
            }}>
            
              👻
            </div>
          }
        </div>
      </div>

      {/* Signal Strength */}
      <div className="mb-6">
        <div className="text-sm mb-2 text-center tracking-wider">SIGNAL STRENGTH</div>
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4].map((bar) =>
          <div
            key={bar}
            className="w-12 h-6 border-2 rounded transition-all"
            style={{
              borderColor: getSignalColor(),
              backgroundColor: bar <= getSignalBars() ? getSignalColor() : 'transparent',
              boxShadow: bar <= getSignalBars() ? `0 0 10px ${getSignalColor()}` : 'none'
            }} />

          )}
        </div>
        <div className="text-center text-xs tracking-wider font-mono" style={{ color: getSignalColor() }}>
          {signalStrength === 'none' && 'NO SIGNAL'}
          {signalStrength === 'faint' && 'FAINT SIGNAL'}
          {signalStrength === 'strong' && 'STRONG SIGNAL'}
          {signalStrength === 'very-strong' && 'CRITICAL: ENTITY NEAR'}
        </div>
      </div>

      {/* Capture Button */}
      <button
        onClick={handleOpenAR}
        disabled={signalStrength !== 'very-strong'}
        className="w-full py-4 rounded-lg tracking-wider transition-all mb-6 active:scale-95 disabled:opacity-20"
        style={{
          backgroundColor: signalStrength === 'very-strong' ? '#ff3b3b' : 'transparent',
          border: `2px solid ${signalStrength === 'very-strong' ? '#ff3b3b' : '#00ff9c'}`,
          color: signalStrength === 'very-strong' ? '#0a0a0a' : '#00ff9c',
          boxShadow: signalStrength === 'very-strong' ?
          '0 0 30px rgba(255, 59, 59, 0.8)' :
          'none',
          animation: signalStrength === 'very-strong' ? 'pulse 1s infinite' : 'none'
        }}>
        
        OPEN AR CAMERA
      </button>

      {/* Terminal Log */}
      <div
        className="border-2 rounded p-4 space-y-1 min-h-[120px]"
        style={{
          borderColor: '#00ff9c',
          backgroundColor: 'rgba(0, 255, 156, 0.05)'
        }}>
        
        <div className="text-xs mb-2 opacity-70">SYSTEM LOG:</div>
        {logs.map((log, index) =>
        <div key={index} className="text-xs font-mono">
            {"\u003E"} {log}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-20px) translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>);

}
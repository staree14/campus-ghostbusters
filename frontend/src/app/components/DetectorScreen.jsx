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

// Generate a random ghost position 10-15 meters away from origin
function generateGhostPosition(lat, lon) {
  const R = 6371e3;
  // random distance 10m to 15m (closer for easier testing)
  const distance = Math.random() * 5 + 10;
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
  const [tapCount, setTapCount] = useState(0);

  // Camera Ref
  const videoRef = useRef(null);

  // Radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Always-on Camera
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setLogs((prev) => [...prev.slice(-4), 'CAMERA ERROR: ACCESS DENIED'].slice(-5));
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLogs((prev) => [...prev.slice(-4), 'ERROR: GEOLOCATION NOT SUPPORTED'].slice(-5));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        let currentGhost = ghostPos;
        // Generate ghost if not present
        if (!currentGhost) {
          currentGhost = generateGhostPosition(latitude, longitude);
          setGhostPos(currentGhost);
          setLogs((prev) => [...prev.slice(-4), `GPS LOCK (${accuracy.toFixed(0)}m acc)`, 'SCANNING AREA...'].slice(-5));
        }

        // Calculate distance
        const dist = getDistanceInMeters(latitude, longitude, currentGhost.lat, currentGhost.lon);
        setDistance(dist);

        // Update signals based on physical distance
        let newSignal = 'none';
        if (dist <= 10) { // Increased capture radius to 10 meters!
          newSignal = 'very-strong';
        } else if (dist <= 20) {
          newSignal = 'strong';
        } else if (dist <= 40) {
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
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [ghostPos, ghostVisible]);

  // Handle capturing ghost
  const handleCapture = () => {
    setCaptured(true);
    setLogs((prev) => [...prev.slice(-4), '>>> GHOST CAPTURED! <<<', 'LOGGING PARANORMAL ENTITY...'].slice(-5));

    setTimeout(() => {
      setCaptured(false);
      setSignalStrength('none');
      setGhostVisible(false);
      setGhostPos(null); // Reset ghost position so a new one spawns next tick
      setLogs((prev) => [...prev.slice(-4), 'RESUMING SCAN FOR NEW ENTITIES...'].slice(-5));
    }, 3000);
  };

  const getSignalColor = () => {
    switch (signalStrength) {
      case 'very-strong': return '#ff3b3b';
      case 'strong': return '#ffaa00';
      case 'faint': return '#00ff9c';
      default: return '#00ff9c';
    }
  };

  const getSignalBars = () => {
    switch (signalStrength) {
      case 'very-strong': return 4;
      case 'strong': return 3;
      case 'faint': return 1;
      default: return 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col text-[#00ff9c] overflow-hidden">
      {/* Background Camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" />

      {/* Global Dark Overlay to make green UI pop */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-black via-black/50 to-black/80" />

      {/* Primary UI */}
      <div className="relative z-10 flex-1 flex flex-col px-6 py-6 pointer-events-auto">
        {/* Header */}
        <div
          className="text-center mb-6 select-none cursor-pointer"
          onClick={() => {
            setTapCount(c => c + 1);
            if (tapCount >= 4) {
              setSignalStrength('very-strong');
              setDistance(0);
              setLogs(prev => [...prev.slice(-4), 'MANUAL OVERRIDE: ENTITY SUMMONED'].slice(-5));
            }
          }}
        >
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

            {/* Big central ghost when nearby */}
            {ghostVisible &&
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl z-50 pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 0 30px #ff3b3b)',
                  opacity: captured ? 0 : 1,
                  transition: 'opacity 0.5s',
                  animation: captured ? 'spin 1s ease-in' : 'float 3s ease-in-out infinite'
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
        {signalStrength === 'very-strong' ? (
          <button
            onClick={handleCapture}
            disabled={captured}
            className="w-full py-4 rounded-xl border-2 tracking-wider transition-all font-bold text-xl active:scale-95 disabled:opacity-50 mb-6"
            style={{
              borderColor: '#ff3b3b',
              backgroundColor: 'rgba(255, 59, 59, 0.2)',
              color: '#ff3b3b',
              boxShadow: '0 0 30px rgba(255, 59, 59, 0.8)',
              animation: 'pulse 1s infinite'
            }}>
            {captured ? 'CAPTURED!' : 'SNAP PICTURE'}
          </button>
        ) : (
          <div
            className="w-full py-4 rounded-lg tracking-wider transition-all mb-6 text-center border-2"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'rgba(0, 255, 156, 0.3)',
              color: 'rgba(0, 255, 156, 0.5)',
            }}>
            NOT IN RANGE
          </div>
        )}

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
          0%, 100% { transform: translateY(-50%) translateX(-50%); }
          50% { transform: translateY(calc(-50% - 20px)) translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg) scale(0); opacity: 0; }
        }
      `}</style>
      </div>
      );

}
import { useEffect, useState } from 'react';





export function BootScreen({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const bootMessages = [
  'Initializing paranormal scanner...',
  'Loading radar module...',
  'Calibrating sensors...',
  'Establishing ghost detection network...',
  'System ready'];


  useEffect(() => {
    // Blinking cursor
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    // Add messages one by one
    let currentIndex = 0;
    const messageInterval = setInterval(() => {
      if (currentIndex < bootMessages.length) {
        setMessages((prev) => [...prev, bootMessages[currentIndex]]);
        currentIndex++;
      }
    }, 600);

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md">
        <h1 className="text-2xl mb-8 text-center tracking-wider" style={{ color: '#00ff9c', textShadow: '0 0 10px #00ff9c' }}>
          PARANORMAL DETECTION SYSTEM
        </h1>
        
        <div className="space-y-3 mb-8 min-h-[180px]">
          {messages.map((msg, index) =>
          <div key={index} className="text-sm" style={{ color: '#00ff9c' }}>
              &gt; {msg}
            </div>
          )}
          {messages.length < bootMessages.length &&
          <div className="text-sm" style={{ color: '#00ff9c' }}>
              &gt; {showCursor && '█'}
            </div>
          }
        </div>

        <div className="w-full bg-gray-900 h-6 rounded overflow-hidden border" style={{ borderColor: '#00ff9c' }}>
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              backgroundColor: '#00ff9c',
              boxShadow: '0 0 10px #00ff9c'
            }} />
          
        </div>
        
        <div className="text-center mt-4 text-sm" style={{ color: '#00ff9c' }}>
          {progress}%
        </div>
      </div>
    </div>);

}
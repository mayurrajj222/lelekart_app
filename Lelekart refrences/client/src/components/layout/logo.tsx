import React from "react";

export function Logo() {
  return (
    <div className="flex justify-center items-center w-full select-none">
      <span style={{
        fontWeight: 900,
        fontSize: '2.5rem',
        letterSpacing: '0.12em',
        fontFamily: 'Inter, Arial, sans-serif',
        textShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <span style={{ color: '#4285F4' }}>L</span>
        <span style={{ color: '#EA4335' }}>e</span>
        <span style={{ color: '#FBBC05' }}>l</span>
        <span style={{ color: '#34A853' }}>e</span>
        <span style={{ color: '#FF6F00' }}>K</span>
        <span style={{ color: '#AB47BC' }}>A</span>
        <span style={{ color: '#00B8D4' }}>R</span>
        <span style={{ color: '#F50057' }}>T</span>
      </span>
    </div>
  );
}
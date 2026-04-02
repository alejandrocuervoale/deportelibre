import React from 'react';

export default function Logo({ className = '' }) {
    return (
        <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-img-wrapper" style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                background: '#fff', 
                padding: '2px',
                boxShadow: '0 0 15px rgba(255, 0, 0, 0.3)'
            }}>
                <img src="/logo.png" alt="AniFlix Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="logo-text" style={{ 
                fontSize: '1.8rem', 
                fontWeight: '900', 
                letterSpacing: '-1px', 
                background: 'linear-gradient(to right, #ff0000, #ff4c4c)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Outfit', sans-serif"
            }}>
                AniFlix
            </span>
        </div>
    );
}

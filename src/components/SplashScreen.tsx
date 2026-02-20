import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
    onComplete: () => void;
    duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 3000 }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setFadeOut(true);
        }, duration - 500); // Start fading 500ms before completion

        const completeTimer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [duration, onComplete]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            {/* Animated background particles */}
            <div className="splash-particles">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="splash-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                            width: `${2 + Math.random() * 4}px`,
                            height: `${2 + Math.random() * 4}px`,
                        }}
                    />
                ))}
            </div>

            {/* Main SVG Logo */}
            <div className="splash-logo-container">
                <svg
                    className="splash-svg"
                    viewBox="0 0 400 400"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Gradient definitions */}
                        <linearGradient id="swordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>

                        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>

                        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>

                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <filter id="strongGlow">
                            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Clip path for the reveal animation */}
                        <clipPath id="revealClip">
                            <circle cx="200" cy="200" r="0" className="reveal-circle" />
                        </clipPath>
                    </defs>

                    {/* Rotating outer ring */}
                    <g className="splash-ring-outer">
                        <circle
                            cx="200"
                            cy="200"
                            r="170"
                            fill="none"
                            stroke="url(#swordGradient)"
                            strokeWidth="1.5"
                            strokeDasharray="8 12"
                            opacity="0.4"
                        />
                    </g>

                    {/* Counter-rotating inner ring */}
                    <g className="splash-ring-inner">
                        <circle
                            cx="200"
                            cy="200"
                            r="145"
                            fill="none"
                            stroke="url(#shieldGradient)"
                            strokeWidth="1"
                            strokeDasharray="4 8"
                            opacity="0.3"
                        />
                    </g>

                    {/* Pulsing center glow */}
                    <circle
                        cx="200"
                        cy="200"
                        r="60"
                        fill="url(#glowGradient)"
                        className="splash-center-glow"
                    />

                    {/* Shield shape */}
                    <g className="splash-shield" filter="url(#glow)">
                        <path
                            d="M200 100
                 L260 130
                 L270 200
                 L240 260
                 L200 290
                 L160 260
                 L130 200
                 L140 130
                 Z"
                            fill="none"
                            stroke="url(#swordGradient)"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            className="shield-path"
                        />
                        {/* Shield inner detail */}
                        <path
                            d="M200 120
                 L245 143
                 L253 200
                 L230 248
                 L200 270
                 L170 248
                 L147 200
                 L155 143
                 Z"
                            fill="rgba(99, 102, 241, 0.05)"
                            stroke="url(#shieldGradient)"
                            strokeWidth="1"
                            strokeLinejoin="round"
                            opacity="0.6"
                            className="shield-inner-path"
                        />
                    </g>

                    {/* Crossed swords */}
                    <g className="splash-swords" filter="url(#glow)">
                        {/* Left sword */}
                        <g className="sword-left">
                            <line
                                x1="155"
                                y1="260"
                                x2="235"
                                y2="140"
                                stroke="url(#swordGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* Sword guard */}
                            <line
                                x1="175"
                                y1="230"
                                x2="195"
                                y2="238"
                                stroke="#a855f7"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            {/* Sword pommel */}
                            <circle cx="155" cy="260" r="4" fill="#a855f7" />
                        </g>

                        {/* Right sword */}
                        <g className="sword-right">
                            <line
                                x1="245"
                                y1="260"
                                x2="165"
                                y2="140"
                                stroke="url(#swordGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* Sword guard */}
                            <line
                                x1="225"
                                y1="230"
                                x2="205"
                                y2="238"
                                stroke="#6366f1"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            {/* Sword pommel */}
                            <circle cx="245" cy="260" r="4" fill="#6366f1" />
                        </g>
                    </g>

                    {/* Center diamond / damage crystal */}
                    <g className="splash-crystal" filter="url(#strongGlow)">
                        <path
                            d="M200 170 L215 200 L200 230 L185 200 Z"
                            fill="url(#swordGradient)"
                            className="crystal-shape"
                        />
                    </g>

                    {/* Orbital dots */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <circle
                            key={i}
                            cx="200"
                            cy="200"
                            r="3"
                            fill={i % 2 === 0 ? '#6366f1' : '#a855f7'}
                            className="splash-orbital-dot"
                            style={{
                                transformOrigin: '200px 200px',
                                animationDelay: `${i * 0.15}s`,
                                transform: `rotate(${angle}deg) translateY(-120px)`,
                            }}
                        />
                    ))}

                    {/* Draw-on text path - "CoA" */}
                    <text
                        x="200"
                        y="340"
                        textAnchor="middle"
                        className="splash-title-text"
                        fill="url(#swordGradient)"
                        fontSize="28"
                        fontWeight="800"
                        letterSpacing="8"
                        fontFamily="'Inter', 'Segoe UI', sans-serif"
                    >
                        CoA
                    </text>

                    {/* Subtitle */}
                    <text
                        x="200"
                        y="368"
                        textAnchor="middle"
                        className="splash-subtitle-text"
                        fill="#94a3b8"
                        fontSize="11"
                        fontWeight="500"
                        letterSpacing="4"
                        fontFamily="'Inter', 'Segoe UI', sans-serif"
                    >
                        DAMAGE CALCULATOR
                    </text>
                </svg>
            </div>

            {/* Loading bar */}
            <div className="splash-loader">
                <div className="splash-loader-bar" style={{ animationDuration: `${duration - 500}ms` }} />
            </div>
        </div>
    );
};

export default SplashScreen;

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const themeConfig = {
  ai: { 
    primary: '#ef4444', 
    glow: 'rgba(239, 68, 68, 0.15)',
    glowStrong: 'rgba(239, 68, 68, 0.3)',
  },
  dev: { 
    primary: '#3b82f6', 
    glow: 'rgba(59, 130, 246, 0.15)',
    glowStrong: 'rgba(59, 130, 246, 0.3)',
  },
  lab: { 
    primary: '#a855f7', 
    glow: 'rgba(168, 85, 247, 0.15)',
    glowStrong: 'rgba(168, 85, 247, 0.3)',
  },
};

type ThemeKey = keyof typeof themeConfig;

// Étoiles lointaines en Three.js
function Stars() {
  const starsRef = useRef<THREE.Points>(null);
  const starCount = 400; // Beaucoup moins d'étoiles
  
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  
  for (let i = 0; i < starCount; i++) {
    // Sphère de distribution pour les étoiles - plus loin
    const radius = 80 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = -radius * Math.cos(phi) - 80;
    
    sizes[i] = Math.random() * 0.5 + 0.2; // Beaucoup plus petit
  }

  useFrame(() => {
    if (starsRef.current) {
      // Rotation très lente des étoiles
      starsRef.current.rotation.y += 0.00008;
      starsRef.current.rotation.x += 0.00004;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={starCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Étoiles filantes - rares et subtiles
function ShootingStars() {
  const shootingStarsRef = useRef<THREE.Group>(null);
  const [stars, setStars] = useState<Array<{
    id: number;
    startX: number;
    startY: number;
    startZ: number;
    speed: number;
    length: number;
  }>>([]);

  // Créer une nouvelle étoile filante rarement
  useEffect(() => {
    const createStar = () => {
      const newStar = {
        id: Date.now() + Math.random(),
        startX: (Math.random() - 0.5) * 60,
        startY: 20 + Math.random() * 15,
        startZ: -100 - Math.random() * 50,
        speed: 1.2 + Math.random() * 0.4,
        length: 1.5 + Math.random() * 1.5, // Plus court
      };
      setStars(prev => [...prev.slice(-2), newStar]); // Max 3 étoiles filantes
    };

    // Première étoile après 3s
    const timeout = setTimeout(createStar, 3000);
    // Puis toutes les 5-10 secondes (moins fréquent)
    const interval = setInterval(createStar, 5000 + Math.random() * 5000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <group ref={shootingStarsRef}>
      {stars.map((star) => (
        <ShootingStar key={star.id} {...star} onComplete={() => {
          setStars(prev => prev.filter(s => s.id !== star.id));
        }} />
      ))}
    </group>
  );
}

function ShootingStar({ startX, startY, startZ, speed, length, onComplete }: {
  startX: number;
  startY: number;
  startZ: number;
  speed: number;
  length: number;
  onComplete: () => void;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const progressRef = useRef(0);

  useFrame(() => {
    progressRef.current += speed * 0.02;
    
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
      
      // Direction de l'étoile filante (diagonale vers le bas)
      const dirX = 1;
      const dirY = -0.8;
      const progress = progressRef.current;
      
      // Point de tête
      positions[0] = startX + dirX * progress * 50;
      positions[1] = startY + dirY * progress * 50;
      positions[2] = startZ;
      
      // Point de queue (traînée)
      positions[3] = startX + dirX * (progress - length * 0.1) * 50;
      positions[4] = startY + dirY * (progress - length * 0.1) * 50;
      positions[5] = startZ;
      
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Fade out
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = Math.max(0, 1 - progress * 0.5);
      
      if (progress > 3) {
        onComplete();
      }
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([startX, startY, startZ, startX, startY, startZ])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={1} linewidth={2} />
    </line>
  );
}

// Scene Three.js pour le fond spatial
function SpaceBackground() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <Stars />
      <ShootingStars />
    </>
  );
}

// Le même style d'anneau que Hero.tsx avec instabilité
function Portal({ theme, scale = 1 }: { theme: ThemeKey; scale?: number }) {
  const colors = themeConfig[theme];

  return (
    <motion.div 
      className="relative flex items-center justify-center"
      style={{ width: 280 * scale, height: 280 * scale }}
    >
      {/* Glow effect avec instabilité */}
      <motion.div
        className="absolute rounded-full blur-[60px] pointer-events-none"
        style={{
          width: 200 * scale,
          height: 200 * scale,
          background: `radial-gradient(circle, ${colors.glowStrong}, ${colors.glow}, transparent)`,
        }}
        animate={{
          scale: [1, 1.15, 1.08, 1.12, 1],
          opacity: [0.3, 0.5, 0.35, 0.45, 0.3],
          x: [0, 2, -1, 1.5, 0],
          y: [0, -1, 2, -1.5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer Ring avec wobble */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{ 
          width: 260 * scale, 
          height: 260 * scale,
          borderColor: `${colors.primary}30` 
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.03, 0.98, 1.02, 1],
          x: [0, 1.5, -1, 0.5, 0],
          y: [0, -0.5, 1, -1, 0],
        }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Middle Ring with orbiting dots et instabilité */}
      <motion.div
        className="absolute rounded-full border"
        style={{ 
          width: 200 * scale, 
          height: 200 * scale,
          borderColor: `${colors.primary}50` 
        }}
        animate={{
          rotate: -360,
          scale: [1, 1.02, 0.99, 1.01, 1],
          x: [0, -1, 1.5, -0.5, 0],
          y: [0, 1, -1, 0.5, 0],
        }}
        transition={{
          rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {/* Orbiting Dots */}
        {[0, 90, 180, 270].map((angle, i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute rounded-full"
            style={{
              width: 10 * scale,
              height: 10 * scale,
              backgroundColor: colors.primary,
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translateX(${100 * scale}px) translateY(-50%)`,
              boxShadow: `0 0 15px ${colors.primary}`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </motion.div>

      {/* Inner Ring avec tremblement */}
      <motion.div
        className="absolute rounded-full border"
        style={{ 
          width: 140 * scale, 
          height: 140 * scale,
          borderColor: `${colors.primary}70` 
        }}
        animate={{
          rotate: 360,
          scale: [1, 0.97, 1.02, 0.98, 1],
          x: [0, 0.8, -1.2, 0.5, 0],
          y: [0, -0.8, 0.5, -0.3, 0],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Center Pulsing Core - stable */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 70 * scale,
          height: 70 * scale,
          background: `radial-gradient(circle, ${colors.primary}40, ${colors.primary}10)`,
          boxShadow: `0 0 60px ${colors.glowStrong}, inset 0 0 30px ${colors.glow}`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          boxShadow: [
            `0 0 60px ${colors.glowStrong}, inset 0 0 30px ${colors.glow}`,
            `0 0 80px ${colors.glowStrong}, inset 0 0 40px ${colors.glow}`,
            `0 0 60px ${colors.glowStrong}, inset 0 0 30px ${colors.glow}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="rounded-full"
          style={{ 
            width: 35 * scale, 
            height: 35 * scale,
            backgroundColor: colors.primary 
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// Composant principal
export default function PortalScene() {
  const [portalScale, setPortalScale] = useState(1);
  const [positions, setPositions] = useState({
    top: { x: 50, y: 20 },
    bottomLeft: { x: 30, y: 70 },
    bottomRight: { x: 70, y: 70 },
  });

  // Taille de base d'un portail (rayon extérieur)
  const baseRadius = 130; // 260/2 = rayon du cercle extérieur

  // Ajuster la taille ET les positions pour que les cercles restent collés
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Scale adaptatif basé sur l'écran
      const minDim = Math.min(width, height);
      const newScale = Math.max(0.4, Math.min(1.4, minDim / 600));
      
      // Rayon réel du portail avec le scale
      const radius = baseRadius * newScale;
      
      // Centre de l'écran
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Triangle équilatéral - les cercles doivent se toucher
      // Distance entre centres = 2 * rayon (pour que les bords se touchent)
      const distanceBetweenCenters = radius * 2.05; // 2.05 pour un léger espace
      
      // Hauteur du triangle équilatéral
      const triangleHeight = distanceBetweenCenters * Math.sqrt(3) / 2;
      
      // Positions en pixels
      const topY = centerY - triangleHeight / 2 - radius * 0.3;
      const bottomY = centerY + triangleHeight / 2 - radius * 0.1;
      
      // Convertir en pourcentages
      setPositions({
        top: { 
          x: 50, 
          y: (topY / height) * 100 
        },
        bottomLeft: { 
          x: ((centerX - distanceBetweenCenters / 2) / width) * 100, 
          y: (bottomY / height) * 100 
        },
        bottomRight: { 
          x: ((centerX + distanceBetweenCenters / 2) / width) * 100, 
          y: (bottomY / height) * 100 
        },
      });
      
      setPortalScale(newScale);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Three.js Space Background with stars */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 30], fov: 75 }}
          style={{ background: '#000000' }}
        >
          <SpaceBackground />
        </Canvas>
      </div>

      {/* Portal glows - halo de couleur autour des portails */}
      <div className="absolute inset-0 pointer-events-none">
        {/* AI Glow - Rouge - HAUT */}
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${positions.top.x}%`,
            top: `${positions.top.y}%`,
            width: 400 * portalScale,
            height: 400 * portalScale,
            background: `radial-gradient(circle, ${themeConfig.ai.glowStrong} 0%, ${themeConfig.ai.glow} 30%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        {/* DEV Glow - Bleu - BAS GAUCHE */}
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${positions.bottomLeft.x}%`,
            top: `${positions.bottomLeft.y}%`,
            width: 400 * portalScale,
            height: 400 * portalScale,
            background: `radial-gradient(circle, ${themeConfig.dev.glowStrong} 0%, ${themeConfig.dev.glow} 30%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        {/* LAB Glow - Violet - BAS DROITE */}
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${positions.bottomRight.x}%`,
            top: `${positions.bottomRight.y}%`,
            width: 400 * portalScale,
            height: 400 * portalScale,
            background: `radial-gradient(circle, ${themeConfig.lab.glowStrong} 0%, ${themeConfig.lab.glow} 30%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* Triangle layout - positions dynamiques pour cercles collés */}
      <div className="absolute inset-0">
        {/* AI Portal - Rouge - HAUT */}
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${positions.top.x}%`, top: `${positions.top.y}%` }}
        >
          <Portal theme="ai" scale={portalScale} />
        </div>

        {/* DEV Portal - Bleu - BAS GAUCHE */}
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${positions.bottomLeft.x}%`, top: `${positions.bottomLeft.y}%` }}
        >
          <Portal theme="dev" scale={portalScale} />
        </div>

        {/* LAB Portal - Violet - BAS DROITE */}
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${positions.bottomRight.x}%`, top: `${positions.bottomRight.y}%` }}
        >
          <Portal theme="lab" scale={portalScale} />
        </div>

        {/* Lines connecting portals - vibrantes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <filter id="vibrate1">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="turbulence">
                <animate attributeName="baseFrequency" values="0.02;0.04;0.02" dur="2s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="vibrate2">
              <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="turbulence">
                <animate attributeName="baseFrequency" values="0.03;0.05;0.03" dur="1.8s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="vibrate3">
              <feTurbulence type="turbulence" baseFrequency="0.025" numOctaves="2" result="turbulence">
                <animate attributeName="baseFrequency" values="0.025;0.045;0.025" dur="2.2s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          {/* Ligne 1: Top -> Bottom Left */}
          <motion.line
            x1={`${positions.top.x}%`} y1={`${positions.top.y}%`}
            x2={`${positions.bottomLeft.x}%`} y2={`${positions.bottomLeft.y}%`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            filter="url(#vibrate1)"
            animate={{ 
              opacity: [0.05, 0.15, 0.08, 0.12, 0.05],
              strokeWidth: [1, 1.5, 1.2, 1.8, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Ligne 2: Top -> Bottom Right */}
          <motion.line
            x1={`${positions.top.x}%`} y1={`${positions.top.y}%`}
            x2={`${positions.bottomRight.x}%`} y2={`${positions.bottomRight.y}%`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            filter="url(#vibrate2)"
            animate={{ 
              opacity: [0.05, 0.12, 0.15, 0.08, 0.05],
              strokeWidth: [1.2, 1, 1.8, 1.5, 1.2],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          {/* Ligne 3: Bottom Left -> Bottom Right */}
          <motion.line
            x1={`${positions.bottomLeft.x}%`} y1={`${positions.bottomLeft.y}%`}
            x2={`${positions.bottomRight.x}%`} y2={`${positions.bottomRight.y}%`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            filter="url(#vibrate3)"
            animate={{ 
              opacity: [0.08, 0.05, 0.12, 0.15, 0.08],
              strokeWidth: [1.5, 1.8, 1, 1.2, 1.5],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          />
        </svg>
      </div>
    </div>
  );
}

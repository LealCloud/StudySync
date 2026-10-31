'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { BsFillMoonStarsFill } from 'react-icons/bs';
import { FaSun } from 'react-icons/fa6';

interface Particle {
  id: number;
  delay: number;
  duration: number;
}

interface ThemeToggleClientProps {
  size?: 'sm' | 'md' | 'lg';
  toLightLabel: string;
  toDarkLabel: string;
}

export default function ThemeToggleClient({
  size = 'md',
  toLightLabel,
  toDarkLabel,
}: ThemeToggleClientProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Definir tamaños
  const sizes = {
    sm: {
      button: 'h-10 w-16', // 40px x 64px
      thumb: 'h-7 w-7', // 28px x 28px
      icon: 14,
      padding: 'p-1',
      thumbX: 28, // desplazamiento para sm
    },
    md: {
      button: 'h-14 w-22', // 56px x 88px
      thumb: 'h-10 w-10', // 40px x 40px
      icon: 18,
      padding: 'p-1.5',
      thumbX: 38,
    },
    lg: {
      button: 'h-16 w-26', // 64px x 104px
      thumb: 'h-11 w-11', // 44px x 44px
      icon: 20,
      padding: 'p-1.5',
      thumbX: 46,
    },
  };

  const currentSize = sizes[size] || sizes.md;

  // `mounted` evita el flash SSR/cliente de `resolvedTheme` (que es undefined
  // en el primer render). TODO(fase-3): reemplazar por `useSyncExternalStore`
  // con `matchMedia('(prefers-color-scheme: dark)')` + `next-themes`, o por la
  // estrategia que se acuerde al construir `PreferencesSection`.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación intencional para evitar flash de tema, se reemplaza en Fase 3
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  const generateParticles = () => {
    const newParticles: Particle[] = [];
    const particleCount = 3;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        delay: i * 0.1,
        duration: 0.6 + i * 0.1,
      });
    }

    setParticles(newParticles);
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  const handleToggle = () => {
    generateParticles();
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="relative inline-block">
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="grain-light">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="desaturatedNoise"
            />
            <feComponentTransfer in="desaturatedNoise" result="lightGrain">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="lightGrain" mode="overlay" />
          </filter>

          <filter id="grain-dark">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="desaturatedNoise"
            />
            <feComponentTransfer in="desaturatedNoise" result="darkGrain">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="darkGrain" mode="overlay" />
          </filter>
        </defs>
      </svg>

      <motion.button
        ref={toggleRef}
        onClick={handleToggle}
        className={`relative flex ${currentSize.button} items-center ${currentSize.padding} border-border bg-surface focus-visible:ring-border-focus focus-visible:ring-offset-background overflow-hidden rounded-full border transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`}
        style={{
          background:
            'radial-gradient(ellipse at top left, var(--surface-hover) 0%, var(--surface) 45%, var(--background) 100%)',
          boxShadow: `
            inset 3px 3px 8px color-mix(in oklch, var(--foreground) 18%, transparent),
            inset -3px -3px 8px color-mix(in oklch, var(--background) 55%, transparent),
            0 8px 16px color-mix(in oklch, var(--foreground) 12%, transparent)
          `,
        }}
        aria-label={isDark ? toLightLabel : toDarkLabel}
        role="switch"
        aria-checked={isDark}
        whileTap={{ scale: 0.95 }}
      >
        {/* Capa de borde interno */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: '3px',
            right: '3px',
            bottom: '3px',
            left: '3px',
            boxShadow:
              'inset 0 1px 4px color-mix(in oklch, var(--foreground) 20%, transparent), inset 0 -1px 2px color-mix(in oklch, var(--background) 40%, transparent)',
          }}
        />

        {/* Iconos de fondo */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
          <FaSun size={currentSize.icon} className="text-warning" />

          <BsFillMoonStarsFill
            size={currentSize.icon}
            className="text-foreground-muted"
          />
        </div>

        {/* Thumb circular */}
        <motion.div
          className={`relative z-10 flex ${currentSize.thumb} items-center justify-center overflow-hidden rounded-full`}
          style={{
            background: isDark
              ? 'linear-gradient(145deg, var(--surface-active) 0%, var(--surface) 50%, var(--background) 100%)'
              : 'linear-gradient(145deg, var(--primary-foreground) 0%, var(--surface-hover) 50%, var(--surface) 100%)',

            boxShadow: isDark
              ? `
                inset 2px 2px 3px color-mix(in oklch, var(--foreground) 18%, transparent),
                inset -2px -2px 3px color-mix(in oklch, var(--background) 55%, transparent),
                0 4px 16px color-mix(in oklch, var(--foreground) 18%, transparent)
              `
              : `
                inset 2px 2px 3px color-mix(in oklch, var(--foreground) 12%, transparent),
                inset -2px -2px 3px color-mix(in oklch, var(--background) 55%, transparent),
                0 4px 16px color-mix(in oklch, var(--foreground) 12%, transparent)
              `,

            border: '1.5px solid var(--border)',
            borderRadius: '9999px',
          }}
          animate={{
            x: isDark ? currentSize.thumbX : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 22,
          }}
        >
          {/* Brillo del thumb */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in oklch, var(--primary-foreground) 40%, transparent) 0%, transparent 40%, color-mix(in oklch, var(--foreground) 10%, transparent) 100%)',
              mixBlendMode: 'overlay',
              borderRadius: '9999px',
            }}
          />

          {/* Partículas */}
          {isAnimating &&
            particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: isDark
                      ? 'radial-gradient(circle, color-mix(in oklch, var(--info) 50%, transparent) 0%, transparent 70%)'
                      : 'radial-gradient(circle, color-mix(in oklch, var(--warning) 70%, transparent) 0%, transparent 70%)',
                    borderRadius: '9999px',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isDark ? 5 : 6,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: isDark ? 0.5 : particle.duration,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                />
              </motion.div>
            ))}

          {/* Icono del thumb */}
          <div className="relative z-10">
            {isDark ? (
              <BsFillMoonStarsFill
                size={currentSize.icon - 2}
                className="text-foreground"
              />
            ) : (
              <FaSun size={currentSize.icon - 2} className="text-warning" />
            )}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
}

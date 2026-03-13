'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;        // ms
  duration?: number;     // ms
  direction?: Direction;
  className?: string;
  once?: boolean;        // animate only on first render
}

const directionStyles: Record<Direction, string> = {
  up:    'translate-y-[24px]',
  down:  'translate-y-[-24px]',
  left:  'translate-x-[24px]',
  right: 'translate-x-[-24px]',
  none:  '',
};

export default function FadeIn({
  children,
  delay = 0,
  duration = 600,
  direction = 'up',
  className,
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn('transition-[opacity,transform,filter]', className)}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        filter: visible ? 'blur(0px)' : 'blur(8px)',
        transform: visible ? 'translate(0, 0) scale(1)' : `scale(0.98)`,
        // Direction offset applied via inline style for precision
        ...(
          !visible && direction !== 'none'
            ? {
                transform: `translate(${
                  direction === 'left' ? '24px' : direction === 'right' ? '-24px' : '0'
                }, ${
                  direction === 'up' ? '24px' : direction === 'down' ? '-24px' : '0'
                }) scale(0.98)`,
              }
            : {}
        ),
      }}
    >
      {children}
    </div>
  );
}

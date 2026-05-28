'use client';

import React, { useEffect, useRef, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function StaggerContainer({
    children,
    className = '',
    viewOffset = 0,
    delaySeconds = 0.1,
    staggerSeconds = 0.1
}: {
    children: React.ReactNode;
    className?: string;
    viewOffset?: number;
    delaySeconds?: number;
    staggerSeconds?: number;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: viewOffset,
                rootMargin: '-50px',
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [viewOffset]);

    return (
        <div ref={ref} className={cn(className, isVisible ? 'stagger-container-visible' : 'stagger-container-hidden')}
            style={{ '--stagger-delay': `${delaySeconds}s`, '--stagger-step': `${staggerSeconds}s` } as React.CSSProperties}>
            {children}
        </div>
    );
}

export function StaggerItem({
    children,
    className = '',
    direction = 'up',
}: {
    children: React.ReactNode;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}) {
    return (
        <div className={cn(`stagger-item animate-dir-${direction}`, className)}>
            {children}
        </div>
    );
}

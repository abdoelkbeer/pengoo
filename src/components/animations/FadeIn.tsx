'use client';

import React, { useEffect, useRef, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    duration?: number;
    className?: string;
    viewOffset?: number;
}

export function FadeIn({
    children,
    delay = 0,
    direction = 'up',
    duration = 0.5,
    className = '',
    viewOffset = 0
}: FadeInProps) {
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

    const directions = {
        up: 'translate-y-10',
        down: '-translate-y-10',
        left: 'translate-x-10',
        right: '-translate-x-10',
        none: 'translate-x-0 translate-y-0',
    };

    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-700 ease-out',
                isVisible ? 'opacity-100 transform-none' : `opacity-0 ${directions[direction]}`,
                className
            )}
            style={{ transitionDelay: `${delay}s`, transitionDuration: `${duration}s` }}
        >
            {children}
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingControllerProps {
    user: any;
}

export default function OnboardingController({ user }: OnboardingControllerProps) {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [showFAB, setShowFAB] = useState(false);
    const [isAllDone, setIsAllDone] = useState(false);

    const handleProgressUpdate = (allCompleted: boolean) => {
        setIsAllDone(allCompleted);
        if (allCompleted) {
            setShowFAB(false);
            setIsWizardOpen(false);
        } else if (!isWizardOpen) {
            setShowFAB(true);
        }
    };

    useEffect(() => {
        const handleOpen = () => {
            setIsWizardOpen(true);
            setShowFAB(false);
        };
        window.addEventListener('open-onboarding-wizard', handleOpen);
        return () => window.removeEventListener('open-onboarding-wizard', handleOpen);
    }, []);

    useEffect(() => {
        // Auto-open logic based on local storage
        const hasSeenOnboarding = localStorage.getItem('onboarding_seen');
        if (!hasSeenOnboarding && !isAllDone) {
            setIsWizardOpen(true);
            localStorage.setItem('onboarding_seen', 'true');
        }
    }, [isAllDone]);

    if (isAllDone) return null;

    return (
        <>
            <AnimatePresence>

            </AnimatePresence>

            <OnboardingWizard
                isOpen={isWizardOpen}
                onClose={() => {
                    setIsWizardOpen(false);
                    if (!isAllDone) setShowFAB(true);
                }}
                onComplete={handleProgressUpdate}
                user={user}
            />
        </>
    );
}

'use client';

import React from 'react';

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    return (
        <div className="page-transition flex-1 flex flex-col h-full">
            {children}
        </div>
    );
}

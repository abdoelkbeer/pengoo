import React from 'react';

export default function DashboardLoading() {
    return (
        <>
            {/* Skeleton Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100 px-8 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full">
                    <div className="h-10 w-64 bg-slate-100 rounded-xl skeleton-shimmer"></div>
                </div>
                <div className="flex items-center gap-3 mr-auto">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl skeleton-shimmer"></div>
                    <div className="h-10 w-10 bg-slate-100 rounded-xl skeleton-shimmer"></div>
                </div>
            </header>

            {/* Skeleton Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Title skeleton */}
                    <div className="space-y-3">
                        <div className="h-4 w-32 bg-slate-100 rounded-lg skeleton-shimmer"></div>
                        <div className="h-8 w-72 bg-slate-100 rounded-lg skeleton-shimmer"></div>
                        <div className="h-4 w-96 bg-slate-100 rounded-lg skeleton-shimmer"></div>
                    </div>

                    {/* Cards skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-slate-100 rounded-xl w-12 h-12 skeleton-shimmer"></div>
                                    <div className="h-6 w-16 bg-slate-100 rounded-lg skeleton-shimmer"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-slate-100 rounded skeleton-shimmer"></div>
                                    <div className="h-7 w-16 bg-slate-100 rounded skeleton-shimmer"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Large content skeleton */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="h-6 w-44 bg-slate-100 rounded-lg skeleton-shimmer mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-100 rounded-full skeleton-shimmer"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-100 rounded skeleton-shimmer"></div>
                                        <div className="h-3 w-1/2 bg-slate-100 rounded skeleton-shimmer"></div>
                                    </div>
                                    <div className="h-6 w-20 bg-slate-100 rounded-full skeleton-shimmer"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

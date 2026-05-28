import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import os from 'os';

// Calculate CPU usage percentage from os.cpus()
function getCpuPercent() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
        totalIdle += cpu.times.idle;
        totalTick += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
    }
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    return Math.round(((total - idle) / total) * 100);
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Security check: admin only
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user?.id)
            .maybeSingle();

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // ====== System-level (OS) metrics ======
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const cpus = os.cpus();
        const cpuPercent = getCpuPercent();
        const loadAvg = os.loadavg();

        // ====== Platform process metrics ======
        const pMem = process.memoryUsage();

        // ====== Worker metrics ======
        let workerOnline = false;
        let workerMemory = { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
        let workerUptime = 0;
        let workerSessions = 0;
        let workerCpu = { user: 0, system: 0 };
        try {
            // Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues on Windows
            const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://127.0.0.1:3001';
            const res = await fetch(`${workerUrl}/api/status`, {
                signal: AbortSignal.timeout(5000),
                cache: 'no-store',
            });
            if (res.ok) {
                const data = await res.json();
                workerOnline = true;
                workerMemory = data.process?.memory || workerMemory;
                workerUptime = data.process?.uptime || 0;
                workerSessions = data.sessions?.total || 0;
                workerCpu = data.process?.cpu || workerCpu;
            }
        } catch (e: any) {
            console.error('[System Stats] Worker fetch error:', e?.cause?.code || e?.message || e);
            // Worker is offline — values stay at 0
        }

        return NextResponse.json({
            server: {
                totalMemory,
                freeMemory,
                usedMemory,
                cpuCores: cpus.length,
                cpuModel: cpus[0]?.model || 'Unknown',
                cpuPercent,
                loadAvg,
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                osUptime: os.uptime(),
            },
            platform: {
                rss: pMem.rss,
                heapTotal: pMem.heapTotal,
                heapUsed: pMem.heapUsed,
                external: pMem.external,
                uptime: process.uptime(),
            },
            worker: {
                online: workerOnline,
                rss: workerMemory.rss,
                heapTotal: workerMemory.heapTotal,
                heapUsed: workerMemory.heapUsed,
                external: workerMemory.external,
                uptime: workerUptime,
                sessions: workerSessions,
                cpu: workerCpu,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('System Stats API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { createAdminClient } from '@/utils/supabase/admin'

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

interface LogMetadata {
    [key: string]: any
}

// Memory cache for logging settings to avoid hitting the DB for every log
let cachedSettings: { enable_system_logs: boolean, log_level: string } | null = null
let lastConfigFetch = 0
const TTL = 60000 // 1 minute

async function getLoggingConfig() {
    const now = Date.now()
    if (cachedSettings && (now - lastConfigFetch < TTL)) {
        return cachedSettings
    }

    try {
        const admin = createAdminClient()
        const { data } = await admin.from('platform_settings')
            .select('enable_system_logs, log_level')
            .limit(1)
            .maybeSingle()

        if (data) {
            cachedSettings = {
                enable_system_logs: data.enable_system_logs !== false,
                log_level: data.log_level || 'INFO'
            }
            lastConfigFetch = now
        }
    } catch (error) {
        console.error("Failed to fetch logging config:", error)
    }

    // Fallbacks if DB is down or row doesn't exist
    return cachedSettings || { enable_system_logs: true, log_level: 'INFO' }
}

const severityOrder: Record<LogLevel, number> = {
    'INFO': 0,
    'WARN': 1,
    'ERROR': 2,
    'CRITICAL': 3
}

export const logger = {
    async log(level: LogLevel, source: string, message: string, metadata?: LogMetadata) {
        // Also log to console in development
        const consoleMsg = `[${level}] [${source}] ${message}`
        if (level === 'ERROR' || level === 'CRITICAL') {
            console.error(consoleMsg, metadata || '')
        } else if (level === 'WARN') {
            console.warn(consoleMsg, metadata || '')
        } else {
            console.log(consoleMsg, metadata || '')
        }

        try {
            const config = await getLoggingConfig()

            if (!config.enable_system_logs) return

            const minSeverity = severityOrder[config.log_level as LogLevel] ?? 0
            const currentSeverity = severityOrder[level]

            if (currentSeverity >= minSeverity) {
                const admin = createAdminClient()
                await admin.from('system_logs').insert({
                    level,
                    source,
                    message,
                    metadata: metadata || null
                })
            }
        } catch (dbError) {
            console.error("Failed to write to system_logs:", dbError)
        }
    },

    async info(source: string, message: string, metadata?: LogMetadata) {
        return this.log('INFO', source, message, metadata)
    },

    async warn(source: string, message: string, metadata?: LogMetadata) {
        return this.log('WARN', source, message, metadata)
    },

    async error(source: string, message: string, metadata?: LogMetadata) {
        return this.log('ERROR', source, message, metadata)
    },

    async critical(source: string, message: string, metadata?: LogMetadata) {
        return this.log('CRITICAL', source, message, metadata)
    }
}

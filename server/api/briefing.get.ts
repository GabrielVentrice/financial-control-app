import { readLatestBriefing } from '../utils/briefing'
import type { Briefing } from '../../shared/briefing'

/**
 * The most recent morning briefing, or null when none was ever written.
 *
 * Returns the latest one rather than today's: a briefing from yesterday is still
 * worth reading, and the screen says how old it is.
 */
export default defineEventHandler(async (): Promise<{ briefing: Briefing | null }> => {
  defineRouteMeta({
    openAPI: {
      summary: 'Get the latest daily briefing',
      description:
        'Returns the most recent briefing written by the financas-diario skill: date, verdict (no-trilho | fora-do-trilho), a one-line headline and a plain-text body of at most 200 words. `briefing` is null when none exists.',
      tags: ['Briefing'],
      responses: {
        200: { description: 'Latest briefing, or null' },
        503: { description: 'Database not configured' },
      },
    },
  })

  try {
    return { briefing: await readLatestBriefing() }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API] Error reading briefing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read briefing',
      data: error.message,
    })
  }
})

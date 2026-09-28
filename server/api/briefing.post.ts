import { timingSafeEqual } from 'node:crypto'
import { saveBriefing } from '../utils/briefing'
import { validateBriefing, type Briefing, type BriefingInput } from '../../shared/briefing'
import { todayKeyIn } from '../../shared/dates'

function tokenMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Publishes the morning briefing. One per day; posting again replaces it.
 *
 * The only write in the app that a machine makes, so it is the only one behind
 * a token: `Authorization: Bearer $NUXT_BRIEFING_TOKEN`. Without the variable
 * configured the endpoint refuses everything instead of accepting everything.
 */
export default defineEventHandler(async (event): Promise<{ briefing: Briefing }> => {
  defineRouteMeta({
    openAPI: {
      summary: 'Publish the daily briefing',
      description:
        'Upserts the briefing for `date` (defaults to today in America/Sao_Paulo). Requires `Authorization: Bearer <NUXT_BRIEFING_TOKEN>`. Headline + body together are capped at 200 words.',
      tags: ['Briefing'],
      responses: {
        200: { description: 'Saved briefing' },
        400: { description: 'Invalid briefing' },
        401: { description: 'Missing or wrong token' },
        503: { description: 'Token or database not configured' },
      },
    },
  })

  const expected = useRuntimeConfig(event).briefing?.token
  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Briefing token not configured',
      data: 'NUXT_BRIEFING_TOKEN não está definida neste ambiente.',
    })
  }

  const auth = getHeader(event, 'authorization') ?? ''
  const given = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!tokenMatches(given, expected)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<BriefingInput>(event)
  const result = validateBriefing(body ?? {}, todayKeyIn())

  if (!result.briefing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid briefing',
      data: { errors: result.errors },
    })
  }

  try {
    return { briefing: await saveBriefing(result.briefing) }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API] Error saving briefing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save briefing',
      data: error.message,
    })
  }
})

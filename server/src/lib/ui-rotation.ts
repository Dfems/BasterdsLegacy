export const initUiRotationDefaults = async (): Promise<void> => {
  const secondsRaw = process.env.UI_BG_ROTATE_SECONDS
  const enabledRaw = process.env.UI_BG_ROTATE_ENABLED

  const hasSeconds = secondsRaw != null && secondsRaw.trim() !== '' && Number.isFinite(Number(secondsRaw))
  const hasEnabled = typeof enabledRaw === 'string' && enabledRaw.trim() !== ''

  if (!hasSeconds && !hasEnabled) return

  const secondsVal = hasSeconds ? Math.max(3, Math.floor(Number(secondsRaw))) : undefined
  const enabledVal = hasEnabled
    ? ['true', '1', 'yes', 'y', 'on'].includes(enabledRaw!.trim().toLowerCase())
    : undefined

  try {
    const { db } = await import('./db.js')

    // seconds
    if (secondsVal !== undefined) {
      try {
        await db.setting.create({ data: { key: 'ui.bgRotateSeconds', value: String(secondsVal) } })
        console.info(`[ui-rotation] Seeded seconds=${secondsVal} from UI_BG_ROTATE_SECONDS`)
      } catch (e) {
        if ((e as { code?: string } | null)?.code === 'P2002') {
          // Già presente: nessuna azione, nessun override
        } else {
          throw e
        }
      }
    }

    // enabled
    if (enabledVal !== undefined) {
      try {
        await db.setting.create({
          data: { key: 'ui.bgRotateEnabled', value: enabledVal ? 'true' : 'false' },
        })
        console.info(`[ui-rotation] Seeded enabled=${enabledVal} from UI_BG_ROTATE_ENABLED`)
      } catch (e) {
        if ((e as { code?: string } | null)?.code === 'P2002') {
          // Già presente: nessuna azione, nessun override
        } else {
          throw e
        }
      }
    }
  } catch (error) {
    console.warn('[ui-rotation] Failed to seed defaults from env:', error)
  }
}

import { describe, expect, it } from 'vitest'
import { titleFrom } from '../../../../src/modules/chat/domain/conversation.js'

describe('titleFrom', () => {
    it('keeps a short message as is, on a single line', () => {
        expect(titleFrom('  ¿Qué clima\n hace hoy?  ')).toBe('¿Qué clima hace hoy?')
    })

    it('cuts a long message to 60 characters with an ellipsis', () => {
        const title = titleFrom('palabra '.repeat(20))

        expect(title).toHaveLength(60)
        expect(title.endsWith('…')).toBe(true)
    })
})

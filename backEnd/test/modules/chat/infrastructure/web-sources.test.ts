import { describe, expect, it } from 'vitest'
import { citationContext, SourceList, sourcesIn } from '../../../../src/modules/chat/infrastructure/web-sources.js'

describe('sourcesIn', () => {
    it('reads the hits of a WebSearch result, skipping text comments', () => {
        const response = {
            query: 'clima CDMX',
            results: [
                'Some commentary',
                {tool_use_id: 's1', content: [
                    {title: 'Pronóstico', url: 'https://smn.conagua.gob.mx/pronostico'},
                    {title: '', url: 'https://www.meteored.mx/cdmx'},
                ]},
            ],
            durationSeconds: 1,
        }

        expect(sourcesIn('WebSearch', response)).toEqual([
            {url: 'https://smn.conagua.gob.mx/pronostico', title: 'Pronóstico'},
            {url: 'https://www.meteored.mx/cdmx', title: 'meteored.mx'},
        ])
    })

    it('reads the URL of a WebFetch result, titled by its domain', () => {
        expect(sourcesIn('WebFetch', {url: 'https://www.example.com/a', result: '...'})).toEqual([
            {url: 'https://www.example.com/a', title: 'example.com'},
        ])
    })

    it('ignores non-http URLs, other tools and unexpected shapes', () => {
        expect(sourcesIn('WebFetch', {url: 'javascript:alert(1)'})).toEqual([])
        expect(sourcesIn('WebSearch', {results: [{content: [{title: 'x', url: 'not a url'}]}]})).toEqual([])
        expect(sourcesIn('Bash', {url: 'https://example.com'})).toEqual([])
        expect(sourcesIn('WebSearch', null)).toEqual([])
        expect(sourcesIn('WebSearch', {results: 'nope'})).toEqual([])
    })
})

describe('SourceList', () => {
    it('numbers sources in order and keeps the number of a repeated URL', () => {
        const list = new SourceList()

        expect(list.add([{url: 'https://a.com', title: 'A'}, {url: 'https://b.com', title: 'B'}])).toEqual([
            {n: 1, url: 'https://a.com', title: 'A'},
            {n: 2, url: 'https://b.com', title: 'B'},
        ])
        expect(list.add([{url: 'https://b.com', title: 'b.com'}, {url: 'https://c.com', title: 'C'}])).toEqual([
            {n: 2, url: 'https://b.com', title: 'B'},
            {n: 3, url: 'https://c.com', title: 'C'},
        ])
        expect(list.size).toBe(3)
    })

    it('keeps only the cited sources, ignoring Markdown links and references', () => {
        const list = new SourceList()
        list.add([
            {url: 'https://a.com', title: 'A'},
            {url: 'https://b.com', title: 'B'},
            {url: 'https://c.com', title: 'C'},
        ])

        expect(list.citedIn('Lloverá [3]. Ver [1](https://x.com) y [2]: nota.')).toEqual([
            {n: 3, url: 'https://c.com', title: 'C'},
        ])
    })
})

describe('citationContext', () => {
    it('lists the numbers to cite with', () => {
        const context = citationContext([{n: 2, url: 'https://b.com', title: 'B'}])

        expect(context).toContain('[2] B — https://b.com')
        expect(context).toContain('[n]')
    })
})

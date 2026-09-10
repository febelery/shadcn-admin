import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible'

describe('Collapsible', () => {
  it('renders correctly with Base UI primitives and render prop', () => {
    const html = renderToStaticMarkup(
      <Collapsible
        defaultOpen
        render={<div className='group/collapsible custom-root' />}
      >
        <CollapsibleTrigger
          render={<button type='button' className='custom-trigger' />}
        >
          <span>Trigger Label</span>
        </CollapsibleTrigger>
        <CollapsibleContent render={<div className='custom-content' />}>
          <p>Panel Content</p>
        </CollapsibleContent>
      </Collapsible>
    )

    expect(html).toContain('group/collapsible custom-root')
    expect(html).toContain('data-slot="collapsible"')
    expect(html).toContain('data-open=""')
    expect(html).toContain('custom-trigger')
    expect(html).toContain('data-slot="collapsible-trigger"')
    expect(html).toContain('Trigger Label')
    expect(html).toContain('class="custom-content"')
    expect(html).toContain('data-slot="collapsible-content"')
    expect(html).toContain('Panel Content')
  })
})

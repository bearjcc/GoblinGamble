// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { startApp } from './app.ts'

describe('app boot', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
  })

  it('renders title screen', () => {
    startApp()
    const app = document.getElementById('app')
    expect(app?.dataset.screen).toBe('title')
    expect(app?.textContent).toContain('Goblin Gamble')
    expect(app?.children.length).toBeGreaterThan(0)
  })
})

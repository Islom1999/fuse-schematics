import { Platform } from '@angular/cdk/platform'
import { DOCUMENT } from '@angular/common'
import { inject, Injectable } from '@angular/core'

export type UiOsClass = 'os-windows' | 'os-mac' | 'os-unix' | 'os-linux' | 'os-ios' | 'os-android' | 'os-unknown'

const OS_CLASSES: readonly UiOsClass[] = [
  'os-windows',
  'os-mac',
  'os-unix',
  'os-linux',
  'os-ios',
  'os-android',
  'os-unknown',
]

/** Detects the client OS once and exposes it as a CSS class (`os-mac`, `os-windows`, …). */
@Injectable({ providedIn: 'root' })
export class UiPlatformService {
  private readonly document = inject(DOCUMENT)
  private readonly platform = inject(Platform)

  readonly isBrowser = this.platform.isBrowser
  readonly osName: UiOsClass = this.detect()
  /** iOS (iPadOS included) or Android. */
  readonly isTouchOs = this.osName === 'os-ios' || this.osName === 'os-android'

  /** Puts `osName` on `body` (and removes any other `os-*` class). Called by `provideUi()`. */
  applyToDocument(): void {
    const body = this.document.body
    if (!body) return
    body.classList.remove(...OS_CLASSES.filter((name) => name !== this.osName))
    body.classList.add(this.osName)
  }

  /** Later matches win, so Android ("Linux") ends as android and iPadOS ("Mac") as ios. */
  private detect(): UiOsClass {
    if (!this.isBrowser) return 'os-unknown'
    const agent = this.document.defaultView?.navigator.userAgent ?? ''
    let os: UiOsClass = 'os-unknown'
    if (agent.includes('Win')) os = 'os-windows'
    if (agent.includes('Mac')) os = 'os-mac'
    if (agent.includes('X11')) os = 'os-unix'
    if (agent.includes('Linux')) os = 'os-linux'
    if (this.platform.IOS) os = 'os-ios'
    if (this.platform.ANDROID) os = 'os-android'
    return os
  }
}

import { NetworkQuality, type NetworkState, type NetworkSubscription } from './types.js'

export type NetworkChangeCallback = (state: NetworkState) => void

export interface NetworkDetectorOptions {
  probeUrl?: string
  unstableLatencyMs?: number
  probeTimeoutMs?: number
}

const DEFAULT_UNSTABLE_LATENCY_MS = 3_000
const DEFAULT_PROBE_TIMEOUT_MS = 5_000

class NetworkDetector {
  private readonly callbacks = new Set<NetworkChangeCallback>()
  private readonly probeUrl?: string
  private readonly unstableLatencyMs: number
  private readonly probeTimeoutMs: number
  private state: NetworkState
  private browserListenersAttached = false

  constructor(options: NetworkDetectorOptions = {}) {
    const now = new Date().toISOString()
    this.probeUrl = options.probeUrl
    this.unstableLatencyMs = options.unstableLatencyMs ?? DEFAULT_UNSTABLE_LATENCY_MS
    this.probeTimeoutMs = options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS
    this.state = {
      quality: NetworkQuality.Online,
      online: true,
      unstable: false,
      checkedAt: now,
      since: now,
    }
    this.attachBrowserListeners()
  }

  async isOnline(): Promise<boolean> {
    const state = await this.check()
    return state.online
  }

  async check(): Promise<NetworkState> {
    if (hasNavigator() && (globalThis.navigator as any).onLine === false) {
      return this.updateState(NetworkQuality.Offline, undefined, 'navigator-offline')
    }

    if (this.probeUrl && typeof fetch === 'function') {
      return this.checkWithFetchProbe()
    }

    if (!hasNavigator()) {
      return this.checkWithDnsProbe()
    }

    return this.updateState(NetworkQuality.Online)
  }

  subscribeToNetworkChanges(callback: NetworkChangeCallback): NetworkSubscription {
    this.callbacks.add(callback)
    callback(this.state)

    return {
      unsubscribe: () => {
        this.callbacks.delete(callback)
      },
    }
  }

  private async checkWithFetchProbe() {
    const controller = new AbortController()
    const startedAt = Date.now()
    const timeout = setTimeout(() => controller.abort(), this.probeTimeoutMs)

    try {
      await fetch(this.probeUrl as string, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })
      const latencyMs = Date.now() - startedAt
      const quality =
        latencyMs >= this.unstableLatencyMs ? NetworkQuality.Unstable : NetworkQuality.Online

      return this.updateState(quality, latencyMs)
    } catch (error) {
      return this.updateState(
        NetworkQuality.Unstable,
        Date.now() - startedAt,
        error instanceof Error ? error.message : 'probe-failed',
      )
    } finally {
      clearTimeout(timeout)
    }
  }

  private async checkWithDnsProbe() {
    const startedAt = Date.now()

    try {
      const dns = await import('node:dns/promises')
      await dns.lookup('example.com')
      const latencyMs = Date.now() - startedAt
      const quality =
        latencyMs >= this.unstableLatencyMs ? NetworkQuality.Unstable : NetworkQuality.Online

      return this.updateState(quality, latencyMs)
    } catch (error) {
      return this.updateState(
        NetworkQuality.Offline,
        Date.now() - startedAt,
        error instanceof Error ? error.message : 'dns-failed',
      )
    }
  }

  private attachBrowserListeners() {
    if (this.browserListenersAttached || !hasWindow()) {
      return
    }

    (globalThis as any).addEventListener('online', () => {
      void this.check()
    })
    (globalThis as any).addEventListener('offline', () => {
      void this.updateState(NetworkQuality.Offline, undefined, 'browser-offline')
    })
    this.browserListenersAttached = true
  }

  private updateState(quality: NetworkQuality, latencyMs?: number, reason?: string) {
    const now = new Date().toISOString()
    const online = quality !== NetworkQuality.Offline
    const unstable = quality === NetworkQuality.Unstable
    const changed =
      this.state.quality !== quality ||
      this.state.online !== online ||
      this.state.unstable !== unstable

    this.state = {
      quality,
      online,
      unstable,
      checkedAt: now,
      since: changed ? now : this.state.since,
      latencyMs,
      reason,
    }

    if (changed) {
      for (const callback of this.callbacks) {
        callback(this.state)
      }
    }

    return this.state
  }
}

const defaultDetector = new NetworkDetector({
  probeUrl: process.env.VITE_API_BASE_URL
    ? `${process.env.VITE_API_BASE_URL.replace(/\/$/, '')}/health`
    : undefined,
})

export function isOnline() {
  return defaultDetector.isOnline()
}

export function subscribeToNetworkChanges(callback: NetworkChangeCallback) {
  return defaultDetector.subscribeToNetworkChanges(callback)
}

export function createNetworkDetector(options: NetworkDetectorOptions = {}) {
  return new NetworkDetector(options)
}

function hasNavigator(): boolean {
  return typeof globalThis.navigator !== 'undefined'
}

function hasWindow(): boolean {
  return typeof (globalThis as any).addEventListener === 'function'
}

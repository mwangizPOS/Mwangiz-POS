export {}

declare global {
  interface Window {
    mwangiPOS?: {
      platform: string
      versions: {
        chrome: string
        electron: string
        node: string
      }
      getAppVersion: () => Promise<string>
      getSystemTheme: () => Promise<'dark' | 'light'>
    }
  }
}

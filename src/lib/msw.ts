/**
 * 初始化 MSW (仅开发环境)
 */
export const initializeMSW = async (): Promise<void> => {
  if (!import.meta.env.DEV) return

  try {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  } catch (error) {
    console.error('启动 MSW worker 失败:', error)
  }
}

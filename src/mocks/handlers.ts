import { type HttpHandler } from 'msw'

const modules = import.meta.glob('./handlers/*.ts', { eager: true })

export const handlers: HttpHandler[] = Object.values(modules).flatMap(
  (module: any) => Object.values(module).filter((item) => Array.isArray(item)).flat() as HttpHandler[]
)

import { insertHome } from '../repositories/home.repository'
import type { Home } from '../types/home.types'

export async function createHome(db: Env['DB'], name: string): Promise<Home> {
  const id = crypto.randomUUID()

  const home: Home = {
    id,
    homeCode: `HOME-${id.slice(0, 8).toUpperCase()}`,
    name,
  }

  await insertHome(db, home)

  return home
}

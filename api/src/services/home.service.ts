import { findAllHomes, insertHome } from '../repositories/home.repository'
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

export async function listHomes(db: Env['DB']): Promise<{ id: string; name: string }[]> {
  return findAllHomes(db)
}

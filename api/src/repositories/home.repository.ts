import type { Home } from '../types/home.types'

export async function insertHome(db: Env['DB'], home: Home): Promise<void> {
  await db
    .prepare(`
      INSERT INTO homes (id, home_code, name)
      VALUES (?, ?, ?)
    `)
    .bind(home.id, home.homeCode, home.name)
    .run()
}

export async function findHomeById(
  db: Env['DB'],
  homeId: string,
): Promise<{ id: string; name: string } | null> {
  return db
    .prepare(`
      SELECT id, name
      FROM homes
      WHERE id = ?
    `)
    .bind(homeId)
    .first<{ id: string; name: string }>()
}

export async function findAllHomes(db: Env['DB']): Promise<{ id: string; name: string }[]> {
  const result = await db
    .prepare(`
      SELECT id, name
      FROM homes
      ORDER BY created_at ASC, id ASC
    `)
    .all<{ id: string; name: string }>()

  return result.results
}

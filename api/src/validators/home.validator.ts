import type { CreateHomeInput } from '../types/home.types'

export function validateCreateHome(body: unknown): CreateHomeInput | null {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('name' in body) ||
    typeof body.name !== 'string' ||
    body.name.trim().length === 0
  ) {
    return null
  }

  return {
    name: body.name.trim(),
  }
}

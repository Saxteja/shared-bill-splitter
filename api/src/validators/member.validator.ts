export type CreateMemberInput = {
  name: string
}

export function validateCreateMember(body: unknown): CreateMemberInput | null {
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

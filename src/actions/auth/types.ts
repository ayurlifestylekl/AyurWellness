/** Shared return shape for auth server actions. */
export type AuthResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string }

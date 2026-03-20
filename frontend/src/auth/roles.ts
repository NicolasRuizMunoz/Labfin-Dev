export const ROLES = {
  EVALITICS: 'evalitics',
  CLIENT: 'client',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const isEvalitics = (role: string) => role === ROLES.EVALITICS;
export const isClient = (role: string) => role === ROLES.CLIENT;

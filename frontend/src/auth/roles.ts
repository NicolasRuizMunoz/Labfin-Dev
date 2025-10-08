export const ROLES = {
  LABFIN: 0,         // ajusta IDs cuando definamos semilla
  ADMIN: 1,
  USER:  2,
};

// guards de UI (cuando conectemos /users/me real y tengamos role_id)
export const isAdmin = (roleId: number) => roleId === ROLES.ADMIN;
export const isLabfin = (roleId: number) => roleId === ROLES.LABFIN;

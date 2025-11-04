export type Me = {
  id: number;
  email: string;
  username?: string;
  organization_id?: number | null;
  role_id: number;
  is_active: boolean;
};

export type Me = {
  id: number;
  email: string;
  username?: string;
  organization_id?: number | null;
  role: string;
  is_active: boolean;
};

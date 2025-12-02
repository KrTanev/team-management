export interface Team {
  id: number;
  name: string;
  users: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDto {
  name: string;
  users?: number[];
}

export interface UpdateTeamDto {
  name?: string;
  users?: number[];
}

export type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  user: User;
};

export interface UserModel {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserModelInput {
  name: string
  email: string
  password: string
}

export interface UpdateUserModelInput {
  name?: string
  email?: string
  password?: string
}

export type PublicUserModel = Omit<UserModel, 'passwordHash'>

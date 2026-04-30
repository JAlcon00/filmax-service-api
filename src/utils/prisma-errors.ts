import { HttpError } from './errors.js'

export function mapPrismaErrorToHttp(err: any): never {
  if (err && err.code === 'P2002') {
    throw new HttpError(409, 'El correo ya está registrado')
  }

  throw err
}

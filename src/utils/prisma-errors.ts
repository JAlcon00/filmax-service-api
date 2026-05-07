import { HttpError } from './errors.js'

const hasPrismaCode = (err: unknown): err is { code: string } => {
  return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
}

export function mapPrismaErrorToHttp(err: unknown): never {
  if (hasPrismaCode(err) && err.code === 'P2002') {
    throw new HttpError(409, 'El correo ya está registrado')
  }

  throw err
}

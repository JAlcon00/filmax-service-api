import type { NextFunction, Request, Response } from 'express'

type AsyncRouteHandler<P = never, ResBody = unknown, ReqBody = unknown, ReqQuery = never> = (
  request: Request<P, ResBody, ReqBody, ReqQuery>,
  response: Response,
  next: NextFunction
) => Promise<void>

export const asyncHandler = <P = never, ResBody = unknown, ReqBody = unknown, ReqQuery = never>(
  handler: AsyncRouteHandler<P, ResBody, ReqBody, ReqQuery>
) => {
  return (
    request: Request<P, ResBody, ReqBody, ReqQuery>,
    response: Response,
    next: NextFunction
  ) => {
    void handler(request, response, next).catch(next)
  }
}
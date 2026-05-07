export * from './models/index.js'
export { CommentsService, commentsService } from './comments.service.js'
export {
  createCommentController,
  getCommentsByContentController,
  updateCommentController,
  deleteCommentController
} from './comments.controller.js'

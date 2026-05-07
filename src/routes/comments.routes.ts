import { Router } from 'express'
import { authMiddleware } from '@/middlewares/auth.middleware'
import {
  createCommentController,
  getCommentsByContentController,
  updateCommentController,
  deleteCommentController
} from '@/modules/comments'

const router = Router()

// Status endpoint
router.get('/status', (req, res) => {
  res.json({ status: 'Comments module is running' })
})

// Create comment (requires auth)
router.post('/', authMiddleware, createCommentController)

// Get comments by content
router.get('/content/:contentId', getCommentsByContentController)

// Update comment (requires auth)
router.patch('/:commentId', authMiddleware, updateCommentController)

// Delete comment (requires auth)
router.delete('/:commentId', authMiddleware, deleteCommentController)

export default router

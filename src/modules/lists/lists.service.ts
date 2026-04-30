import { HttpError } from '../../utils/errors.js'
import { prisma } from '../../config/prisma.js'
import type { ContentType } from '../movies/models/index.js'
import type {
  CreateListInput,
  CreateListItemInput,
  ListItemModel,
  ListModel,
  ListType
} from './models/index.js'

type ListRecord = {
  id: string
  name: string
  type: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

type ContentRecord = {
  id: string
  externalId: string
  title: string
  type: string
  posterUrl: string | null
}

const getListByTypeInternal = async (userId: string, type: ListType) => {
  return prisma.personalList.findUnique({
    where: {
      userId_type: {
        userId,
        type
      }
    },
    include: {
      listItems: {
        include: {
          content: true
        }
      }
    }
  })
}

const findOrCreateContent = async (input: CreateListItemInput): Promise<ContentRecord> => {
  if (input.contentId) {
    const existingContent = await prisma.content.findUnique({
      where: {
        id: input.contentId
      }
    })

    if (!existingContent) {
      throw new HttpError(404, 'El contenido no existe')
    }

    return existingContent
  }

  const content = await prisma.content.upsert({
    where: {
      externalId: input.externalId as string
    },
    create: {
      externalId: input.externalId as string,
      title: input.title as string,
      type: input.type as ContentType,
      posterUrl: input.posterUrl ?? null
    },
    update: {
      title: input.title as string,
      type: input.type as ContentType,
      posterUrl: input.posterUrl ?? null
    }
  })

  return content
}

const mapListItem = (item: { content: ContentRecord; createdAt: Date }): ListItemModel => {
  return {
    contentId: item.content.id,
    externalId: item.content.externalId,
    title: item.content.title,
    type: item.content.type as ContentType,
    posterUrl: item.content.posterUrl,
    addedAt: item.createdAt
  }
}

export const createList = async (userId: string, input: CreateListInput) => {
  const existingList = await prisma.personalList.findUnique({
    where: {
      userId_type: {
        userId,
        type: input.type
      }
    }
  })

  if (existingList) {
    throw new HttpError(409, 'Ya existe una lista de este tipo para el usuario')
  }

  return prisma.personalList.create({
    data: {
      name: input.name,
      type: input.type,
      userId
    }
  })
}

export const getListByType = async (userId: string, type: ListType): Promise<ListModel> => {
  const list = await getListByTypeInternal(userId, type)

  if (!list) {
    throw new HttpError(404, 'Lista no encontrada')
  }

  return {
    id: list.id,
    name: list.name,
    type: list.type as ListType,
    items: list.listItems.map(mapListItem)
  }
}

export const addItemToList = async (
  userId: string,
  type: ListType,
  input: CreateListItemInput
): Promise<ListItemModel> => {
  const list = await getListByTypeInternal(userId, type)

  if (!list) {
    throw new HttpError(404, 'Lista no encontrada')
  }

  const content = await findOrCreateContent(input)

  const existingItem = await prisma.personalListItem.findUnique({
    where: {
      personalListId_contentId: {
        personalListId: list.id,
        contentId: content.id
      }
    }
  })

  if (existingItem) {
    throw new HttpError(409, 'El contenido ya está en la lista')
  }

  const listItem = await prisma.personalListItem.create({
    data: {
      personalListId: list.id,
      contentId: content.id
    },
    include: {
      content: true
    }
  })

  return mapListItem(listItem)
}

export const removeItemFromList = async (userId: string, type: ListType, contentId: string) => {
  const list = await getListByTypeInternal(userId, type)

  if (!list) {
    throw new HttpError(404, 'Lista no encontrada')
  }

  const existingItem = await prisma.personalListItem.findUnique({
    where: {
      personalListId_contentId: {
        personalListId: list.id,
        contentId
      }
    }
  })

  if (!existingItem) {
    throw new HttpError(404, 'El contenido no existe en la lista')
  }

  await prisma.personalListItem.delete({
    where: {
      personalListId_contentId: {
        personalListId: list.id,
        contentId
      }
    }
  })
}

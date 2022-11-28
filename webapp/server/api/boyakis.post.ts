import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { boyakiTableName, ddbDocClient } from './boyakis.get'

interface PostBody {
  userId: string
  text: string
}

const createBoyaki = async (boyaki: PostBody) => {
  const command = new PutCommand({
    TableName: boyakiTableName,
    Item: {
      userId: boyaki.userId,
      text: boyaki.text,
      timestamp: Date.now(),
    },
  })
  await ddbDocClient.send(command)
}

export default defineEventHandler(async (event) => {
  await createBoyaki(await readBody(event))
  return null
})

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const ddbClient = new DynamoDBClient({})
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
export const boyakiTableName = process.env.BOYAKI_TABLE_NAME

interface Boyaki {
  userId: string
  text: string
  timestamp: number
}

const listBoyakis = async () => {
  const command = new ScanCommand({
    TableName: boyakiTableName,
  })
  const response = await ddbDocClient.send(command)
  return {
    boyakis: response.Items as Boyaki[],
  }
}

export default defineEventHandler(async () => {
  return await listBoyakis()
})

import Redis from 'ioredis'
import {ServerChannel} from 'parabol-client/types/constEnums'
import GQLExecutorId from '../client/shared/gqlIds/GQLExecutorId'
import executeGraphQL, {GQLRequest} from '../server/graphql/executeGraphQL'
import '../server/initSentry'
import RedisStream from './RedisStream'
import './tracer'

const {REDIS_URL, SERVER_ID} = process.env
interface PubSubPromiseMessage {
  jobId: string
  request: GQLRequest
}

const run = async () => {
  const subscriber = new Redis(REDIS_URL)
  const publisher = new Redis(REDIS_URL)
  const serverChannel = GQLExecutorId.join(SERVER_ID)

  // subscribe to direct messages
  const onMessage = async (_channel: string, message: string) => {
    const {jobId, request} = JSON.parse(message) as PubSubPromiseMessage
    const response = await executeGraphQL(request)
    publisher.publish(ServerChannel.GQL_EXECUTOR_RESPONSE, JSON.stringify({response, jobId}))
  }

  subscriber.on('message', onMessage)
  subscriber.subscribe(serverChannel)

  // subscribe to consumer group
  try {
    await publisher.xgroup(
      'CREATE',
      ServerChannel.GQL_EXECUTOR_STREAM,
      ServerChannel.GQL_EXECUTOR_CONSUMER_GROUP,
      '$',
      'MKSTREAM'
    )
  } catch (e) {
    // stream already exists
  }

  const incomingStream = new RedisStream(
    ServerChannel.GQL_EXECUTOR_STREAM,
    ServerChannel.GQL_EXECUTOR_CONSUMER_GROUP,
    serverChannel
  )
  console.log(`\n💧💧💧 Ready for GraphQL Execution: ${SERVER_ID} 💧💧💧`)

  for await (const message of incomingStream) {
    onMessage('', message)
  }
}

run()

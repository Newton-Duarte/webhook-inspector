import { faker } from '@faker-js/faker'
import { uuidv7 } from 'uuidv7'
import { db } from '.'
import { webhooks } from './schema'

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const contentTypes = [
  'application/json',
  'text/plain',
  'application/x-www-form-urlencoded',
  'application/octet-stream',
]
const statusCodes = [200, 201, 202, 204, 301, 302, 400, 401, 403, 404, 422, 500]

function randomQueryParams() {
  const n = faker.number.int({ min: 0, max: 4 })
  return Object.fromEntries(
    Array.from({ length: n }).map(() => [
      faker.lorem.word(),
      faker.lorem.word(),
    ]),
  ) as Record<string, string>
}

function randomHeaders(contentType: string) {
  return {
    'user-agent': faker.internet.userAgent(),
    accept: 'application/json',
    'content-type': contentType,
    host: faker.internet.domainName(),
    'x-forwarded-for': faker.internet.ip(),
  } as Record<string, string>
}

async function seed() {
  console.log('🌱 Seeding database...')

  await db.delete(webhooks)

  const webhooksData = Array.from({ length: 60 }, () => {
    const method = faker.helpers.arrayElement(methods)
    const pathname = `/${faker.lorem.word()}/${faker.string.alphanumeric(6)}`
    const ip = faker.internet.ip()
    const contentType = faker.helpers.arrayElement(contentTypes)

    let body: string | null = null
    if (contentType === 'application/json') {
      body = JSON.stringify(
        {
          id: faker.string.uuid(),
          value: faker.lorem.words(6),
          amount: faker.number.int({ min: 1, max: 10000 }),
        },
        null,
        2,
      )
    } else if (contentType === 'application/x-www-form-urlencoded') {
      body = `a=${faker.lorem.word()}&b=${faker.lorem.word()}`
    } else if (contentType === 'text/plain') {
      body = faker.lorem.paragraph()
    } else {
      body = faker.string.alphanumeric(32)
    }

    const contentLength = Buffer.byteLength(body, 'utf8')

    return {
      id: uuidv7(),
      method,
      pathname,
      ip,
      statusCode: faker.helpers.arrayElement(statusCodes),
      contentType,
      contentLength,
      queryParams: randomQueryParams(),
      headers: randomHeaders(contentType),
      body,
      createdAt: faker.date.past(),
    }
  })

  await db.insert(webhooks).values(webhooksData)

  console.log('✅ Database seeded successfully with 60 webhooks...')
}

seed()
  .catch((error) => {
    console.error('❌ Error seeding database: ', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })

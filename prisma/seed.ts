import { PrismaClient } from '@prisma/client'
import { auth } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const email = 'user@example.com'
  const password = 'password123'

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    console.log(`User ${email} already exists`)
    return
  }

  // Create user with Better Auth signUp API
  const data = await auth.api.signUpEmail({
    body: {
      name: 'Example User',
      email,
      password,
    },
  })

  console.log(`Created user: ${data.user.email}`)
  console.log(`Login: ${email} / ${password}`)
  console.log('Seeding finished.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

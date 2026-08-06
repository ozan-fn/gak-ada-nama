import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { PrismaClient } from "@prisma/client"
import { ObjectId } from "mongodb"

const prisma = new PrismaClient()

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb"
    }),
    advanced: {
        database: {
            generateId: () => new ObjectId().toHexString()
        }
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    plugins: [
        tanstackStartCookies()
    ]
})

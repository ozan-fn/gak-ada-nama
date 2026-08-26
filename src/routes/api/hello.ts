import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: async ({ request: _request }) => {
        return new Response(
          JSON.stringify({ message: 'Hello, World!' }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      },
    },
  },
})

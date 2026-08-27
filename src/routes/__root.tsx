import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import appCss from "../styles.css?url";
import maplibreCss from "maplibre-gl/dist/maplibre-gl.css?url";
import favicon from "@/assets/favicon.ico";

// Create a client with persistent cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 60 * 1000, // 3 hours (NASA FIRMS update frequency)
      gcTime: 24 * 60 * 60 * 1000, // 24 hours cache (data stays in memory)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount (use cache)
      retry: 2,
    },
  },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Prita",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/x-icon",
        href: favicon,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: maplibreCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl sm:text-8xl font-bold text-gray-900">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm sm:text-base text-gray-500 max-w-md">
          Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
        </p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </TooltipProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Router from '@/shared/Router'

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position='top-right'
        reverseOrder={true}
        gutter={8}
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          duration: 8000,
          icon: null,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            minWidth: '320px',
            maxWidth: '420px',
            fontSize: '14px',
            animation: 'slideInRight 0.3s ease-out',
          },
          error: {
            duration: 10000,
            icon: null,
            style: {
              background: '#fef2f2',
              border: '1px solid #fecaca',
            },
          },
          success: {
            duration: 6000,
            icon: null,
            style: {
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            },
          },
        }}
        limit={3}
      />
      <Router />
    </QueryClientProvider>
  )
}

export default App

import { createBrowserRouter } from 'react-router'

import { CustomerLayout } from '../layouts/CustomerLayout'
import { HomePage } from '../pages/HomePage'
import { ProductsPage } from '../pages/ProductsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
    ],
  },
])

import { createBrowserRouter } from 'react-router'

import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { CustomerLayout } from '../layouts/CustomerLayout'
import { AccountPage } from '../pages/AccountPage'
import { CartPage } from '../pages/CartPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { ProductsPage } from '../pages/ProductsPage'
import { RegisterPage } from '../pages/RegisterPage'

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
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'account',
            element: <AccountPage />,
          },
          {
            path: 'cart',
            element: <CartPage />,
          },
        ],
      },
    ],
  },
])

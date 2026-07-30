import { createBrowserRouter } from 'react-router'

import { AdminRoute } from '../features/auth/AdminRoute'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { AdminLayout } from '../layouts/AdminLayout'
import { CustomerLayout } from '../layouts/CustomerLayout'
import { AccountPage } from '../pages/AccountPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { CheckoutResultPage } from '../pages/CheckoutResultPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { OrdersPage } from '../pages/OrdersPage'
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
        lazy: async () => {
          const { ProductDetailPage } = await import(
            '../pages/ProductDetailPage'
          )

          return {
            Component: ProductDetailPage,
          }
        },
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
            path: 'orders',
            element: <OrdersPage />,
          },
          {
            path: 'cart',
            element: <CartPage />,
          },
          {
            path: 'checkout',
            element: <CheckoutPage />,
          },
          {
            path: 'checkout/result',
            element: <CheckoutResultPage />,
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'admin',
                element: <AdminLayout />,
                children: [
                  {
                    path: 'orders',
                    lazy: async () => {
                      const { AdminOrdersPage } = await import(
                        '../pages/admin/AdminOrdersPage'
                      )

                      return {
                        Component: AdminOrdersPage,
                      }
                    },
                  },
                  {
                    path: 'products',
                    lazy: async () => {
                      const { AdminProductsPage } = await import(
                        '../pages/admin/AdminProductsPage'
                      )

                      return {
                        Component: AdminProductsPage,
                      }
                    },
                  },
                  {
                    path: 'products/new',
                    lazy: async () => {
                      const { AdminProductFormPage } = await import(
                        '../pages/admin/AdminProductFormPage'
                      )

                      return {
                        Component: AdminProductFormPage,
                      }
                    },
                  },
                  {
                    path: 'products/:id/edit',
                    lazy: async () => {
                      const { AdminProductFormPage } = await import(
                        '../pages/admin/AdminProductFormPage'
                      )

                      return {
                        Component: AdminProductFormPage,
                      }
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])

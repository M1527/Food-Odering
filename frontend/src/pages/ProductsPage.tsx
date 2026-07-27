import { useState } from 'react'

import { useCategories } from '../features/categories/queries'
import { ProductCard } from '../features/products/ProductCard'
import { useProducts } from '../features/products/queries'

const PRODUCTS_PER_PAGE = 6

export function ProductsPage() {
  const [categoryId, setCategoryId] = useState<number>()
  const [page, setPage] = useState(1)

  const categoriesQuery = useCategories()
  const productsQuery = useProducts({
    categoryId,
    page,
    limit: PRODUCTS_PER_PAGE,
    sort: 'latest',
  })

  const totalPages = productsQuery.data
    ? Math.max(1, Math.ceil(productsQuery.data.total / productsQuery.data.limit))
    : 1

  function selectCategory(nextCategoryId?: number) {
    setCategoryId(nextCategoryId)
    setPage(1)
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Danh sách sản phẩm</h1>
          <p>Khám phá các món ăn và đồ uống đang có sẵn.</p>
        </div>
      </div>

      <h2>Danh mục</h2>

      {categoriesQuery.isPending && <p>Đang tải danh mục...</p>}

      {categoriesQuery.isError && (
        <div className="error-state" role="alert">
          <p>Không thể tải danh mục. Hãy kiểm tra kết nối với backend.</p>
          <button
            type="button"
            onClick={() => void categoriesQuery.refetch()}
          >
            Thử lại
          </button>
        </div>
      )}

      {categoriesQuery.data && (
        <div className="category-filter" aria-label="Lọc theo danh mục">
          <button
            className={categoryId === undefined ? 'active' : ''}
            type="button"
            onClick={() => selectCategory()}
          >
            Tất cả
          </button>

          {categoriesQuery.data.categories.map((category) => (
            <button
              className={categoryId === category.id ? 'active' : ''}
              key={category.id}
              type="button"
              onClick={() => selectCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <div className="product-section-heading">
        <h2>Sản phẩm</h2>
        {productsQuery.data && (
          <span>{productsQuery.data.total} sản phẩm</span>
        )}
      </div>

      {productsQuery.isPending && <p>Đang tải sản phẩm...</p>}

      {productsQuery.isError && (
        <div className="error-state" role="alert">
          <p>Không thể tải sản phẩm. Hãy kiểm tra kết nối với backend.</p>
          <button type="button" onClick={() => void productsQuery.refetch()}>
            Thử lại
          </button>
        </div>
      )}

      {productsQuery.data && productsQuery.data.products.length === 0 && (
        <p>Không có sản phẩm phù hợp với danh mục này.</p>
      )}

      {productsQuery.data && productsQuery.data.products.length > 0 && (
        <>
          <ul
            className={`product-grid ${
              productsQuery.isFetching ? 'is-fetching' : ''
            }`}
          >
            {productsQuery.data.products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang sản phẩm">
              <button
                type="button"
                disabled={page === 1 || productsQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages || productsQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Trang sau
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}

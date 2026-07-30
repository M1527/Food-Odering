import { useState } from 'react'
import { Link } from 'react-router'

import { useCategories } from '../../features/categories/queries'
import {
  useAdminProducts,
  useUpdateAdminProduct,
} from '../../features/products/admin-queries'
import type {
  Product,
  ProductStatus,
} from '../../features/products/types'
import { getApiErrorMessage } from '../../lib/api-error'
import { formatCurrency } from '../../lib/format'

const PRODUCTS_PER_PAGE = 10

export function AdminProductsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<number>()
  const [status, setStatus] = useState<ProductStatus>()
  const [page, setPage] = useState(1)
  const categoriesQuery = useCategories()
  const productsQuery = useAdminProducts({
    q: query || undefined,
    categoryId,
    status,
    page,
    limit: PRODUCTS_PER_PAGE,
    sort: 'latest',
  })
  const updateProduct = useUpdateAdminProduct()
  const totalPages = productsQuery.data
    ? Math.max(
        1,
        Math.ceil(productsQuery.data.total / productsQuery.data.limit),
      )
    : 1

  function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(searchInput.trim())
    setPage(1)
  }

  function toggleStatus(product: Product) {
    const nextStatus: ProductStatus =
      product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const action = nextStatus === 'ACTIVE' ? 'hiển thị' : 'ẩn'

    if (
      !window.confirm(
        `Bạn có chắc muốn ${action} sản phẩm “${product.name}”?`,
      )
    ) {
      return
    }

    const formData = new FormData()
    formData.append('status', nextStatus)
    updateProduct.reset()
    updateProduct.mutate(
      {
        productId: product.id,
        formData,
      },
      {
        onSuccess: () => {
          if (
            status === product.status &&
            productsQuery.data?.products.length === 1 &&
            page > 1
          ) {
            setPage((currentPage) => currentPage - 1)
          }
        },
      },
    )
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Quản trị</p>
          <h1>Quản lý sản phẩm</h1>
          <p>Tạo món mới, cập nhật thông tin, tồn kho và trạng thái hiển thị.</p>
        </div>
        <Link className="primary-link" to="/admin/products/new">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="admin-product-filters">
        <form onSubmit={applySearch}>
          <input
            aria-label="Tìm sản phẩm"
            placeholder="Tìm theo tên hoặc mô tả"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <select
          aria-label="Lọc theo danh mục"
          value={categoryId ?? ''}
          onChange={(event) => {
            setCategoryId(
              event.target.value ? Number(event.target.value) : undefined,
            )
            setPage(1)
          }}
        >
          <option value="">Tất cả danh mục</option>
          {categoriesQuery.data?.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc theo trạng thái"
          value={status ?? ''}
          onChange={(event) => {
            setStatus(
              (event.target.value || undefined) as
                | ProductStatus
                | undefined,
            )
            setPage(1)
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang bán</option>
          <option value="INACTIVE">Đang ẩn</option>
        </select>
      </div>

      {updateProduct.isError && (
        <div className="form-error order-action-error" role="alert">
          {getApiErrorMessage(
            updateProduct.error,
            'Không thể cập nhật trạng thái sản phẩm.',
          )}
        </div>
      )}

      {productsQuery.isPending && <p>Đang tải sản phẩm...</p>}

      {productsQuery.isError && (
        <section className="error-state" role="alert">
          <p>Không thể tải danh sách sản phẩm.</p>
          <button type="button" onClick={() => void productsQuery.refetch()}>
            Thử lại
          </button>
        </section>
      )}

      {productsQuery.data && productsQuery.data.products.length === 0 && (
        <div className="empty-cart">
          <p>Không có sản phẩm phù hợp.</p>
        </div>
      )}

      {productsQuery.data && productsQuery.data.products.length > 0 && (
        <>
          <div
            className={`admin-product-list ${
              productsQuery.isFetching ? 'is-fetching' : ''
            }`}
          >
            {productsQuery.data.products.map((product) => {
              const isUpdating =
                updateProduct.isPending &&
                updateProduct.variables?.productId === product.id
              const image = product.attachments[0]

              return (
                <article className="admin-product-card" key={product.id}>
                  {image ? (
                    <img src={image.url} alt="" />
                  ) : (
                    <div className="admin-product-placeholder">Không có ảnh</div>
                  )}

                  <div className="admin-product-info">
                    <div>
                      <span>{product.category.name}</span>
                      <h2>{product.name}</h2>
                    </div>
                    <div className="admin-product-metrics">
                      <strong>{formatCurrency(product.price)}</strong>
                      <span>Tồn kho: {product.stock}</span>
                      <span>{product.attachments.length} ảnh</span>
                    </div>
                  </div>

                  <span
                    className={`product-admin-status ${
                      product.status === 'ACTIVE'
                        ? 'is-active'
                        : 'is-inactive'
                    }`}
                  >
                    {product.status === 'ACTIVE' ? 'Đang bán' : 'Đang ẩn'}
                  </span>

                  <div className="admin-product-actions">
                    <Link to={`/admin/products/${product.id}/edit`}>
                      Chỉnh sửa
                    </Link>
                    <button
                      type="button"
                      disabled={updateProduct.isPending}
                      onClick={() => toggleStatus(product)}
                    >
                      {isUpdating
                        ? 'Đang cập nhật...'
                        : product.status === 'ACTIVE'
                          ? 'Ẩn sản phẩm'
                          : 'Hiển thị'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang sản phẩm admin">
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

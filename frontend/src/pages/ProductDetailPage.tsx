import { Link, useParams } from 'react-router'

import { useProduct } from '../features/products/queries'
import { formatCurrency } from '../lib/format'

export function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id)
  const isValidProductId = Number.isInteger(productId) && productId > 0
  const productQuery = useProduct(productId)

  if (!isValidProductId) {
    return (
      <section className="error-state" role="alert">
        <p>Mã sản phẩm không hợp lệ.</p>
        <Link to="/products">Quay lại danh sách sản phẩm</Link>
      </section>
    )
  }

  if (productQuery.isPending) {
    return <p>Đang tải thông tin sản phẩm...</p>
  }

  if (productQuery.isError) {
    return (
      <section className="error-state" role="alert">
        <p>Không thể tải thông tin sản phẩm.</p>
        <button type="button" onClick={() => void productQuery.refetch()}>
          Thử lại
        </button>
        <Link to="/products">Quay lại danh sách</Link>
      </section>
    )
  }

  const product = productQuery.data.product

  return (
    <section>
      <Link className="back-link" to="/products">
        ← Quay lại danh sách sản phẩm
      </Link>

      <div className="product-detail">
        <div className="product-gallery">
          {product.attachments.length > 0 ? (
            product.attachments.map((attachment, index) => (
              <img
                className={index === 0 ? 'product-detail-image primary' : 'product-detail-image'}
                key={attachment.id}
                src={attachment.url}
                alt={`${product.name} - ảnh ${index + 1}`}
              />
            ))
          ) : (
            <div className="product-detail-image primary product-image-placeholder">
              Chưa có ảnh
            </div>
          )}
        </div>

        <div className="product-detail-content">
          <p className="product-category">{product.category.name}</p>
          <h1>{product.name}</h1>

          {product.isFeatured && (
            <span className="featured-badge">Sản phẩm nổi bật</span>
          )}

          <p className="product-detail-rating">
            ★ {product.ratingAverage.toFixed(1)} · {product.reviewsCount} đánh
            giá
          </p>
          <p className="product-detail-price">
            {formatCurrency(product.price)}
          </p>
          <p className={product.stock > 0 ? 'stock-in' : 'stock-out'}>
            {product.stock > 0
              ? `Còn ${product.stock} sản phẩm`
              : 'Sản phẩm tạm hết hàng'}
          </p>

          <div className="product-detail-description">
            <h2>Mô tả</h2>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

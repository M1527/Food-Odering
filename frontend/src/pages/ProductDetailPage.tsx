import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useAuth } from '../features/auth/useAuth'
import { useAddCartItem } from '../features/cart/queries'
import { ProductGallery } from '../features/products/ProductGallery'
import { useProduct } from '../features/products/queries'
import { ProductReviews } from '../features/reviews/ProductReviews'
import { getApiErrorMessage } from '../lib/api-error'
import { formatCurrency } from '../lib/format'

export function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [quantity, setQuantity] = useState(1)
  const [cartMessage, setCartMessage] = useState<string>()
  const [cartError, setCartError] = useState<string>()
  const productId = Number(id)
  const isValidProductId = Number.isInteger(productId) && productId > 0
  const productQuery = useProduct(productId)
  const addCartItem = useAddCartItem(user?.id ?? 0)

  async function handleAddToCart() {
    if (!user) {
      navigate('/login', {
        state: {
          from: location.pathname,
        },
      })
      return
    }

    setCartMessage(undefined)
    setCartError(undefined)

    try {
      const response = await addCartItem.mutateAsync({
        productId,
        quantity,
      })
      setCartMessage(response.message)
    } catch (error) {
      setCartError(
        getApiErrorMessage(error, 'Không thể thêm sản phẩm vào giỏ hàng.'),
      )
    }
  }

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
        <ProductGallery
          productName={product.name}
          attachments={product.attachments}
        />

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

          <div className="add-to-cart">
            <div className="quantity-control" aria-label="Chọn số lượng">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={quantity === 1 || addCartItem.isPending}
                onClick={() => setQuantity((current) => current - 1)}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={
                  quantity >= product.stock ||
                  product.stock === 0 ||
                  addCartItem.isPending
                }
                onClick={() => setQuantity((current) => current + 1)}
              >
                +
              </button>
            </div>

            <button
              className="primary-button add-cart-button"
              type="button"
              disabled={product.stock === 0 || addCartItem.isPending}
              onClick={() => void handleAddToCart()}
            >
              {addCartItem.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          </div>

          {cartMessage && (
            <p className="cart-success" role="status">
              {cartMessage}
            </p>
          )}
          {cartError && (
            <p className="field-error" role="alert">
              {cartError}
            </p>
          )}

          <div className="product-detail-description">
            <h2>Mô tả</h2>
            <p>{product.description}</p>
          </div>
        </div>
      </div>

      <ProductReviews key={product.id} productId={product.id} />
    </section>
  )
}

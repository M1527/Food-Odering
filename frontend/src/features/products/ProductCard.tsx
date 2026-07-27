import { formatCurrency } from '../../lib/format'
import type { Product } from './types'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const thumbnail = product.attachments[0]?.url

  return (
    <article className="product-card">
      {thumbnail ? (
        <img
          className="product-image"
          src={thumbnail}
          alt={product.name}
          loading="lazy"
        />
      ) : (
        <div className="product-image product-image-placeholder">
          Chưa có ảnh
        </div>
      )}

      <div className="product-card-content">
        <p className="product-category">{product.category.name}</p>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-rating">
          ★ {product.ratingAverage.toFixed(1)} ({product.reviewsCount} đánh giá)
        </p>

        <div className="product-card-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <span>{product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng'}</span>
        </div>
      </div>
    </article>
  )
}

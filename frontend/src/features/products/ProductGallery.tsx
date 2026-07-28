import { useRef, useState } from 'react'

import type { ProductAttachment } from './types'

type ProductGalleryProps = {
  productName: string
  attachments: ProductAttachment[]
}

export function ProductGallery({
  productName,
  attachments,
}: ProductGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState(
    attachments[0]?.id,
  )
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectedImage =
    attachments.find((attachment) => attachment.id === selectedImageId) ??
    attachments[0]

  if (!selectedImage) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-main product-image-placeholder">
          Chưa có ảnh
        </div>
      </div>
    )
  }

  return (
    <div className="product-gallery">
      <button
        className="product-gallery-main"
        type="button"
        aria-label={`Phóng to ảnh ${productName}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <img src={selectedImage.url} alt={productName} />
        <span className="zoom-hint">Bấm để phóng to</span>
      </button>

      {attachments.length > 1 && (
        <div
          className="product-gallery-thumbnails"
          aria-label="Các ảnh sản phẩm"
        >
          {attachments.map((attachment, index) => (
            <button
              className={`product-gallery-thumbnail ${
                attachment.id === selectedImage.id ? 'active' : ''
              }`}
              key={attachment.id}
              type="button"
              aria-label={`Xem ảnh ${index + 1} của ${productName}`}
              onClick={() => setSelectedImageId(attachment.id)}
            >
              <img
                src={attachment.url}
                alt={`${productName} - ảnh ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}

      <dialog
        className="image-lightbox"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close()
          }
        }}
      >
        <button
          className="lightbox-close"
          type="button"
          aria-label="Đóng ảnh phóng to"
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
        <img src={selectedImage.url} alt={productName} />
      </dialog>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'

import { useCategories } from '../../features/categories/queries'
import type { Category } from '../../features/categories/types'
import {
  useCreateAdminProduct,
  useUpdateAdminProduct,
} from '../../features/products/admin-queries'
import { useProduct } from '../../features/products/queries'
import type {
  Product,
  ProductStatus,
} from '../../features/products/types'
import { getApiErrorMessage } from '../../lib/api-error'

const MAX_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const productSchema = z.object({
  categoryId: z.coerce
    .number()
    .int()
    .positive('Vui lòng chọn danh mục.'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm.'),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả.'),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Giá sản phẩm không hợp lệ.')
    .refine((value) => Number(value) > 0, 'Giá phải lớn hơn 0.'),
  stock: z.coerce
    .number()
    .int('Tồn kho phải là số nguyên.')
    .min(0, 'Tồn kho không được âm.'),
  isFeatured: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type ProductFormInput = z.input<typeof productSchema>
type ProductFormValues = z.output<typeof productSchema>

type ProductFormProps = {
  categories: Category[]
  product?: Product
}

export function AdminProductFormPage() {
  const { id } = useParams()
  const isEditing = id !== undefined
  const productId = Number(id)
  const validProductId =
    !isEditing || (Number.isInteger(productId) && productId > 0)
  const categoriesQuery = useCategories()
  const productQuery = useProduct(isEditing ? productId : 0)

  if (!validProductId) {
    return (
      <section className="error-state" role="alert">
        <p>Mã sản phẩm không hợp lệ.</p>
        <Link to="/admin/products">Quay lại danh sách</Link>
      </section>
    )
  }

  if (
    categoriesQuery.isPending ||
    (isEditing && productQuery.isPending)
  ) {
    return <p>Đang tải biểu mẫu sản phẩm...</p>
  }

  if (
    categoriesQuery.isError ||
    (isEditing && productQuery.isError)
  ) {
    return (
      <section className="error-state" role="alert">
        <p>Không thể tải dữ liệu để chỉnh sửa sản phẩm.</p>
        <Link to="/admin/products">Quay lại danh sách</Link>
      </section>
    )
  }

  const product = isEditing ? productQuery.data?.product : undefined

  if (isEditing && !product) {
    return null
  }

  return (
    <ProductForm
      key={product?.id ?? 'new'}
      categories={categoriesQuery.data.categories}
      product={product}
    />
  )
}

function ProductForm({ categories, product }: ProductFormProps) {
  const navigate = useNavigate()
  const createProduct = useCreateAdminProduct()
  const updateProduct = useUpdateAdminProduct()
  const [images, setImages] = useState<File[]>([])
  const [fileError, setFileError] = useState<string>()
  const mutation = product ? updateProduct : createProduct
  const selectableCategories = includeCurrentCategory(categories, product)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: product?.categoryId ?? selectableCategories[0]?.id ?? 0,
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product ? String(Number(product.price)) : '',
      stock: product?.stock ?? 0,
      isFeatured: product?.isFeatured ?? false,
      status: product?.status ?? 'ACTIVE',
    },
  })

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])
    const error = validateImages(selectedFiles)

    if (error) {
      setImages([])
      setFileError(error)
      event.target.value = ''
      return
    }

    setImages(selectedFiles)
    setFileError(undefined)
  }

  async function submit(values: ProductFormValues) {
    if (fileError) {
      return
    }

    createProduct.reset()
    updateProduct.reset()

    const formData = createProductFormData(values, images)

    try {
      if (product) {
        await updateProduct.mutateAsync({
          productId: product.id,
          formData,
        })
      } else {
        await createProduct.mutateAsync(formData)
      }

      navigate('/admin/products', { replace: true })
    } catch {
      // Mutation state renders the API error below.
    }
  }

  return (
    <section className="admin-page">
      <Link className="back-link" to="/admin/products">
        ← Quay lại danh sách sản phẩm
      </Link>

      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Quản trị</p>
          <h1>{product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
          <p>
            {product
              ? `Đang chỉnh sửa “${product.name}”.`
              : 'Nhập thông tin và hình ảnh cho sản phẩm mới.'}
          </p>
        </div>
      </div>

      <form
        className="admin-product-form"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        {mutation.isError && (
          <div className="form-error admin-form-wide" role="alert">
            {getApiErrorMessage(
              mutation.error,
              product
                ? 'Không thể cập nhật sản phẩm.'
                : 'Không thể tạo sản phẩm.',
            )}
          </div>
        )}

        <label>
          Tên sản phẩm
          <input {...register('name')} />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
        </label>

        <label>
          Danh mục
          <select {...register('categoryId')}>
            {selectableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <span className="field-error">{errors.categoryId.message}</span>
          )}
        </label>

        <label className="admin-form-wide">
          Mô tả
          <textarea rows={5} {...register('description')} />
          {errors.description && (
            <span className="field-error">{errors.description.message}</span>
          )}
        </label>

        <label>
          Giá bán
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            {...register('price')}
          />
          {errors.price && (
            <span className="field-error">{errors.price.message}</span>
          )}
        </label>

        <label>
          Tồn kho
          <input type="number" min="0" step="1" {...register('stock')} />
          {errors.stock && (
            <span className="field-error">{errors.stock.message}</span>
          )}
        </label>

        <label>
          Trạng thái
          <select {...register('status')}>
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Đang ẩn</option>
          </select>
        </label>

        <label className="admin-checkbox">
          <input type="checkbox" {...register('isFeatured')} />
          Sản phẩm nổi bật
        </label>

        <div className="admin-image-field admin-form-wide">
          <label htmlFor="product-images">
            Hình ảnh
            <input
              id="product-images"
              type="file"
              accept="image/*"
              multiple
              onChange={selectImages}
            />
          </label>
          <small>
            Tối đa 10 ảnh, mỗi ảnh không quá 5 MB.
            {product &&
              ' Để trống để giữ ảnh cũ; chọn ảnh mới sẽ thay toàn bộ ảnh hiện tại.'}
          </small>
          {fileError && <span className="field-error">{fileError}</span>}
          {images.length > 0 && (
            <ul className="selected-image-list">
              {images.map((image) => (
                <li key={`${image.name}-${image.lastModified}`}>
                  {image.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {product && product.attachments.length > 0 && (
          <div className="current-product-images admin-form-wide">
            <strong>Ảnh hiện tại</strong>
            <div>
              {product.attachments.map((attachment) => (
                <img
                  key={attachment.id}
                  src={attachment.url}
                  alt={product.name}
                />
              ))}
            </div>
          </div>
        )}

        <div className="admin-form-actions admin-form-wide">
          <Link to="/admin/products">Hủy</Link>
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Đang lưu...'
              : product
                ? 'Lưu thay đổi'
                : 'Tạo sản phẩm'}
          </button>
        </div>
      </form>
    </section>
  )
}

function createProductFormData(
  values: ProductFormValues,
  images: File[],
) {
  const formData = new FormData()

  formData.append('categoryId', String(values.categoryId))
  formData.append('name', values.name)
  formData.append('description', values.description)
  formData.append('price', values.price)
  formData.append('stock', String(values.stock))
  formData.append('isFeatured', String(values.isFeatured))
  formData.append('status', values.status satisfies ProductStatus)

  for (const image of images) {
    formData.append('images', image)
  }

  return formData
}

function validateImages(images: File[]) {
  if (images.length > MAX_IMAGES) {
    return `Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`
  }

  if (images.some((image) => !image.type.startsWith('image/'))) {
    return 'Tất cả file được chọn phải là hình ảnh.'
  }

  if (images.some((image) => image.size > MAX_IMAGE_SIZE)) {
    return 'Mỗi ảnh không được vượt quá 5 MB.'
  }

  return undefined
}

function includeCurrentCategory(
  categories: Category[],
  product?: Product,
) {
  if (
    !product ||
    categories.some((category) => category.id === product.category.id)
  ) {
    return categories
  }

  return [product.category, ...categories]
}

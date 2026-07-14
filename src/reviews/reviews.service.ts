import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { translate } from '../common/utils/i18n.util';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../orders/entities/order.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { Review } from './entities/review.entity';

export type ProductReviewStats = {
  ratingAverage: number;
  reviewsCount: number;
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(
    productId: number,
    userId: number,
    createReviewDto: CreateReviewDto,
  ) {
    let reviewWithUser: Review;

    try {
      reviewWithUser = await this.dataSource.transaction(async (manager) => {
        const productsRepository = manager.getRepository(Product);
        const reviewsRepository = manager.getRepository(Review);
        const orderItemsRepository = manager.getRepository(OrderItem);

        const product = await productsRepository.findOne({
          where: {
            id: productId,
          },
          lock: {
            mode: 'pessimistic_read',
          },
        });

        if (!product) {
          throw new NotFoundException(
            translate(this.i18n, 'products.errors.notFound'),
          );
        }

        const existingReview = await reviewsRepository.findOne({
          where: {
            userId,
            productId,
          },
        });

        if (existingReview) {
          throw new ConflictException(
            translate(this.i18n, 'reviews.errors.alreadyReviewed'),
          );
        }

        const purchasedItem = await orderItemsRepository
          .createQueryBuilder('orderItem')
          .innerJoin('orderItem.order', 'order')
          .innerJoin('order.payment', 'payment')
          .where('order.userId = :userId', { userId })
          .andWhere('orderItem.productId = :productId', { productId })
          .andWhere('order.status = :doneStatus', {
            doneStatus: OrderStatus.Done,
          })
          .andWhere('payment.status = :paidStatus', {
            paidStatus: PaymentStatus.Paid,
          })
          .setLock('pessimistic_read')
          .getOne();

        if (!purchasedItem) {
          throw new ForbiddenException(
            translate(this.i18n, 'reviews.errors.notPurchased'),
          );
        }

        const review = reviewsRepository.create({
          userId,
          productId,
          rating: createReviewDto.rating,
          comment: createReviewDto.comment,
          user: {
            id: userId,
          } as User,
          product,
        });

        const savedReview = await reviewsRepository.save(review);

        return reviewsRepository.findOneOrFail({
          where: {
            id: savedReview.id,
          },
          relations: {
            user: true,
          },
        });
      });
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException(
          translate(this.i18n, 'reviews.errors.alreadyReviewed'),
        );
      }

      throw error;
    }

    return {
      message: translate(this.i18n, 'reviews.messages.created'),
      review: ReviewResponseDto.createFromReview(reviewWithUser),
    };
  }

  async findAll(productId: number, query: QueryReviewsDto) {
    const productExists = await this.productsRepository.exists({
      where: {
        id: productId,
      },
    });

    if (!productExists) {
      throw new NotFoundException(
        translate(this.i18n, 'products.errors.notFound'),
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        productId,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      message: translate(this.i18n, 'reviews.messages.found'),
      reviews: reviews.map((review) =>
        ReviewResponseDto.createFromReview(review),
      ),
      total,
    };
  }

  async getStatsByProductIds(
    productIds: number[],
  ): Promise<Map<number, ProductReviewStats>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const rows = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.productId', 'productId')
      .addSelect('COUNT(review.id)', 'reviewsCount')
      .addSelect('AVG(review.rating)', 'ratingAverage')
      .where('review.productId IN (:...productIds)', {
        productIds,
      })
      .groupBy('review.productId')
      .getRawMany<{
        productId: string;
        reviewsCount: string;
        ratingAverage: string;
      }>();

    const result = new Map<number, ProductReviewStats>();

    for (const row of rows) {
      result.set(Number(row.productId), {
        reviewsCount: Number(row.reviewsCount),
        ratingAverage: Number(Number(row.ratingAverage).toFixed(1)),
      });
    }

    return result;
  }

  private isDuplicateEntryError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      errno?: number;
    };

    return driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  }
}

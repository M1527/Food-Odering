export interface DailyReportEmailData {
  reportDate: string;
  totalOrders: number;
  totalRevenue: number;
  newUsers: number;
  ordersByStatus: Record<string, number>;
  bestSellingProducts: Array<{
    productId: number;
    name: string;
    soldQuantity: number;
  }>;
}

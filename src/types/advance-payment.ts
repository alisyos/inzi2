export interface AdvancePayment {
  id: string; // 고유넘버
  electricKey: number; // 전기키
  account: string; // 계정
  glAccountName: string; // G/L계정명
  moldMaster: string; // 금형마스터
  moldMasterDetails: string; // 금형마스터내역
  contractNumber?: string; // 계약번호
  companyCode: string; // 업체코드
  companyName: string; // 업체명
  yearMonth: string; // 연도/월
  electricDate: string; // 전기일
  currency: string; // 통화
  voucherCurrencyAmount: number; // 전표통화액
  localCurrencyAmount: number; // 현지통화액
  baseDate: string; // 기준일
  startPlanNumber?: string; // 착수기안번호
  paymentPlanNumber?: string; // 지급기안번호
  reference?: string; // 참조
  collectionManager: string; // 회수담당
  department: string; // 부서
  businessPlace?: string; // 사업장
  investmentBudget?: string; // 투자예산
  voucherNumber: string; // 전표번호
  text: string; // 텍스트
  paymentStatus: string; // 대금지급
  settlementProgress?: string; // 정산진행현황
  notes?: string; // 비고
  overdue: string; // 기한경과
  overdueMonths?: number; // 경과기간(개월)
  customerName?: string; // 고객명
  responsibleTeam: string; // 담당팀
  salesManager: string; // 영업담당
  createdAt: string;
  updatedAt: string;
}

export interface AdvancePaymentFilters {
  companyName?: string;
  department?: string;
  paymentStatus?: string;
  overdue?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

export interface AdvancePaymentStats {
  totalAmount: number;
  totalCount: number;
  overdueAmount: number;
  overdueCount: number;
  byDepartment: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
}
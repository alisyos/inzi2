export interface ProjectAnalysisItem {
  department: string;
  moldMaster: string;
  moldMasterDetails: string;
  settlementProgress: string;
  paymentStatus: string;
  advancePaymentAmount: number; // 선급금 (G/L계정명이 선급금인 경우)
  prepaymentAmount: number; // 선수금 (G/L계정명이 선수금인 경우)
  totalAmount: number;
  currency: string;
  itemCount: number;
}

export interface DepartmentSummary {
  department: string;
  totalAdvancePayment: number; // 총 선급금
  totalPrepayment: number; // 총 선수금
  totalAmount: number; // 총 금액
  itemCount: number; // 항목 수
  projectCount: number; // 프로젝트 수
  projects: ProjectAnalysisItem[];
  currencyBreakdown: Record<string, {
    advancePayment: number;
    prepayment: number;
    total: number;
  }>;
}

export interface ProjectAnalysisFilters {
  department?: string;
  moldMaster?: string;
  paymentStatus?: string;
  settlementProgress?: string;
  currency?: string;
  searchTerm?: string;
}

export interface ProjectAnalysisStats {
  totalDepartments: number;
  totalProjects: number;
  totalAdvancePayment: number;
  totalPrepayment: number;
  grandTotal: number;
  topDepartmentByAmount: string;
  topProjectByAmount: string;
}
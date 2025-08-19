// 담당자별 분석 아이템
export interface ManagerAnalysisItem {
  department: string;
  collectionManager: string;  // 회수담당
  settlementProgress: string; // 정산진행현황
  advancePaymentAmount: number; // 선급금
  prepaymentAmount: number; // 선수금
  totalAmount: number; // 합계
  itemCount: number; // 항목 수
}

// 부서별 요약 정보
export interface DepartmentManagerSummary {
  department: string;
  totalAdvancePayment: number;
  totalPrepayment: number;
  totalAmount: number;
  itemCount: number;
  managerCount: number;
  managers: ManagerAnalysisItem[];
}

// 담당자별 분석 필터
export interface ManagerAnalysisFilters {
  department?: string;
  collectionManager?: string;
  settlementProgress?: string;
  searchTerm?: string;
}

// 담당자별 분석 통계
export interface ManagerAnalysisStats {
  totalDepartments: number;
  totalManagers: number;
  totalAdvancePayment: number;
  totalPrepayment: number;
  grandTotal: number;
  topDepartmentByAmount: string;
  topManagerByAmount: string;
}
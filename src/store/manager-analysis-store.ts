import { create } from 'zustand';
import { useAdvancePaymentStore } from './advance-payment-store';
import { 
  ManagerAnalysisItem, 
  DepartmentManagerSummary, 
  ManagerAnalysisFilters, 
  ManagerAnalysisStats 
} from '@/types/manager-analysis';

interface ManagerAnalysisStore {
  // 데이터 상태
  departmentSummaries: DepartmentManagerSummary[];
  filteredSummaries: DepartmentManagerSummary[];
  stats: ManagerAnalysisStats;
  loading: boolean;
  error: string | null;

  // 필터 상태
  filters: ManagerAnalysisFilters;
  
  // 액션
  generateAnalysis: () => void;
  setFilters: (filters: Partial<ManagerAnalysisFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  exportToCSV: () => void;
}

export const useManagerAnalysisStore = create<ManagerAnalysisStore>((set, get) => ({
  // 초기 상태
  departmentSummaries: [],
  filteredSummaries: [],
  stats: {
    totalDepartments: 0,
    totalManagers: 0,
    totalAdvancePayment: 0,
    totalPrepayment: 0,
    grandTotal: 0,
    topDepartmentByAmount: '',
    topManagerByAmount: '',
  },
  loading: false,
  error: null,
  filters: {},

  // 분석 데이터 생성
  generateAnalysis: () => {
    set({ loading: true, error: null });
    
    try {
      // 메인 스토어에서 데이터 가져오기
      const payments = useAdvancePaymentStore.getState().payments;
      
      if (payments.length === 0) {
        set({ 
          departmentSummaries: [],
          filteredSummaries: [],
          loading: false 
        });
        return;
      }

      const departmentMap = new Map<string, DepartmentManagerSummary>();

      payments.forEach(payment => {
        const dept = payment.department || '미지정';
        const manager = payment.collectionManager || '미지정';
        
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            totalAdvancePayment: 0,
            totalPrepayment: 0,
            totalAmount: 0,
            itemCount: 0,
            managerCount: 0,
            managers: []
          });
        }

        const summary = departmentMap.get(dept)!;
        
        // 선급금/선수금 구분 (G/L계정명으로 판단)
        const isAdvancePayment = payment.glAccountName.includes('선급금');
        const isPrepayment = payment.glAccountName.includes('선수금');
        
        const amount = payment.localCurrencyAmount;
        
        if (isAdvancePayment) {
          summary.totalAdvancePayment += amount;
        } else if (isPrepayment) {
          summary.totalPrepayment += amount;
        }
        
        summary.totalAmount += amount;
        summary.itemCount++;

        // 담당자별 데이터 추가
        const existingManager = summary.managers.find(m => m.collectionManager === manager);
        
        if (existingManager) {
          if (isAdvancePayment) {
            existingManager.advancePaymentAmount += amount;
          } else if (isPrepayment) {
            existingManager.prepaymentAmount += amount;
          }
          existingManager.totalAmount += amount;
          existingManager.itemCount++;
          
          // 정산진행현황 업데이트 (가장 최근 상태로)
          if (payment.settlementProgress) {
            existingManager.settlementProgress = payment.settlementProgress;
          }
        } else {
          summary.managers.push({
            department: dept,
            collectionManager: manager,
            settlementProgress: payment.settlementProgress || '미진행',
            advancePaymentAmount: isAdvancePayment ? amount : 0,
            prepaymentAmount: isPrepayment ? amount : 0,
            totalAmount: amount,
            itemCount: 1
          });
          summary.managerCount++;
        }
      });

      const departmentSummaries = Array.from(departmentMap.values())
        .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));

      // 각 부서의 담당자를 금액 순으로 정렬
      departmentSummaries.forEach(dept => {
        dept.managers.sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));
      });

      // 통계 계산
      const allManagers = departmentSummaries.flatMap(dept => dept.managers);
      const topManager = allManagers.sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))[0];
      
      const stats: ManagerAnalysisStats = {
        totalDepartments: departmentSummaries.length,
        totalManagers: new Set(allManagers.map(m => m.collectionManager)).size,
        totalAdvancePayment: departmentSummaries.reduce((sum, dept) => sum + dept.totalAdvancePayment, 0),
        totalPrepayment: departmentSummaries.reduce((sum, dept) => sum + dept.totalPrepayment, 0),
        grandTotal: departmentSummaries.reduce((sum, dept) => sum + dept.totalAmount, 0),
        topDepartmentByAmount: departmentSummaries[0]?.department || '',
        topManagerByAmount: topManager?.collectionManager || ''
      };

      set({ 
        departmentSummaries,
        stats,
        loading: false 
      });
      
      get().applyFilters();

    } catch (error) {
      console.error('담당자별 분석 생성 오류:', error);
      set({ 
        loading: false, 
        error: '담당자별 분석 생성에 실패했습니다.' 
      });
    }
  },

  // 필터 설정
  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });
    get().applyFilters();
  },

  // 필터 초기화
  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  },

  // 필터 적용
  applyFilters: () => {
    const { departmentSummaries, filters } = get();
    let filtered = [...departmentSummaries];

    // 부서 필터
    if (filters.department && filters.department !== 'all') {
      filtered = filtered.filter(summary => 
        summary.department === filters.department
      );
    }

    // 담당자 필터
    if (filters.collectionManager) {
      filtered = filtered.map(summary => ({
        ...summary,
        managers: summary.managers.filter(manager =>
          manager.collectionManager.toLowerCase().includes(filters.collectionManager!.toLowerCase())
        )
      })).filter(summary => summary.managers.length > 0);
    }

    // 정산 진행 상황 필터
    if (filters.settlementProgress && filters.settlementProgress !== 'all') {
      filtered = filtered.map(summary => ({
        ...summary,
        managers: summary.managers.filter(manager =>
          manager.settlementProgress === filters.settlementProgress
        )
      })).filter(summary => summary.managers.length > 0);
    }

    // 통합 검색
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.map(summary => ({
        ...summary,
        managers: summary.managers.filter(manager =>
          manager.collectionManager.toLowerCase().includes(searchTerm) ||
          manager.settlementProgress.toLowerCase().includes(searchTerm) ||
          manager.department.toLowerCase().includes(searchTerm)
        )
      })).filter(summary => summary.managers.length > 0);
    }

    // 필터링된 결과의 총계 재계산
    filtered.forEach(dept => {
      dept.totalAdvancePayment = dept.managers.reduce((sum, m) => sum + m.advancePaymentAmount, 0);
      dept.totalPrepayment = dept.managers.reduce((sum, m) => sum + m.prepaymentAmount, 0);
      dept.totalAmount = dept.managers.reduce((sum, m) => sum + m.totalAmount, 0);
      dept.itemCount = dept.managers.reduce((sum, m) => sum + m.itemCount, 0);
      dept.managerCount = dept.managers.length;
    });

    set({ filteredSummaries: filtered });
  },

  // CSV 내보내기
  exportToCSV: () => {
    const { filteredSummaries } = get();
    
    const csvData = [];
    csvData.push(['부서', '회수담당', '정산진행현황', '선급금', '선수금', '합계', '항목수']);

    filteredSummaries.forEach(dept => {
      dept.managers.forEach(manager => {
        csvData.push([
          manager.department,
          manager.collectionManager,
          manager.settlementProgress,
          manager.advancePaymentAmount.toLocaleString(),
          manager.prepaymentAmount.toLocaleString(),
          manager.totalAmount.toLocaleString(),
          manager.itemCount.toString()
        ]);
      });
      
      // 부서 소계 행 추가
      csvData.push([
        `${dept.department} 소계`,
        '',
        '',
        dept.totalAdvancePayment.toLocaleString(),
        dept.totalPrepayment.toLocaleString(),
        dept.totalAmount.toLocaleString(),
        dept.itemCount.toString()
      ]);
      csvData.push(['']); // 빈 행
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `담당자별_분석_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));
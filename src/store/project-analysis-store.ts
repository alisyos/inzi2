import { create } from 'zustand';
import { useAdvancePaymentStore } from './advance-payment-store';
import { 
  ProjectAnalysisItem, 
  DepartmentSummary, 
  ProjectAnalysisFilters, 
  ProjectAnalysisStats 
} from '@/types/project-analysis';
import { AdvancePayment } from '@/types/advance-payment';

interface ProjectAnalysisStore {
  // 데이터 상태
  departmentSummaries: DepartmentSummary[];
  filteredSummaries: DepartmentSummary[];
  stats: ProjectAnalysisStats;
  loading: boolean;
  error: string | null;

  // 필터 상태
  filters: ProjectAnalysisFilters;
  
  // 액션
  generateAnalysis: () => void;
  setFilters: (filters: Partial<ProjectAnalysisFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  exportToCSV: () => void;
}

export const useProjectAnalysisStore = create<ProjectAnalysisStore>((set, get) => ({
  // 초기 상태
  departmentSummaries: [],
  filteredSummaries: [],
  stats: {
    totalDepartments: 0,
    totalProjects: 0,
    totalAdvancePayment: 0,
    totalPrepayment: 0,
    grandTotal: 0,
    topDepartmentByAmount: '',
    topProjectByAmount: '',
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

      const departmentMap = new Map<string, DepartmentSummary>();

      payments.forEach(payment => {
        const dept = payment.department || '미지정';
        
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            totalAdvancePayment: 0,
            totalPrepayment: 0,
            totalAmount: 0,
            itemCount: 0,
            projectCount: 0,
            projects: [],
            currencyBreakdown: {}
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

        // 통화별 분석
        if (!summary.currencyBreakdown[payment.currency]) {
          summary.currencyBreakdown[payment.currency] = {
            advancePayment: 0,
            prepayment: 0,
            total: 0
          };
        }
        
        const currencyData = summary.currencyBreakdown[payment.currency];
        if (isAdvancePayment) {
          currencyData.advancePayment += amount;
        } else if (isPrepayment) {
          currencyData.prepayment += amount;
        }
        currencyData.total += amount;

        // 프로젝트별 데이터 추가
        const existingProject = summary.projects.find(p => p.moldMaster === payment.moldMaster);
        
        if (existingProject) {
          if (isAdvancePayment) {
            existingProject.advancePaymentAmount += amount;
          } else if (isPrepayment) {
            existingProject.prepaymentAmount += amount;
          }
          existingProject.totalAmount += amount;
          existingProject.itemCount++;
        } else {
          summary.projects.push({
            department: dept,
            moldMaster: payment.moldMaster,
            moldMasterDetails: payment.moldMasterDetails,
            settlementProgress: payment.settlementProgress || '미진행',
            paymentStatus: payment.paymentStatus,
            advancePaymentAmount: isAdvancePayment ? amount : 0,
            prepaymentAmount: isPrepayment ? amount : 0,
            totalAmount: amount,
            currency: payment.currency,
            itemCount: 1
          });
          summary.projectCount++;
        }
      });

      const departmentSummaries = Array.from(departmentMap.values())
        .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));

      // 각 부서의 프로젝트를 금액 순으로 정렬
      departmentSummaries.forEach(dept => {
        dept.projects.sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));
      });

      // 통계 계산
      const stats: ProjectAnalysisStats = {
        totalDepartments: departmentSummaries.length,
        totalProjects: departmentSummaries.reduce((sum, dept) => sum + dept.projectCount, 0),
        totalAdvancePayment: departmentSummaries.reduce((sum, dept) => sum + dept.totalAdvancePayment, 0),
        totalPrepayment: departmentSummaries.reduce((sum, dept) => sum + dept.totalPrepayment, 0),
        grandTotal: departmentSummaries.reduce((sum, dept) => sum + dept.totalAmount, 0),
        topDepartmentByAmount: departmentSummaries[0]?.department || '',
        topProjectByAmount: departmentSummaries
          .flatMap(dept => dept.projects)
          .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))[0]?.moldMaster || ''
      };

      set({ 
        departmentSummaries,
        stats,
        loading: false 
      });
      
      get().applyFilters();

    } catch (error) {
      console.error('프로젝트 분석 생성 오류:', error);
      set({ 
        loading: false, 
        error: '프로젝트 분석 생성에 실패했습니다.' 
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

    // 금형마스터 검색
    if (filters.moldMaster) {
      filtered = filtered.map(summary => ({
        ...summary,
        projects: summary.projects.filter(project =>
          project.moldMaster.toLowerCase().includes(filters.moldMaster!.toLowerCase()) ||
          project.moldMasterDetails.toLowerCase().includes(filters.moldMaster!.toLowerCase())
        )
      })).filter(summary => summary.projects.length > 0);
    }

    // 지급 상태 필터
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      filtered = filtered.map(summary => ({
        ...summary,
        projects: summary.projects.filter(project =>
          project.paymentStatus === filters.paymentStatus
        )
      })).filter(summary => summary.projects.length > 0);
    }

    // 정산 진행 상황 필터
    if (filters.settlementProgress && filters.settlementProgress !== 'all') {
      filtered = filtered.map(summary => ({
        ...summary,
        projects: summary.projects.filter(project =>
          project.settlementProgress === filters.settlementProgress
        )
      })).filter(summary => summary.projects.length > 0);
    }

    // 통화 필터
    if (filters.currency && filters.currency !== 'all') {
      filtered = filtered.map(summary => ({
        ...summary,
        projects: summary.projects.filter(project =>
          project.currency === filters.currency
        )
      })).filter(summary => summary.projects.length > 0);
    }

    // 통합 검색
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.map(summary => ({
        ...summary,
        projects: summary.projects.filter(project =>
          project.moldMaster.toLowerCase().includes(searchTerm) ||
          project.moldMasterDetails.toLowerCase().includes(searchTerm) ||
          project.paymentStatus.toLowerCase().includes(searchTerm) ||
          project.settlementProgress.toLowerCase().includes(searchTerm)
        )
      })).filter(summary => summary.projects.length > 0);
    }

    set({ filteredSummaries: filtered });
  },

  // CSV 내보내기
  exportToCSV: () => {
    const { filteredSummaries } = get();
    
    const csvData = [];
    csvData.push(['부서', '금형마스터', '금형마스터내역', '정산진행현황', '대금지급', '선급금', '선수금', '합계', '통화', '항목수']);

    filteredSummaries.forEach(dept => {
      dept.projects.forEach(project => {
        csvData.push([
          project.department,
          project.moldMaster,
          project.moldMasterDetails,
          project.settlementProgress,
          project.paymentStatus,
          project.advancePaymentAmount.toLocaleString(),
          project.prepaymentAmount.toLocaleString(),
          project.totalAmount.toLocaleString(),
          project.currency,
          project.itemCount.toString()
        ]);
      });
      
      // 부서 소계 행 추가
      csvData.push([
        `${dept.department} 소계`,
        '',
        '',
        '',
        '',
        dept.totalAdvancePayment.toLocaleString(),
        dept.totalPrepayment.toLocaleString(),
        dept.totalAmount.toLocaleString(),
        '',
        dept.itemCount.toString()
      ]);
      csvData.push(['']); // 빈 행
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `프로젝트별_분석_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));
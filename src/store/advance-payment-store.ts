import { create } from 'zustand';
import { AdvancePayment, AdvancePaymentFilters, AdvancePaymentStats } from '@/types/advance-payment';
import { CSVParser } from '@/utils/csv-parser';

interface AdvancePaymentStore {
  // 데이터 상태
  payments: AdvancePayment[];
  filteredPayments: AdvancePayment[];
  stats: AdvancePaymentStats;
  loading: boolean;
  error: string | null;

  // 필터 상태
  filters: AdvancePaymentFilters;
  
  // 선택된 항목
  selectedPayments: string[];
  
  // 액션
  setPayments: (payments: AdvancePayment[]) => void;
  addPayment: (payment: Omit<AdvancePayment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePayment: (id: string, payment: Partial<AdvancePayment>) => void;
  deletePayment: (id: string) => void;
  deleteMultiplePayments: (ids: string[]) => void;
  
  // 필터링 및 검색
  setFilters: (filters: Partial<AdvancePaymentFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  
  // 선택 관리
  selectPayment: (id: string) => void;
  selectAllPayments: () => void;
  clearSelection: () => void;
  
  // 통계 업데이트
  updateStats: () => void;
  
  // CSV 데이터 파싱
  parseCSVData: (csvData: string) => void;
  
  // CSV 파일 로드
  loadCSVFromFile: () => Promise<void>;
}

export const useAdvancePaymentStore = create<AdvancePaymentStore>((set, get) => ({
  // 초기 상태
  payments: [],
  filteredPayments: [],
  stats: {
    totalAmount: 0,
    totalCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    byDepartment: {},
    byStatus: {},
  },
  loading: false,
  error: null,
  filters: {},
  selectedPayments: [],

  // 데이터 설정
  setPayments: (payments) => {
    set({ payments });
    get().applyFilters();
    get().updateStats();
  },

  // 새 항목 추가
  addPayment: (paymentData) => {
    const newPayment: AdvancePayment = {
      ...paymentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const payments = [...get().payments, newPayment];
    set({ payments });
    get().applyFilters();
    get().updateStats();
  },

  // 항목 수정
  updatePayment: (id, updates) => {
    const payments = get().payments.map(payment =>
      payment.id === id
        ? { ...payment, ...updates, updatedAt: new Date().toISOString() }
        : payment
    );
    set({ payments });
    get().applyFilters();
    get().updateStats();
  },

  // 단일 항목 삭제
  deletePayment: (id) => {
    const payments = get().payments.filter(payment => payment.id !== id);
    const selectedPayments = get().selectedPayments.filter(selectedId => selectedId !== id);
    set({ payments, selectedPayments });
    get().applyFilters();
    get().updateStats();
  },

  // 다중 항목 삭제
  deleteMultiplePayments: (ids) => {
    const payments = get().payments.filter(payment => !ids.includes(payment.id));
    set({ payments, selectedPayments: [] });
    get().applyFilters();
    get().updateStats();
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
    const { payments, filters } = get();
    let filtered = [...payments];

    // 회사명 필터
    if (filters.companyName) {
      filtered = filtered.filter(payment =>
        payment.companyName.toLowerCase().includes(filters.companyName!.toLowerCase())
      );
    }

    // 부서 필터
    if (filters.department) {
      filtered = filtered.filter(payment =>
        payment.department === filters.department
      );
    }

    // 대금지급 상태 필터
    if (filters.paymentStatus) {
      filtered = filtered.filter(payment =>
        payment.paymentStatus === filters.paymentStatus
      );
    }

    // 기한경과 필터
    if (filters.overdue) {
      filtered = filtered.filter(payment =>
        payment.overdue === filters.overdue
      );
    }

    // 날짜 범위 필터
    if (filters.dateRange) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.electricDate);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    // 검색어 필터
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.companyName.toLowerCase().includes(searchTerm) ||
        payment.text.toLowerCase().includes(searchTerm) ||
        payment.contractNumber?.toLowerCase().includes(searchTerm) ||
        payment.voucherNumber.toLowerCase().includes(searchTerm)
      );
    }

    // 금액 범위 필터
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(payment => payment.localCurrencyAmount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(payment => payment.localCurrencyAmount <= filters.maxAmount!);
    }

    // 통화 필터
    if (filters.currency) {
      filtered = filtered.filter(payment => payment.currency === filters.currency);
    }

    set({ filteredPayments: filtered });
  },

  // 항목 선택
  selectPayment: (id) => {
    const selectedPayments = get().selectedPayments;
    const isSelected = selectedPayments.includes(id);
    
    set({
      selectedPayments: isSelected
        ? selectedPayments.filter(selectedId => selectedId !== id)
        : [...selectedPayments, id]
    });
  },

  // 전체 선택
  selectAllPayments: () => {
    const filteredPayments = get().filteredPayments;
    set({ selectedPayments: filteredPayments.map(payment => payment.id) });
  },

  // 선택 해제
  clearSelection: () => {
    set({ selectedPayments: [] });
  },

  // 통계 업데이트
  updateStats: () => {
    const payments = get().payments;
    
    const stats: AdvancePaymentStats = {
      totalAmount: payments.reduce((sum, payment) => sum + payment.localCurrencyAmount, 0),
      totalCount: payments.length,
      overdueAmount: payments
        .filter(payment => payment.overdue === '초과')
        .reduce((sum, payment) => sum + payment.localCurrencyAmount, 0),
      overdueCount: payments.filter(payment => payment.overdue === '초과').length,
      byDepartment: {},
      byStatus: {},
    };

    // 부서별 통계
    payments.forEach(payment => {
      if (!stats.byDepartment[payment.department]) {
        stats.byDepartment[payment.department] = { count: 0, amount: 0 };
      }
      stats.byDepartment[payment.department].count++;
      stats.byDepartment[payment.department].amount += payment.localCurrencyAmount;
    });

    // 상태별 통계
    payments.forEach(payment => {
      if (!stats.byStatus[payment.paymentStatus]) {
        stats.byStatus[payment.paymentStatus] = { count: 0, amount: 0 };
      }
      stats.byStatus[payment.paymentStatus].count++;
      stats.byStatus[payment.paymentStatus].amount += payment.localCurrencyAmount;
    });

    set({ stats });
  },

  // CSV 데이터 파싱 (샘플 데이터로 대체)
  parseCSVData: (csvData) => {
    // 빈 데이터일 경우 파일에서 로드
    if (!csvData) {
      get().loadCSVFromFile();
      return;
    }
    
    // CSV 데이터가 있을 경우 파싱
    CSVParser.parseCSVFile(csvData).then(result => {
      if (result.errors.length > 0) {
        console.warn('CSV 파싱 중 오류:', result.errors);
      }
      console.log(`CSV 파싱 완료: ${result.parsedRows}/${result.totalRows} 행 처리됨`);
      get().setPayments(result.data);
    }).catch(error => {
      console.error('CSV 파싱 실패:', error);
      set({ error: 'CSV 파싱에 실패했습니다.' });
    });
  },

  // CSV 파일 로드
  loadCSVFromFile: async () => {
    set({ loading: true, error: null });
    
    try {
      const result = await CSVParser.loadCSVFromFile('/advance-payments.csv');
      
      if (result.errors.length > 0) {
        console.warn('CSV 로드 중 오류:', result.errors);
      }
      
      console.log(`CSV 로드 완료: ${result.parsedRows}/${result.totalRows} 행 처리됨`);
      
      get().setPayments(result.data);
      set({ loading: false });
      
    } catch (error) {
      console.error('CSV 파일 로드 실패:', error);
      set({ 
        loading: false, 
        error: 'CSV 파일을 불러오는데 실패했습니다.' 
      });
      
      // 오류 발생시 샘플 데이터라도 표시
      const samplePayments: AdvancePayment[] = [
        {
          id: 'sample-1',
          electricKey: 1,
          account: '0000110630',
          glAccountName: '지급금(영업)',
          moldMaster: 'SAMPLE001',
          moldMasterDetails: 'Sample Data - CSV 로드 실패',
          contractNumber: 'SAMPLE',
          companyCode: '99999',
          companyName: '샘플 데이터',
          yearMonth: '2025-01',
          electricDate: '2025-01-01',
          currency: 'KRW',
          voucherCurrencyAmount: 1000000,
          localCurrencyAmount: 1000000,
          baseDate: '2025-12-31',
          startPlanNumber: 'SAMPLE-001',
          paymentPlanNumber: 'SAMPLE-001',
          reference: 'CSV 파일 로드 실패로 인한 샘플 데이터',
          collectionManager: '시스템',
          department: '테스트팀',
          businessPlace: '1000',
          investmentBudget: 'TEST',
          voucherNumber: 'SAMPLE001',
          text: 'CSV 파일을 정상적으로 로드할 수 없어 샘플 데이터를 표시합니다.',
          paymentStatus: '확인 필요',
          settlementProgress: '',
          notes: 'CSV 파일 로드 오류',
          overdue: '',
          overdueMonths: undefined,
          customerName: '',
          responsibleTeam: '테스트팀',
          salesManager: '시스템',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      get().setPayments(samplePayments);
    }
  },
}));
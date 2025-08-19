'use client';

import { useEffect, useState } from 'react';
import { useAdvancePaymentStore } from '@/store/advance-payment-store';
import { AdvancePayment } from '@/types/advance-payment';
import { AdvancePaymentForm } from '@/components/advance-payment-form';
import { AdvancedFilters } from '@/components/advanced-filters';
import { AutomationPanel } from '@/components/automation-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function AdvancePaymentsPage() {
  const {
    filteredPayments,
    stats,
    filters,
    selectedPayments,
    loading,
    error,
    setFilters,
    clearFilters,
    selectPayment,
    selectAllPayments,
    clearSelection,
    deletePayment,
    deleteMultiplePayments,
    parseCSVData,
    loadCSVFromFile,
  } = useAdvancePaymentStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [editingPayment, setEditingPayment] = useState<AdvancePayment | null>(null);

  useEffect(() => {
    // 초기 데이터 로드 (실제 CSV 파일)
    loadCSVFromFile();
  }, [loadCSVFromFile]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleEdit = (payment: AdvancePayment) => {
    setEditingPayment(payment);
    setShowEditDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deletePayment(id);
    }
  };

  const handleDeleteMultiple = () => {
    if (confirm(`선택된 ${selectedPayments.length}개 항목을 삭제하시겠습니까?`)) {
      deleteMultiplePayments(selectedPayments);
    }
  };

  const closeDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingPayment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">선수선급금 관리</h1>
              <p className="text-gray-600">선수금과 선급금 데이터를 관리하고 자동화할 수 있습니다.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => loadCSVFromFile()} 
                disabled={loading}
              >
                {loading ? '로드 중...' : 'CSV 다시 로드'}
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-xl font-bold text-gray-900">
              {loading ? '로딩 중...' : stats.totalCount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">총 항목 수</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
            <div className="text-sm text-gray-600">총 금액</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-red-600">{stats.overdueCount}</div>
            <div className="text-sm text-gray-600">기한 초과</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.overdueAmount)}</div>
            <div className="text-sm text-gray-600">초과 금액</div>
          </Card>
        </div>

        {/* 필터 및 액션 바 */}
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="회사명, 계약번호, 전표번호 검색..."
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters({ searchTerm: e.target.value })}
                className="w-64"
              />
              <Select
                value={filters.department || 'all'}
                onValueChange={(value) => setFilters({ department: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 부서</SelectItem>
                  <SelectItem value="PM팀">PM팀</SelectItem>
                  <SelectItem value="엔진1팀">엔진1팀</SelectItem>
                  <SelectItem value="자동차">자동차</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.paymentStatus || 'all'}
                onValueChange={(value) => setFilters({ paymentStatus: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="지급 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="지급완료">지급완료</SelectItem>
                  <SelectItem value="일시보류">일시보류</SelectItem>
                  <SelectItem value="정산완료">정산완료</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.overdue || 'all'}
                onValueChange={(value) => setFilters({ overdue: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="기한 초과" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="초과">초과</SelectItem>
                  <SelectItem value="정상">정상</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                필터 초기화
              </Button>
              <Button variant="outline" onClick={() => setShowAdvancedFilters(true)}>
                고급 필터
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                console.log('통계 보기 버튼 클릭됨');
                setShowStatsDialog(true);
              }} variant="outline">
                통계 보기
              </Button>
              <Button onClick={() => {
                console.log('자동화 분석 버튼 클릭됨');
                setShowAutomationPanel(true);
              }} variant="outline">
                자동화 분석
              </Button>
              <Button onClick={() => {
                console.log('새 항목 추가 버튼 클릭됨');
                setShowAddDialog(true);
              }}>
                새 항목 추가
              </Button>
            </div>
          </div>
        </Card>

        {/* 선택된 항목 액션 */}
        {selectedPayments.length > 0 && (
          <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedPayments.length}개 항목이 선택됨
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  선택 해제
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteMultiple}>
                  선택 항목 삭제
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 데이터 테이블 */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                      onChange={selectAllPayments}
                    />
                  </th>
                  <th className="p-3 text-left font-semibold">고유번호</th>
                  <th className="p-3 text-left font-semibold">업체명</th>
                  <th className="p-3 text-left font-semibold">금형마스터</th>
                  <th className="p-3 text-left font-semibold">현지통화액</th>
                  <th className="p-3 text-left font-semibold">통화</th>
                  <th className="p-3 text-left font-semibold">전기일</th>
                  <th className="p-3 text-left font-semibold">부서</th>
                  <th className="p-3 text-left font-semibold">지급상태</th>
                  <th className="p-3 text-left font-semibold">기한초과</th>
                  <th className="p-3 text-left font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-gray-500">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-gray-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => selectPayment(payment.id)}
                        />
                      </td>
                      <td className="p-3 font-mono text-sm">{payment.id}</td>
                      <td className="p-3 font-medium">{payment.companyName}</td>
                      <td className="p-3 text-sm">{payment.moldMasterDetails}</td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(payment.localCurrencyAmount)}
                      </td>
                      <td className="p-3">{payment.currency}</td>
                      <td className="p-3">{formatDate(payment.electricDate)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {payment.department}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          payment.paymentStatus === '지급완료' 
                            ? 'bg-green-100 text-green-800'
                            : payment.paymentStatus === '일시보류'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {payment.overdue === '초과' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            {payment.overdueMonths}개월 초과
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(payment)}>
                            수정
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(payment.id)}>
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {/* 추가 다이얼로그 */}
        {showAddDialog && (
          <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeDialogs() }}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dialog-content-wrapper" style={{ backgroundColor: '#ffffff' }}>
              <AdvancePaymentForm
                onClose={closeDialogs}
                onSubmit={() => {
                  // 추가 완료 후 로직
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* 수정 다이얼로그 */}
        {showEditDialog && editingPayment && (
          <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) closeDialogs() }}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dialog-content-wrapper" style={{ backgroundColor: '#ffffff' }}>
              <AdvancePaymentForm
                payment={editingPayment}
                onClose={closeDialogs}
                onSubmit={() => {
                  // 수정 완료 후 로직
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* 고급 필터 다이얼로그 */}
        {showAdvancedFilters && (
          <AdvancedFilters
            open={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
          />
        )}

        {/* 자동화 패널 다이얼로그 */}
        {showAutomationPanel && (
          <AutomationPanel
            open={showAutomationPanel}
            onClose={() => setShowAutomationPanel(false)}
          />
        )}

        {/* 통계 다이얼로그 */}
        {showStatsDialog && (
          <Dialog open={showStatsDialog} onOpenChange={(open) => { if (!open) setShowStatsDialog(false) }}>
            <DialogContent className="max-w-2xl dialog-content-wrapper" style={{ backgroundColor: '#ffffff' }}>
              <div className="p-6" style={{ backgroundColor: '#ffffff' }}>
                <h2 className="text-xl font-bold mb-4">상세 통계</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">부서별 통계</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.byDepartment).map(([dept, data]) => (
                        <div key={dept} className="flex justify-between">
                          <span>{dept}</span>
                          <span>{data.count}건 / {formatCurrency(data.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">상태별 통계</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.byStatus).map(([status, data]) => (
                        <div key={status} className="flex justify-between">
                          <span>{status}</span>
                          <span>{data.count}건 / {formatCurrency(data.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
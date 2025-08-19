'use client';

import { useEffect, useState } from 'react';
import { useManagerAnalysisStore } from '@/store/manager-analysis-store';
import { useAdvancePaymentStore } from '@/store/advance-payment-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';

export default function ManagerAnalysisPage() {
  const {
    departmentSummaries,
    filteredSummaries,
    stats,
    filters,
    loading,
    error,
    generateAnalysis,
    setFilters,
    clearFilters,
    exportToCSV,
  } = useManagerAnalysisStore();
  
  // advance-payment-store에서 CSV 로드 함수 가져오기
  const { loadCSVFromFile, payments } = useAdvancePaymentStore();

  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    // CSV 데이터가 없으면 먼저 로드
    if (payments.length === 0) {
      loadCSVFromFile().then(() => {
        // CSV 로드 후 분석 데이터 생성
        generateAnalysis();
      });
    } else {
      // 이미 데이터가 있으면 바로 분석
      generateAnalysis();
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const toggleDepartmentExpansion = (department: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(department)) {
      newExpanded.delete(department);
    } else {
      newExpanded.add(department);
    }
    setExpandedDepartments(newExpanded);
  };

  const expandAll = () => {
    setExpandedDepartments(new Set(filteredSummaries.map(dept => dept.department)));
  };

  const collapseAll = () => {
    setExpandedDepartments(new Set());
  };

  // 부서 목록 가져오기
  const departmentList = [...new Set(departmentSummaries.map(dept => dept.department))];
  
  // 모든 담당자 목록 가져오기
  const managerList = [...new Set(departmentSummaries.flatMap(dept => 
    dept.managers.map(m => m.collectionManager)
  ))].sort();

  // 정산 진행 상황 목록
  const settlementStatusList = [...new Set(departmentSummaries.flatMap(dept => 
    dept.managers.map(m => m.settlementProgress)
  ))].sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">담당자별 분석</h1>
              <p className="text-gray-600">부서별 담당자의 선수금/선급금 현황을 분석합니다.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateAnalysis} disabled={loading}>
                {loading ? '분석 중...' : '분석 새로고침'}
              </Button>
              <Button variant="outline" onClick={exportToCSV} disabled={filteredSummaries.length === 0}>
                CSV 내보내기
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-xl font-bold text-gray-900">
              {loading ? '로딩 중...' : stats.totalDepartments}
            </div>
            <div className="text-sm text-gray-600">총 부서 수</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-gray-900">
              {loading ? '로딩 중...' : stats.totalManagers}
            </div>
            <div className="text-sm text-gray-600">총 담당자 수</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(stats.totalAdvancePayment)}
            </div>
            <div className="text-sm text-gray-600">총 선급금</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(stats.totalPrepayment)}
            </div>
            <div className="text-sm text-gray-600">총 선수금</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(stats.grandTotal)}
            </div>
            <div className="text-sm text-gray-600">총 합계</div>
          </Card>
        </div>

        {/* 필터 및 액션 바 */}
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="담당자명 검색..."
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
                  {departmentList.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.collectionManager || 'all'}
                onValueChange={(value) => setFilters({ collectionManager: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 담당자</SelectItem>
                  {managerList.map(manager => (
                    <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.settlementProgress || 'all'}
                onValueChange={(value) => setFilters({ settlementProgress: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="정산 상황" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상황</SelectItem>
                  {settlementStatusList.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                필터 초기화
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                모두 펼치기
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                모두 접기
              </Button>
            </div>
          </div>
        </Card>

        {/* 부서별 분석 결과 */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">분석 데이터를 생성하고 있습니다...</div>
            </Card>
          ) : filteredSummaries.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">분석할 데이터가 없습니다.</div>
            </Card>
          ) : (
            filteredSummaries.map((dept) => (
              <Card key={dept.department} className="overflow-hidden">
                <div 
                  className="p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleDepartmentExpansion(dept.department)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">
                        {expandedDepartments.has(dept.department) ? '▼' : '▶'} {dept.department}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({dept.managerCount}명 담당자, {dept.itemCount}건)
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-green-600 font-medium">
                        선급금: {formatCurrency(dept.totalAdvancePayment)}
                      </div>
                      <div className="text-blue-600 font-medium">
                        선수금: {formatCurrency(dept.totalPrepayment)}
                      </div>
                      <div className="text-purple-600 font-bold">
                        합계: {formatCurrency(dept.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>

                {expandedDepartments.has(dept.department) && (
                  <div className="overflow-x-auto">
                    <Table>
                      <thead>
                        <tr className="border-b bg-white">
                          <th className="p-3 text-left font-semibold text-sm">부서</th>
                          <th className="p-3 text-left font-semibold text-sm">회수담당</th>
                          <th className="p-3 text-left font-semibold text-sm">정산진행현황</th>
                          <th className="p-3 text-right font-semibold text-sm">선급금</th>
                          <th className="p-3 text-right font-semibold text-sm">선수금</th>
                          <th className="p-3 text-right font-semibold text-sm">합계</th>
                          <th className="p-3 text-center font-semibold text-sm">항목수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dept.managers.map((manager, index) => (
                          <tr key={`${manager.collectionManager}-${index}`} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{manager.department}</td>
                            <td className="p-3 font-medium text-sm">{manager.collectionManager}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                manager.settlementProgress === '정산완료' 
                                  ? 'bg-green-100 text-green-800'
                                  : manager.settlementProgress === '정산가능'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {manager.settlementProgress}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-green-600">
                              {manager.advancePaymentAmount !== 0 ? formatCurrency(manager.advancePaymentAmount) : '-'}
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-blue-600">
                              {manager.prepaymentAmount !== 0 ? formatCurrency(manager.prepaymentAmount) : '-'}
                            </td>
                            <td className="p-3 text-right font-mono text-sm font-bold">
                              {formatCurrency(manager.totalAmount)}
                            </td>
                            <td className="p-3 text-center text-sm">{manager.itemCount}</td>
                          </tr>
                        ))}
                        {/* 부서 소계 행 */}
                        <tr className="bg-gray-100 font-semibold">
                          <td colSpan={3} className="p-3 text-right">
                            <strong>{dept.department} 소계:</strong>
                          </td>
                          <td className="p-3 text-right font-mono text-green-600">
                            {formatCurrency(dept.totalAdvancePayment)}
                          </td>
                          <td className="p-3 text-right font-mono text-blue-600">
                            {formatCurrency(dept.totalPrepayment)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {formatCurrency(dept.totalAmount)}
                          </td>
                          <td className="p-3 text-center">{dept.itemCount}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* 요약 정보 */}
        {!loading && filteredSummaries.length > 0 && (
          <Card className="mt-6 p-4">
            <h3 className="text-lg font-semibold mb-4">분석 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>최대 금액 부서:</strong> {stats.topDepartmentByAmount}</p>
                <p><strong>최대 금액 담당자:</strong> {stats.topManagerByAmount}</p>
              </div>
              <div>
                <p><strong>필터링된 부서 수:</strong> {filteredSummaries.length}/{stats.totalDepartments}</p>
                <p><strong>필터링된 담당자 수:</strong> {filteredSummaries.reduce((sum, dept) => sum + dept.managerCount, 0)}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
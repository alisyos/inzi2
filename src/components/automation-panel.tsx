'use client';

import { useState, useEffect } from 'react';
import { useAdvancePaymentStore } from '@/store/advance-payment-store';
import { AdvancePayment } from '@/types/advance-payment';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';

interface DuplicateGroup {
  key: string;
  payments: AdvancePayment[];
  similarity: number;
}

interface AutomationResults {
  duplicates: DuplicateGroup[];
  overdue: AdvancePayment[];
  highAmount: AdvancePayment[];
  recommendations: {
    id: string;
    payment: AdvancePayment;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

interface AutomationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AutomationPanel({ open, onClose }: AutomationPanelProps) {
  const { payments, updatePayment } = useAdvancePaymentStore();
  const [results, setResults] = useState<AutomationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'duplicates' | 'overdue' | 'recommendations'>('duplicates');

  const runAnalysis = async () => {
    setLoading(true);
    
    // 중복 데이터 탐지
    const duplicates = findDuplicates(payments);
    
    // 기한 초과 항목
    const overdue = payments.filter(p => p.overdue === '초과');
    
    // 고액 항목
    const highAmount = payments.filter(p => Math.abs(p.localCurrencyAmount) > 50000000);
    
    // 자동화 권장사항
    const recommendations = generateRecommendations(payments);
    
    setResults({
      duplicates,
      overdue,
      highAmount,
      recommendations,
    });
    
    setLoading(false);
  };

  const findDuplicates = (payments: AdvancePayment[]): DuplicateGroup[] => {
    const groups: Map<string, AdvancePayment[]> = new Map();
    
    payments.forEach(payment => {
      // 회사명 + 금형마스터로 그룹화
      const key = `${payment.companyName}_${payment.moldMaster}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(payment);
    });
    
    // 2개 이상의 항목이 있는 그룹만 중복으로 간주
    return Array.from(groups.entries())
      .filter(([, payments]) => payments.length > 1)
      .map(([key, payments]) => ({
        key,
        payments,
        similarity: calculateSimilarity(payments),
      }))
      .sort((a, b) => b.similarity - a.similarity);
  };

  const calculateSimilarity = (payments: AdvancePayment[]): number => {
    // 간단한 유사도 계산 (실제로는 더 복잡한 알고리즘 사용)
    const first = payments[0];
    let similaritySum = 0;
    
    payments.slice(1).forEach(payment => {
      let score = 0;
      if (payment.companyName === first.companyName) score += 30;
      if (payment.moldMaster === first.moldMaster) score += 25;
      if (payment.department === first.department) score += 15;
      if (payment.currency === first.currency) score += 10;
      if (Math.abs(payment.localCurrencyAmount - first.localCurrencyAmount) < 100000) score += 20;
      
      similaritySum += score;
    });
    
    return Math.round(similaritySum / (payments.length - 1));
  };

  const generateRecommendations = (payments: AdvancePayment[]) => {
    const recommendations: AutomationResults['recommendations'] = [];
    
    payments.forEach(payment => {
      // 기한 초과 경고
      if (payment.overdue === '초과' && payment.overdueMonths && payment.overdueMonths > 6) {
        recommendations.push({
          id: `overdue_${payment.id}`,
          payment,
          suggestion: `6개월 이상 기한 초과. 즉시 회수 조치 필요`,
          priority: 'high',
        });
      }
      
      // 고액 거래 검토
      if (Math.abs(payment.localCurrencyAmount) > 100000000) {
        recommendations.push({
          id: `high_amount_${payment.id}`,
          payment,
          suggestion: `고액 거래 (1억원 이상). 승인 검토 필요`,
          priority: 'high',
        });
      }
      
      // 대기 상태 오래된 항목
      if (payment.paymentStatus === '지급대기') {
        const daysSinceElectric = Math.floor(
          (new Date().getTime() - new Date(payment.electricDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceElectric > 30) {
          recommendations.push({
            id: `waiting_${payment.id}`,
            payment,
            suggestion: `30일 이상 지급 대기 상태. 처리 상태 확인 필요`,
            priority: 'medium',
          });
        }
      }
      
      // 정산 미완료
      if (payment.paymentStatus === '지급완료' && !payment.settlementProgress) {
        recommendations.push({
          id: `settlement_${payment.id}`,
          payment,
          suggestion: `지급 완료되었으나 정산 진행 상황 미입력`,
          priority: 'low',
        });
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const mergeDuplicates = (group: DuplicateGroup) => {
    if (group.payments.length < 2) return;
    
    const [primary, ...duplicates] = group.payments;
    
    // 첫 번째 항목을 기본으로 하고, 중요한 정보들을 병합
    const mergedNotes = [primary.notes, ...duplicates.map(d => d.notes)]
      .filter(Boolean)
      .join(' | ');
    
    updatePayment(primary.id, {
      notes: mergedNotes,
      text: `${primary.text} [중복 병합: ${duplicates.length}건]`,
    });
    
    // 중복 항목들 삭제는 사용자가 확인 후 수동으로 진행
    alert(`${duplicates.length}개의 중복 항목이 주 항목(${primary.id})에 병합 표시되었습니다. 중복 항목은 수동으로 확인 후 삭제해주세요.`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
    }
  };

  useEffect(() => {
    if (open && !results) {
      runAnalysis();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <Card className="p-6 max-w-6xl mx-auto max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">데이터 매칭 및 자동화 분석</h2>
          <Button onClick={runAnalysis} disabled={loading}>
            {loading ? '분석 중...' : '재분석'}
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'duplicates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('duplicates')}
          >
            중복 데이터 ({results?.duplicates.length || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'overdue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overdue')}
          >
            기한 초과 ({results?.overdue.length || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('recommendations')}
          >
            권장사항 ({results?.recommendations.length || 0})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">데이터를 분석하고 있습니다...</p>
          </div>
        ) : results ? (
          <div>
            {/* 중복 데이터 탭 */}
            {activeTab === 'duplicates' && (
              <div className="space-y-4">
                {results.duplicates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">중복 데이터가 발견되지 않았습니다.</p>
                ) : (
                  results.duplicates.map((group, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="font-semibold">중복 그룹 #{index + 1}</h3>
                          <p className="text-sm text-gray-600">
                            유사도: {group.similarity}% | {group.payments.length}개 항목
                          </p>
                        </div>
                        <Button size="sm" onClick={() => mergeDuplicates(group)}>
                          병합 처리
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">ID</th>
                              <th className="text-left p-2">업체명</th>
                              <th className="text-left p-2">금형마스터</th>
                              <th className="text-left p-2">금액</th>
                              <th className="text-left p-2">전기일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.payments.map((payment, i) => (
                              <tr key={payment.id} className={i === 0 ? 'bg-blue-50' : ''}>
                                <td className="p-2 font-mono text-sm">{payment.id}</td>
                                <td className="p-2">{payment.companyName}</td>
                                <td className="p-2 text-sm">{payment.moldMaster}</td>
                                <td className="p-2 text-right">{formatCurrency(payment.localCurrencyAmount)}</td>
                                <td className="p-2">{new Date(payment.electricDate).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* 기한 초과 탭 */}
            {activeTab === 'overdue' && (
              <div>
                {results.overdue.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">기한 초과 항목이 없습니다.</p>
                ) : (
                  <Card>
                    <div className="overflow-x-auto">
                      <Table>
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3">ID</th>
                            <th className="text-left p-3">업체명</th>
                            <th className="text-left p-3">금액</th>
                            <th className="text-left p-3">초과기간</th>
                            <th className="text-left p-3">담당부서</th>
                            <th className="text-left p-3">액션</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.overdue.map((payment) => (
                            <tr key={payment.id} className="border-b">
                              <td className="p-3 font-mono text-sm">{payment.id}</td>
                              <td className="p-3">{payment.companyName}</td>
                              <td className="p-3 text-right">{formatCurrency(payment.localCurrencyAmount)}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  {payment.overdueMonths}개월 초과
                                </span>
                              </td>
                              <td className="p-3">{payment.department}</td>
                              <td className="p-3">
                                <Button size="sm" variant="outline">
                                  알림 발송
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* 권장사항 탭 */}
            {activeTab === 'recommendations' && (
              <div className="space-y-3">
                {results.recommendations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">특별한 권장사항이 없습니다.</p>
                ) : (
                  results.recommendations.map((rec) => (
                    <Card key={rec.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(rec.priority)}`}>
                              {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '보통' : '낮음'}
                            </span>
                            <span className="font-mono text-sm text-gray-600">{rec.payment.id}</span>
                            <span className="text-sm text-gray-600">{rec.payment.companyName}</span>
                          </div>
                          <p className="text-gray-800">{rec.suggestion}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          처리
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </Dialog>
  );
}
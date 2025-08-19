'use client';

import { useEffect, useState } from 'react';
import { useAdvancePaymentStore } from '@/store/advance-payment-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const { 
    payments, 
    stats, 
    loading, 
    error, 
    loadCSVFromFile 
  } = useAdvancePaymentStore();

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // CSV 데이터 로드
    if (payments.length === 0) {
      loadCSVFromFile();
    }
  }, []);

  useEffect(() => {
    // 최근 활동 데이터 생성 (최근 추가된 항목들)
    if (payments.length > 0) {
      const recent = payments
        .sort((a, b) => new Date(b.electricDate).getTime() - new Date(a.electricDate).getTime())
        .slice(0, 5);
      setRecentActivities(recent);
    }
  }, [payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 부서별 통계 계산
  const departmentStats = Object.entries(stats.byDepartment || {})
    .sort(([,a], [,b]) => b.amount - a.amount)
    .slice(0, 5);

  // 상태별 통계 계산
  const statusStats = Object.entries(stats.byStatus || {})
    .sort(([,a], [,b]) => b.amount - a.amount);

  // 기한 초과 항목
  const overdueItems = payments.filter(p => p.overdue === '초과').length;
  const overdueAmount = payments
    .filter(p => p.overdue === '초과')
    .reduce((sum, p) => sum + p.localCurrencyAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">선수선급금 관리 대시보드</h1>
              <p className="text-gray-600">전체 현황을 한눈에 확인하고 빠르게 관리할 수 있습니다.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCSVFromFile} disabled={loading}>
                {loading ? '로딩 중...' : '데이터 새로고침'}
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '로딩 중...' : stats.totalCount?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">총 항목 수</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalAmount || 0)}
            </div>
            <div className="text-sm text-gray-600">총 금액</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {overdueItems}
            </div>
            <div className="text-sm text-gray-600">기한 초과 건수</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(overdueAmount)}
            </div>
            <div className="text-sm text-gray-600">초과 금액</div>
          </Card>
        </div>

        {/* 빠른 접근 메뉴 */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">빠른 접근</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/advance-payments" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">선수선급금 관리</div>
              <div className="text-sm text-gray-600">전체 데이터 조회 및 관리</div>
            </Link>
            <Link href="/project-analysis" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">프로젝트별 분석</div>
              <div className="text-sm text-gray-600">프로젝트 단위 분석 리포트</div>
            </Link>
            <Link href="/manager-analysis" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">담당자별 분석</div>
              <div className="text-sm text-gray-600">담당자 단위 분석 리포트</div>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 부서별 현황 */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">부서별 현황 (상위 5개)</h2>
            {departmentStats.length > 0 ? (
              <div className="space-y-3">
                {departmentStats.map(([dept, data]) => (
                  <div key={dept} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{dept}</div>
                      <div className="text-sm text-gray-600">{data.count}건</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(data.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">데이터가 없습니다</div>
            )}
          </Card>

          {/* 상태별 현황 */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">지급 상태별 현황</h2>
            {statusStats.length > 0 ? (
              <div className="space-y-3">
                {statusStats.map(([status, data]) => (
                  <div key={status} className="flex justify-between items-center">
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        status === '지급완료' 
                          ? 'bg-green-100 text-green-800'
                          : status === '일시보류'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">{data.count}건</span>
                    </div>
                    <div className="font-bold">{formatCurrency(data.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">데이터가 없습니다</div>
            )}
          </Card>
        </div>

        {/* 최근 활동 */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">최근 전기일 기준 항목</h2>
          {recentActivities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">전기일</th>
                    <th className="text-left p-2">업체명</th>
                    <th className="text-left p-2">부서</th>
                    <th className="text-right p-2">금액</th>
                    <th className="text-left p-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatDate(activity.electricDate)}</td>
                      <td className="p-2 font-medium">{activity.companyName}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {activity.department}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono">{formatCurrency(activity.localCurrencyAmount)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.paymentStatus === '지급완료' 
                            ? 'bg-green-100 text-green-800'
                            : activity.paymentStatus === '일시보류'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">데이터가 없습니다</div>
          )}
          <div className="mt-4 text-center">
            <Link href="/advance-payments" className="text-blue-600 hover:text-blue-800 text-sm">
              전체 데이터 보기 →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
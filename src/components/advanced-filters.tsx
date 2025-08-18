'use client';

import { useState } from 'react';
import { useAdvancePaymentStore } from '@/store/advance-payment-store';
import { AdvancePaymentFilters } from '@/types/advance-payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';

interface AdvancedFiltersProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedFilters({ open, onClose }: AdvancedFiltersProps) {
  const { filters, setFilters, clearFilters, filteredPayments } = useAdvancePaymentStore();
  
  const [localFilters, setLocalFilters] = useState<AdvancePaymentFilters>(filters);

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
    clearFilters();
  };

  const updateLocalFilter = (key: keyof AdvancePaymentFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6">고급 필터</h2>
        
        <div className="space-y-6">
          {/* 기본 검색 */}
          <div>
            <label className="block text-sm font-medium mb-2">통합 검색</label>
            <Input
              placeholder="회사명, 계약번호, 전표번호, 텍스트 내용 검색..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => updateLocalFilter('searchTerm', e.target.value)}
            />
          </div>

          {/* 회사 및 부서 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">회사명</label>
              <Input
                placeholder="회사명으로 필터링"
                value={localFilters.companyName || ''}
                onChange={(e) => updateLocalFilter('companyName', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">부서</label>
              <Select
                value={localFilters.department || 'all'}
                onValueChange={(value) => updateLocalFilter('department', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 부서</SelectItem>
                  <SelectItem value="PM팀">PM팀</SelectItem>
                  <SelectItem value="엔진1팀">엔진1팀</SelectItem>
                  <SelectItem value="자동차">자동차</SelectItem>
                  <SelectItem value="전자부품">전자부품</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 상태 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">지급 상태</label>
              <Select
                value={localFilters.paymentStatus || 'all'}
                onValueChange={(value) => updateLocalFilter('paymentStatus', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지급 상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="지급대기">지급대기</SelectItem>
                  <SelectItem value="지급완료">지급완료</SelectItem>
                  <SelectItem value="일시보류">일시보류</SelectItem>
                  <SelectItem value="정산완료">정산완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">기한 초과</label>
              <Select
                value={localFilters.overdue || 'all'}
                onValueChange={(value) => updateLocalFilter('overdue', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기한 초과 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="초과">초과만</SelectItem>
                  <SelectItem value="정상">정상만</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 날짜 범위 필터 */}
          <div>
            <label className="block text-sm font-medium mb-2">전기일 범위</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  placeholder="시작일"
                  value={localFilters.dateRange?.start || ''}
                  onChange={(e) => updateLocalFilter('dateRange', {
                    ...localFilters.dateRange,
                    start: e.target.value
                  })}
                />
              </div>
              <div>
                <Input
                  type="date"
                  placeholder="종료일"
                  value={localFilters.dateRange?.end || ''}
                  onChange={(e) => updateLocalFilter('dateRange', {
                    ...localFilters.dateRange,
                    end: e.target.value
                  })}
                />
              </div>
            </div>
          </div>

          {/* 금액 범위 필터 */}
          <div>
            <label className="block text-sm font-medium mb-2">금액 범위 (현지통화액)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  placeholder="최소 금액"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => updateLocalFilter('minAmount', Number(e.target.value))}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="최대 금액"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => updateLocalFilter('maxAmount', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* 통화 필터 */}
          <div>
            <label className="block text-sm font-medium mb-2">통화</label>
            <Select
              value={localFilters.currency || 'all'}
              onValueChange={(value) => updateLocalFilter('currency', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="통화 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 통화</SelectItem>
                <SelectItem value="KRW">KRW</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 필터 결과 미리보기 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              현재 필터 조건으로 <strong>{filteredPayments.length}건</strong>의 항목이 조회됩니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-6">
          <Button onClick={handleApply} className="flex-1">
            필터 적용
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1">
            초기화
          </Button>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </div>
      </Card>
    </Dialog>
  );
}
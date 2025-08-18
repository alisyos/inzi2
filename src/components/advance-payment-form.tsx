'use client';

import { useState } from 'react';
import { useAdvancePaymentStore } from '@/store/advance-payment-store';
import { AdvancePayment } from '@/types/advance-payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface AdvancePaymentFormProps {
  payment?: AdvancePayment;
  onClose: () => void;
  onSubmit: () => void;
}

export function AdvancePaymentForm({ payment, onClose, onSubmit }: AdvancePaymentFormProps) {
  const { addPayment, updatePayment } = useAdvancePaymentStore();
  
  const [formData, setFormData] = useState({
    electricKey: payment?.electricKey || 1,
    account: payment?.account || '',
    glAccountName: payment?.glAccountName || '',
    moldMaster: payment?.moldMaster || '',
    moldMasterDetails: payment?.moldMasterDetails || '',
    contractNumber: payment?.contractNumber || '',
    companyCode: payment?.companyCode || '',
    companyName: payment?.companyName || '',
    yearMonth: payment?.yearMonth || '',
    electricDate: payment?.electricDate || '',
    currency: payment?.currency || 'KRW',
    voucherCurrencyAmount: payment?.voucherCurrencyAmount || 0,
    localCurrencyAmount: payment?.localCurrencyAmount || 0,
    baseDate: payment?.baseDate || '',
    startPlanNumber: payment?.startPlanNumber || '',
    paymentPlanNumber: payment?.paymentPlanNumber || '',
    reference: payment?.reference || '',
    collectionManager: payment?.collectionManager || '',
    department: payment?.department || 'none',
    businessPlace: payment?.businessPlace || '',
    investmentBudget: payment?.investmentBudget || '',
    voucherNumber: payment?.voucherNumber || '',
    text: payment?.text || '',
    paymentStatus: payment?.paymentStatus || '지급대기',
    settlementProgress: payment?.settlementProgress || '',
    notes: payment?.notes || '',
    overdue: payment?.overdue || 'normal',
    overdueMonths: payment?.overdueMonths || undefined,
    customerName: payment?.customerName || '',
    responsibleTeam: payment?.responsibleTeam || '',
    salesManager: payment?.salesManager || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = '업체명은 필수입니다.';
    }
    if (!formData.moldMaster.trim()) {
      newErrors.moldMaster = '금형마스터는 필수입니다.';
    }
    if (!formData.electricDate) {
      newErrors.electricDate = '전기일은 필수입니다.';
    }
    if (!formData.department.trim() || formData.department === 'none') {
      newErrors.department = '부서는 필수입니다.';
    }
    if (!formData.voucherNumber.trim()) {
      newErrors.voucherNumber = '전표번호는 필수입니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 데이터 정리
    const cleanedData = {
      ...formData,
      department: formData.department === 'none' ? '' : formData.department,
      overdue: formData.overdue === 'normal' ? '' : formData.overdue,
    };

    if (payment) {
      // 수정 모드
      updatePayment(payment.id, cleanedData);
    } else {
      // 추가 모드
      addPayment(cleanedData);
    }

    onSubmit();
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {payment ? '선수선급금 수정' : '선수선급금 추가'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">업체명 *</label>
            <Input
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="업체명 입력"
              className={errors.companyName ? 'border-red-500' : ''}
            />
            {errors.companyName && (
              <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">업체코드</label>
            <Input
              value={formData.companyCode}
              onChange={(e) => handleInputChange('companyCode', e.target.value)}
              placeholder="업체코드 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">금형마스터 *</label>
            <Input
              value={formData.moldMaster}
              onChange={(e) => handleInputChange('moldMaster', e.target.value)}
              placeholder="예: P000000023"
              className={errors.moldMaster ? 'border-red-500' : ''}
            />
            {errors.moldMaster && (
              <p className="text-red-500 text-xs mt-1">{errors.moldMaster}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">계약번호</label>
            <Input
              value={formData.contractNumber}
              onChange={(e) => handleInputChange('contractNumber', e.target.value)}
              placeholder="계약번호 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">전기일 *</label>
            <Input
              type="date"
              value={formData.electricDate}
              onChange={(e) => handleInputChange('electricDate', e.target.value)}
              className={errors.electricDate ? 'border-red-500' : ''}
            />
            {errors.electricDate && (
              <p className="text-red-500 text-xs mt-1">{errors.electricDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">기준일</label>
            <Input
              type="date"
              value={formData.baseDate}
              onChange={(e) => handleInputChange('baseDate', e.target.value)}
            />
          </div>
        </div>

        {/* 금액 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">통화</label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleInputChange('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="통화 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KRW">KRW</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">전표통화액</label>
            <Input
              type="number"
              value={formData.voucherCurrencyAmount}
              onChange={(e) => handleInputChange('voucherCurrencyAmount', Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">현지통화액</label>
            <Input
              type="number"
              value={formData.localCurrencyAmount}
              onChange={(e) => handleInputChange('localCurrencyAmount', Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>

        {/* 담당 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">부서 *</label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleInputChange('department', value)}
            >
              <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">부서 선택</SelectItem>
                <SelectItem value="PM팀">PM팀</SelectItem>
                <SelectItem value="엔진1팀">엔진1팀</SelectItem>
                <SelectItem value="자동차">자동차</SelectItem>
                <SelectItem value="전자부품">전자부품</SelectItem>
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-red-500 text-xs mt-1">{errors.department}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">회수담당</label>
            <Input
              value={formData.collectionManager}
              onChange={(e) => handleInputChange('collectionManager', e.target.value)}
              placeholder="담당자명 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">영업담당</label>
            <Input
              value={formData.salesManager}
              onChange={(e) => handleInputChange('salesManager', e.target.value)}
              placeholder="영업담당자명 입력"
            />
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">지급상태</label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value) => handleInputChange('paymentStatus', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="지급대기">지급대기</SelectItem>
                <SelectItem value="지급완료">지급완료</SelectItem>
                <SelectItem value="일시보류">일시보류</SelectItem>
                <SelectItem value="정산완료">정산완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">기한초과</label>
            <Select
              value={formData.overdue}
              onValueChange={(value) => handleInputChange('overdue', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">정상</SelectItem>
                <SelectItem value="초과">초과</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">전표번호 *</label>
            <Input
              value={formData.voucherNumber}
              onChange={(e) => handleInputChange('voucherNumber', e.target.value)}
              placeholder="전표번호 입력"
              className={errors.voucherNumber ? 'border-red-500' : ''}
            />
            {errors.voucherNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.voucherNumber}</p>
            )}
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">금형마스터 내역</label>
            <Input
              value={formData.moldMasterDetails}
              onChange={(e) => handleInputChange('moldMasterDetails', e.target.value)}
              placeholder="금형마스터 상세 내용"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">텍스트</label>
            <Textarea
              value={formData.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              placeholder="상세 설명 입력"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비고</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="추가 메모 입력"
              rows={2}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-6">
          <Button type="submit" className="flex-1">
            {payment ? '수정' : '추가'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
        </div>
      </form>
    </Card>
  );
}
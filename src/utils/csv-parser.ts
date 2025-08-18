import { AdvancePayment } from '@/types/advance-payment';

export interface CSVParseResult {
  data: AdvancePayment[];
  errors: string[];
  totalRows: number;
  parsedRows: number;
}

export class CSVParser {
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // 이중 따옴표 처리
          current += '"';
          i++; // 다음 따옴표 건너뛰기
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static cleanValue(value: string): string {
    if (!value) return '';
    
    // 따옴표 제거
    let cleaned = value.replace(/^["']|["']$/g, '');
    
    // 불필요한 공백 제거
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  private static parseNumber(value: string): number {
    if (!value) return 0;
    
    // 쉼표, 공백, 따옴표 제거
    const cleaned = value.replace(/[",\s]/g, '');
    
    // 숫자가 아닌 문자가 있으면 0 반환
    if (!/^-?\d*\.?\d+$/.test(cleaned)) {
      return 0;
    }
    
    return parseFloat(cleaned) || 0;
  }

  private static parseDate(value: string): string {
    if (!value) return new Date().toISOString().split('T')[0];
    
    const cleaned = this.cleanValue(value);
    
    // 다양한 날짜 형식 처리
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    
    if (/^\d{4}-\d{2}$/.test(cleaned)) {
      return `${cleaned}-01`;
    }
    
    // 다른 형식도 처리 가능하도록 확장
    try {
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // 파싱 실패시 현재 날짜 반환
    }
    
    return new Date().toISOString().split('T')[0];
  }

  static async parseCSVFile(csvContent: string): Promise<CSVParseResult> {
    const lines = csvContent.split('\n');
    const data: AdvancePayment[] = [];
    const errors: string[] = [];
    let totalRows = 0;
    let parsedRows = 0;

    // 헤더 라인 건너뛰기 (첫 3줄)
    const dataLines = lines.slice(3).filter(line => line.trim().length > 0);
    totalRows = dataLines.length;

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i];
        const columns = this.parseCSVLine(line);
        
        // 최소한의 필수 데이터가 있는지 확인
        if (columns.length < 10 || !columns[0] || columns[0].trim() === '') {
          continue;
        }
        
        // 빈 행이나 헤더 행 건너뛰기
        if (columns[0].includes('고유넘버') || columns[0].includes('마감일')) {
          continue;
        }

        const payment: AdvancePayment = {
          id: this.cleanValue(columns[0]) || `auto-${i}`,
          electricKey: this.parseNumber(columns[1]) || 1,
          account: this.cleanValue(columns[2]) || '',
          glAccountName: this.cleanValue(columns[3]) || '',
          moldMaster: this.cleanValue(columns[4]) || '',
          moldMasterDetails: this.cleanValue(columns[5]) || '',
          contractNumber: this.cleanValue(columns[6]) || '',
          companyCode: this.cleanValue(columns[7]) || '',
          companyName: this.cleanValue(columns[8]) || '알 수 없음',
          yearMonth: this.cleanValue(columns[9]) || '',
          electricDate: this.parseDate(columns[10]),
          currency: this.cleanValue(columns[11]) || 'KRW',
          voucherCurrencyAmount: this.parseNumber(columns[12]),
          localCurrencyAmount: this.parseNumber(columns[13]),
          baseDate: this.parseDate(columns[14]),
          startPlanNumber: this.cleanValue(columns[15]) || '',
          paymentPlanNumber: this.cleanValue(columns[16]) || '',
          reference: this.cleanValue(columns[17]) || '',
          collectionManager: this.cleanValue(columns[18]) || '',
          department: this.cleanValue(columns[19]) || '미지정',
          businessPlace: this.cleanValue(columns[20]) || '',
          investmentBudget: this.cleanValue(columns[21]) || '',
          voucherNumber: this.cleanValue(columns[22]) || `V-${i}`,
          text: this.cleanValue(columns[23]) || '',
          paymentStatus: this.cleanValue(columns[24]) || '확인 필요',
          settlementProgress: this.cleanValue(columns[25]) || '',
          notes: this.cleanValue(columns[26]) || '',
          overdue: this.cleanValue(columns[27]) || '',
          overdueMonths: columns[28] ? this.parseNumber(columns[28]) : undefined,
          customerName: this.cleanValue(columns[29]) || '',
          responsibleTeam: this.cleanValue(columns[30]) || this.cleanValue(columns[19]) || '미지정',
          salesManager: this.cleanValue(columns[31]) || this.cleanValue(columns[18]) || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        data.push(payment);
        parsedRows++;
        
      } catch (error) {
        errors.push(`라인 ${i + 4}: ${error instanceof Error ? error.message : '파싱 오류'}`);
      }
    }

    return {
      data,
      errors,
      totalRows,
      parsedRows,
    };
  }

  static async loadCSVFromFile(filePath: string): Promise<CSVParseResult> {
    try {
      // 브라우저 환경에서는 fetch 사용
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`파일을 불러올 수 없습니다: ${response.statusText}`);
      }
      
      const csvContent = await response.text();
      return this.parseCSVFile(csvContent);
      
    } catch (error) {
      return {
        data: [],
        errors: [`파일 로드 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
        totalRows: 0,
        parsedRows: 0,
      };
    }
  }
}
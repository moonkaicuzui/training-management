/**
 * Excel Export Utility
 * xlsx 라이브러리를 동적 import하여 번들 크기 최적화
 */

export interface ExportOptions {
  sheetName?: string;
  filename?: string;
}

/**
 * JSON 데이터를 Excel 파일로 내보내기
 * xlsx 라이브러리를 동적으로 로드하여 초기 번들 크기 감소
 *
 * @param data - 내보낼 데이터 배열
 * @param options - 내보내기 옵션 (시트명, 파일명)
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {}
): Promise<void> {
  const { sheetName = 'Sheet1', filename = `export_${new Date().toISOString().split('T')[0]}.xlsx` } =
    options;

  // 동적 import로 xlsx 라이브러리 로드
  const XLSX = await import('xlsx');

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(data);

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 파일 다운로드
  XLSX.writeFile(wb, filename);
}

/**
 * 여러 시트를 포함한 Excel 파일 내보내기
 *
 * @param sheets - 시트 데이터 배열 [{name: string, data: T[]}]
 * @param filename - 파일명
 */
export async function exportMultiSheetExcel<T extends Record<string, unknown>>(
  sheets: Array<{ name: string; data: T[] }>,
  filename: string = `export_${new Date().toISOString().split('T')[0]}.xlsx`
): Promise<void> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, filename);
}

/**
 * Excel 파일 읽기 (동적 import)
 *
 * @param file - File 객체
 * @returns 파싱된 JSON 데이터
 */
export async function readExcelFile<T = Record<string, unknown>>(
  file: File
): Promise<T[]> {
  const XLSX = await import('xlsx');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

import ExcelJS from "exceljs";

export type Category = "HO" | "LUAR";

export interface RecordRow {
  date: string;
  time: string;
  employeeName: string;
  breadTypeName: string;
  category: Category;
}

export interface SummaryTotals {
  dateKey: string;
  total: number;
  ho: number;
  luar: number;
  byBreadType: { name: string; count: number }[];
  byEmployee: { name: string; count: number }[];
  matrix: { employee: string; breadType: string; count: number }[];
}

export async function buildWorkbook(
  rows: RecordRow[],
  totals: SummaryTotals
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const records = workbook.addWorksheet("Records");
  records.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 10 },
    { header: "Employee Name", key: "employeeName", width: 24 },
    { header: "Bread Type", key: "breadTypeName", width: 20 },
    { header: "Category", key: "category", width: 10 },
  ];
  records.getRow(1).font = { bold: true };
  records.addRows(rows);

  const summary = workbook.addWorksheet("Summary");
  summary.addRow(["Date", totals.dateKey]);
  summary.addRow(["Total Records", totals.total]);
  summary.addRow(["HO", totals.ho]);
  summary.addRow(["LUAR", totals.luar]);
  summary.addRow([]);

  summary.addRow(["Totals by Bread Type"]);
  totals.byBreadType.forEach((row) => {
    summary.addRow([row.name, row.count]);
  });
  summary.addRow([]);

  summary.addRow(["Totals by Employee"]);
  totals.byEmployee.forEach((row) => {
    summary.addRow([row.name, row.count]);
  });

  const breadTypeNames = [
    ...new Set(totals.matrix.map((cell) => cell.breadType)),
  ].sort();
  const employeeNames = [
    ...new Set(totals.matrix.map((cell) => cell.employee)),
  ].sort();

  if (breadTypeNames.length > 0) {
    summary.addRow([]);
    summary.addRow([
      "Employee \\ Bread Type",
      ...breadTypeNames,
    ]);
    for (const employee of employeeNames) {
      summary.addRow([
        employee,
        ...breadTypeNames.map((bt) => {
          const cell = totals.matrix.find(
            (m) => m.employee === employee && m.breadType === bt
          );
          return cell ? cell.count : 0;
        }),
      ]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function excelContentType(): string {
  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

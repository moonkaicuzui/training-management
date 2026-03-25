import type { AqlTrainingRecommendation } from '@/types/aql';
import * as aqlService from '@/services/aqlService';
import * as inspectionService from '@/services/inspectionService';
import type { StoreSet, StoreGet } from './types';

export const createEnrollmentActions = (set: StoreSet, get: StoreGet) => ({
  enrollRecommendation: async (rec: AqlTrainingRecommendation, programCode: string, yearMonth: string) => {
    if (!rec.linked_employee) {
      set((state) => {
        state.error = 'No linked employee for this AQL inspector';
      });
      return;
    }

    set((state) => {
      state.isEnrolling = true;
      state.error = null;
    });

    try {
      const program = get().programs.find((p) => p.program_code === programCode);
      if (!program) throw new Error('Program not found');

      // 모든 프로그램에 대해 aql_enrollment_logs 중복 검사
      const existingLog = await aqlService.checkAqlEnrollmentDuplicate(
        rec.linked_employee.employee_id,
        programCode,
      );
      if (existingLog) {
        set((state) => {
          state.error = `${rec.linked_employee!.employee_name} already enrolled for ${programCode}`;
          state.isEnrolling = false;
        });
        return;
      }

      // INS-001의 경우 inspection_enrollments 중복도 추가 검사
      if (programCode === 'INS-001') {
        const existingInspection = await inspectionService.checkDuplicateEnrollment(
          rec.linked_employee.employee_id,
          programCode,
        );
        if (existingInspection) {
          set((state) => {
            state.error = `${rec.linked_employee!.employee_name} already has a ${existingInspection.status} enrollment for ${programCode}`;
            state.isEnrolling = false;
          });
          return;
        }
      }

      const enrollmentLog = await aqlService.createAqlEnrollmentLog({
        aql_employee_no: rec.aql_employee_no,
        aql_employee_name: rec.aql_employee_name,
        employee_id: rec.linked_employee.employee_id,
        employee_name: rec.linked_employee.employee_name,
        program_code: programCode,
        program_name: program.program_name,
        reason: rec.enrollment_reason,
        defect_types: rec.top_defects.map((d) => d.type),
        fail_rate: rec.fail_rate,
        fail_po_numbers: [],
        supervisor_no: rec.supervisor?.employee_no,
        supervisor_name: rec.supervisor?.employee_name,
        enrolled_by: 'admin',
        year_month: yearMonth,
      });

      if (programCode === 'INS-001') {
        await inspectionService.createEnrollment({
          employee_id: rec.linked_employee.employee_id,
          employee_name: rec.linked_employee.employee_name,
          program_code: 'INS-001',
          source: 'AQL_RECOMMENDATION',
          source_log_id: enrollmentLog.log_id,
          enrolled_by: 'admin',
        });
      }

      set((state) => {
        const idx = state.recommendations.findIndex(
          (r) => r.aql_employee_no === rec.aql_employee_no && r.enrollment_reason === rec.enrollment_reason
        );
        if (idx >= 0) {
          state.recommendations[idx].enrollment_status = 'ENROLLED';
        }
        state.isEnrolling = false;
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Enrollment failed';
        state.isEnrolling = false;
      });
    }
  },

  batchEnroll: async (recs: AqlTrainingRecommendation[], programCode: string, yearMonth: string) => {
    set((state) => {
      state.isEnrolling = true;
      state.error = null;
    });

    let skippedCount = 0;

    try {
      const program = get().programs.find((p) => p.program_code === programCode);
      if (!program) throw new Error('Program not found');

      for (const rec of recs) {
        if (!rec.linked_employee) continue;

        // 모든 프로그램에 대해 aql_enrollment_logs 중복 검사
        const existingLog = await aqlService.checkAqlEnrollmentDuplicate(
          rec.linked_employee.employee_id,
          programCode,
        );
        if (existingLog) {
          skippedCount++;
          set((state) => {
            const idx = state.recommendations.findIndex(
              (r) => r.aql_employee_no === rec.aql_employee_no && r.enrollment_reason === rec.enrollment_reason
            );
            if (idx >= 0) {
              state.recommendations[idx].enrollment_status = 'ENROLLED';
            }
          });
          continue;
        }

        // INS-001의 경우 inspection_enrollments 중복도 추가 검사
        if (programCode === 'INS-001') {
          const existingInspection = await inspectionService.checkDuplicateEnrollment(
            rec.linked_employee.employee_id,
            programCode,
          );
          if (existingInspection) {
            skippedCount++;
            set((state) => {
              const idx = state.recommendations.findIndex(
                (r) => r.aql_employee_no === rec.aql_employee_no && r.enrollment_reason === rec.enrollment_reason
              );
              if (idx >= 0) {
                state.recommendations[idx].enrollment_status = 'ENROLLED';
              }
            });
            continue;
          }
        }

        const enrollmentLog = await aqlService.createAqlEnrollmentLog({
          aql_employee_no: rec.aql_employee_no,
          aql_employee_name: rec.aql_employee_name,
          employee_id: rec.linked_employee.employee_id,
          employee_name: rec.linked_employee.employee_name,
          program_code: programCode,
          program_name: program.program_name,
          reason: rec.enrollment_reason,
          defect_types: rec.top_defects.map((d) => d.type),
          fail_rate: rec.fail_rate,
          fail_po_numbers: [],
          supervisor_no: rec.supervisor?.employee_no,
          supervisor_name: rec.supervisor?.employee_name,
          enrolled_by: 'admin',
          year_month: yearMonth,
        });

        if (programCode === 'INS-001') {
          await inspectionService.createEnrollment({
            employee_id: rec.linked_employee.employee_id,
            employee_name: rec.linked_employee.employee_name,
            program_code: 'INS-001',
            source: 'AQL_RECOMMENDATION',
            source_log_id: enrollmentLog.log_id,
            enrolled_by: 'admin',
          });
        }

        set((state) => {
          const idx = state.recommendations.findIndex(
            (r) => r.aql_employee_no === rec.aql_employee_no && r.enrollment_reason === rec.enrollment_reason
          );
          if (idx >= 0) {
            state.recommendations[idx].enrollment_status = 'ENROLLED';
          }
        });
      }

      set((state) => {
        state.isEnrolling = false;
        state.selectedIds = [];
        if (skippedCount > 0) {
          state.error = `${skippedCount} enrollment(s) skipped (already registered)`;
        }
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Batch enrollment failed';
        state.isEnrolling = false;
      });
    }
  },
});

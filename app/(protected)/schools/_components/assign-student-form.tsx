"use client";

import { useFormState, useFormStatus } from "react-dom";

import { assignStudentToSchoolAction } from "@/app/(protected)/schools/actions";

const initialState = undefined as any;

type AssignStudentFormProps = {
  schoolId: string;
  students: { id: string; name: string; guardianName?: string | null }[];
};

export function AssignStudentForm({ schoolId, students }: AssignStudentFormProps) {
  const [state, formAction] = useFormState(assignStudentToSchoolAction, initialState);
  const defaultStudentId = students[0]?.id ?? "";

  return (
    <form action={formAction} className="ui-card ui-card-pad space-y-4">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">학생 배정</h2>
        <p className="text-sm text-slate-700">등록된 학생을 선택해 해당 학교에 배정합니다.</p>
      </div>

      {students.length === 0 ? (
        <p className="ui-empty">
          미배정 학생이 없습니다.
        </p>
      ) : (
        <>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700" htmlFor="studentId">
              학생 선택
            </label>
            <select
              id="studentId"
              name="studentId"
              defaultValue={defaultStudentId}
              className="ui-select mt-1"
              required
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                  {student.guardianName ? ` (보호자 ${student.guardianName})` : ""}
                </option>
              ))}
            </select>
          </div>

          {state ? (
            <p className={`text-base ${state.status === "success" ? "text-green-600" : "text-red-600"}`}>{state.message}</p>
          ) : null}

          <SubmitButton />
        </>
      )}
    </form>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="ui-btn w-full"
    >
      {status.pending ? "배정 중..." : "학생 배정"}
    </button>
  );
}

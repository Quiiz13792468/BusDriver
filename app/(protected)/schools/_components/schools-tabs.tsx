"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Swal from "sweetalert2";
import clsx from "clsx";

import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from "@/components/ui/table";
import { CreateSchoolForm } from "@/app/(protected)/schools/_components/create-school-form";
import { CreateStudentForm } from "@/app/(protected)/schools/_components/create-student-form";
import { UpdateSchoolForm } from "@/app/(protected)/schools/_components/update-school-form";
import { DeleteSchoolButton } from "@/app/(protected)/schools/_components/delete-school-button";
import { assignStudentToSchoolAction, unassignStudentFromSchoolAction, updateStudentInfoAction } from "@/app/(protected)/schools/actions";
import type { SchoolRecord, StudentRecord } from "@/lib/data/types";

const initialState = undefined as any;

type SchoolsTabsProps = {
  schools: SchoolRecord[];
  students: StudentRecord[];
};

type TabId = "schools" | "students";

export function SchoolsTabs({ schools, students }: SchoolsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("schools");

  return (
    <div>

      <div className="grid grid-cols-2 gap-2 border-b border-sp-border sm:flex sm:flex-wrap">
        <TabButton active={activeTab === "schools"} onClick={() => setActiveTab("schools")}>
          학교관리
        </TabButton>
        <TabButton active={activeTab === "students"} onClick={() => setActiveTab("students")}>
          학생관리
        </TabButton>
      </div>

      <div className="ui-card ui-card-pad rounded-t-none border-t-0">
        {activeTab === "schools" ? (
          <SchoolTab schools={schools} />
        ) : (
          <StudentTab schools={schools} students={students} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-t-2xl border px-4 py-2 text-base font-semibold transition sm:w-auto ${
        active
          ? "border-sp-border border-b-transparent bg-sp-surface text-sp-text shadow-sm"
          : "border-sp-line bg-sp-raised/25 text-sp-muted hover:bg-sp-raised hover:text-sp-text"
      }`}
      aria-selected={active}
      role="tab"
    >
      {children}
    </button>
  );
}

function SchoolTab({ schools }: { schools: SchoolRecord[] }) {
  const [editSchoolId, setEditSchoolId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <CollapsibleCard
        title="학교 등록"
        description="운영에 사용할 학교 정보를 입력해 주세요"
        buttonLabel="학교 등록"
      >
        <CreateSchoolForm />
      </CollapsibleCard>

      <section className="space-y-3">
        <h2 className="mb-1 text-xl font-bold text-sp-text">등록된 학교</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {schools.map((school) => (
            <div
              key={school.id}
              className="ui-card ui-card-pad transition hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/schools/${school.id}`} className="group min-w-0 flex-1">
                  <p className="text-lg font-semibold text-sp-text group-hover:text-primary-400">{school.name}</p>
                  <p className="mt-1 text-base text-sp-muted">기본 금액 {school.defaultMonthlyFee.toLocaleString()}원</p>
                  {school.address ? <p className="mt-1 text-sm text-sp-faint">주소: {school.address}</p> : null}
                  {school.note ? <p className="mt-1 text-sm text-sp-faint">{school.note}</p> : null}
                </Link>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditSchoolId((prev) => (prev === school.id ? null : school.id))}
                    className="ui-btn-outline px-3 py-1.5 text-sm"
                  >
                    {editSchoolId === school.id ? "닫기" : "수정"}
                  </button>
                  <DeleteSchoolButton schoolId={school.id} schoolName={school.name} />
                </div>
              </div>

              {editSchoolId === school.id ? (
                <div className="mt-4 rounded-2xl border border-sp-border bg-sp-raised p-[5px]">
                  <UpdateSchoolForm
                    schoolId={school.id}
                    initial={{
                      name: school.name,
                      address: school.address,
                      defaultMonthlyFee: school.defaultMonthlyFee,
                      note: school.note
                    }}
                    onSuccess={() => setEditSchoolId(null)}
                  />
                </div>
              ) : null}
            </div>
          ))}
          {schools.length === 0 ? (
            <p className="ui-empty">
              아직 등록된 학교가 없습니다. 아래 버튼을 눌러 학교를 추가하세요.
            </p>
          ) : null}
        </div>
      </section>

    </div>
  );
}

function StudentTab({ schools, students }: { schools: SchoolRecord[]; students: StudentRecord[] }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/schools';
  const searchParams = useSearchParams();
  const unassignedCount = students.filter((student) => !student.schoolId).length;
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(searchParams?.get("unassigned") === "1");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 검색어 300ms 디바운스 — 입력 즉시 반영, 필터링만 지연
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredStudents = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return students
      .filter((student) => {
        // inactive 학생 기본 제외 (이용종료 포함)
        if (!student.isActive) return false;
        if (showUnassignedOnly && student.schoolId) return false;
        if (selectedSchoolId === "__unassigned__" && student.schoolId) return false;
        if (selectedSchoolId && selectedSchoolId !== "__unassigned__" && student.schoolId !== selectedSchoolId) return false;
        if (!term) return true;
        const name = student.name.toLowerCase();
        const guardian = (student.guardianName ?? "").toLowerCase();
        return name.includes(term) || guardian.includes(term);
      })
      .sort((a, b) => {
        const aUnassigned = !a.schoolId;
        const bUnassigned = !b.schoolId;
        if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
        return b.name.localeCompare(a.name, "ko");
      });
  }, [students, showUnassignedOnly, selectedSchoolId, debouncedSearch]);

  useEffect(() => {
    setShowUnassignedOnly(searchParams?.get("unassigned") === "1");
  }, [searchParams]);

  const handleUnassignedToggle = (checked: boolean) => {
    setShowUnassignedOnly(checked);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (checked) {
      params.set("unassigned", "1");
    } else {
      params.delete("unassigned");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-3">
      <CollapsibleCard title="학생 등록" description="학생을 먼저 등록하고 학교는 나중에 배정할 수 있습니다." buttonLabel="학생 등록">
        <CreateStudentForm schools={schools.map((school) => ({ id: school.id, name: school.name }))} />
      </CollapsibleCard>

      <section className="ui-card ui-card-pad space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="mb-1 text-xl font-bold text-sp-text">등록된 학생</h2>
            <p className="text-base text-sp-muted">학생 정보를 확인하고 학교 배정을 관리합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-sp-muted">
            <span>전체</span>
            <span className="rounded-full bg-sp-raised px-3 py-1 font-semibold">{students.length}</span>
            <span>미배정</span>
            <span className="rounded-full bg-amber-900/30 px-3 py-1 font-semibold text-amber-400">{unassignedCount}</span>
            <label className="ui-btn-outline ml-2 inline-flex items-center gap-2 px-3 py-1 text-sm">
              <input
                type="checkbox"
                checked={showUnassignedOnly}
                onChange={(event) => handleUnassignedToggle(event.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              미배정만 보기
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-semibold text-sp-muted" htmlFor="schoolFilter">
              학교 선택
            </label>
            <select
              id="schoolFilter"
              value={selectedSchoolId}
              onChange={(event) => setSelectedSchoolId(event.target.value)}
              className="ui-select mt-1"
            >
              <option value="">전체</option>
              <option value="__unassigned__">미배정</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-semibold text-sp-muted" htmlFor="studentSearch">
              학생/보호자 이름 검색
            </label>
            <input
              id="studentSearch"
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="학생 또는 보호자 이름 입력"
              className="ui-input mt-1"
            />
          </div>
        </div>
      </section>

      <StudentAssignmentTable schools={schools} students={filteredStudents} />
    </div>
  );
}

function StudentAssignmentTable({ schools, students }: { schools: SchoolRecord[]; students: StudentRecord[] }) {
  const router = useRouter();
  const schoolMap = useMemo(() => new Map(schools.map((school) => [school.id, school.name])), [schools]);

  if (students.length === 0) {
    return (
      <section className="ui-card ui-card-pad">
        <p className="text-center text-base text-sp-muted">등록된 학생이 없습니다.</p>
      </section>
    );
  }

  return (
    <>
      {/* 모바일(sm 미만): 카드형 */}
      <div className="space-y-2 sm:hidden">
        {students.map((student) => (
          <StudentAssignmentCard
            key={student.id}
            student={student}
            schools={schools}
            schoolMap={schoolMap}
            onSuccess={() => router.refresh()}
          />
        ))}
      </div>

      {/* sm 이상: 기존 테이블 */}
      <section className="ui-card overflow-hidden hidden sm:block">
        <UiTable className="table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[20%]" />
            <col className="w-[34%]" />
            <col className="w-[18%]" />
          </colgroup>
          <UiThead>
            <UiTr>
              <UiTh className="text-left">학생</UiTh>
              <UiTh className="text-left">현재 학교</UiTh>
              <UiTh className="text-left">학교 배정</UiTh>
              <UiTh className="text-left">상세/편집</UiTh>
            </UiTr>
          </UiThead>
          <UiTbody>
            {students.map((student) => (
              <StudentAssignmentRow
                key={student.id}
                student={student}
                schools={schools}
                schoolMap={schoolMap}
                onSuccess={() => router.refresh()}
              />
            ))}
          </UiTbody>
        </UiTable>
      </section>
    </>
  );
}

function StudentAssignmentCard({
  student,
  schools,
  schoolMap,
  onSuccess
}: {
  student: StudentRecord;
  schools: SchoolRecord[];
  schoolMap: Map<string, string>;
  onSuccess: () => void;
}) {
  const [currentSchoolId, setCurrentSchoolId] = useState<string>(student.schoolId ?? "");
  const [schoolId, setSchoolId] = useState<string>(student.schoolId ?? "");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updateState, updateAction] = useFormState(updateStudentInfoAction, initialState);
  const handledUpdateRef = useRef(false);
  const suspensionStatus = getSuspensionStatus(student.suspendedAt);

  useEffect(() => {
    setCurrentSchoolId(student.schoolId ?? "");
    setSchoolId(student.schoolId ?? "");
  }, [student.schoolId]);

  useEffect(() => {
    if (updateState?.status === "success" && !handledUpdateRef.current) {
      handledUpdateRef.current = true;
      setEditMode(false);
      setPanelOpen(false);
      onSuccess();
    }
  }, [updateState, onSuccess]);

  useEffect(() => {
    if (!updateState || updateState.status !== "success") {
      handledUpdateRef.current = false;
    }
  }, [updateState]);

  const handleAssign = async () => {
    if (!editing) { setEditing(true); return; }
    if (!schoolId) {
      await Swal.fire({ icon: "warning", title: "학교 선택 필요", text: "배정할 학교를 선택해주세요." });
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.append("studentId", student.id);
    fd.append("schoolId", schoolId);
    const res = await assignStudentToSchoolAction(undefined, fd);
    setPending(false);
    await Swal.fire({ icon: res.status === "success" ? "success" : "error", text: res.message });
    if (res.status === "success") { setCurrentSchoolId(schoolId); setEditing(false); onSuccess(); }
  };

  const handleUnassign = async () => {
    if (!currentSchoolId) { await Swal.fire({ icon: "info", text: "이미 미배정 상태입니다." }); return; }
    const result = await Swal.fire({
      icon: "warning", title: "학생 배정 해제", text: "학생의 학교 배정을 해제하시겠습니까?",
      showCancelButton: true, confirmButtonText: "해제", cancelButtonText: "취소", confirmButtonColor: "#e11d48"
    });
    if (!result.isConfirmed) return;
    setPending(true);
    const fd = new FormData();
    fd.append("studentId", student.id);
    fd.append("schoolId", currentSchoolId);
    const res = await unassignStudentFromSchoolAction(undefined, fd);
    setPending(false);
    await Swal.fire({ icon: res.status === "success" ? "success" : "error", text: res.message });
    if (res.status === "success") { setCurrentSchoolId(""); setSchoolId(""); setEditing(false); onSuccess(); }
  };

  return (
    <section className="ui-card ui-card-pad space-y-3">
      {/* 학생 정보 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-semibold text-sp-text">
            <span className="text-base">{student.name}</span>
            {suspensionStatus ? (
              <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold',
                suspensionStatus === '이용종료' ? 'bg-rose-900/30 text-rose-400' : 'bg-amber-900/30 text-amber-400')}>
                {suspensionStatus}
              </span>
            ) : null}
          </div>
          <div className="text-sm text-sp-faint">보호자 {student.guardianName}</div>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className="ui-btn-outline shrink-0 px-3 py-1.5 text-sm"
        >
          {panelOpen ? "닫기" : "상세/편집"}
        </button>
      </div>

      {/* 현재 학교 */}
      <div className="rounded-lg bg-sp-raised px-3 py-2 text-sm text-sp-muted">
        <span className="font-semibold text-sp-faint">현재 학교</span>
        <span className="ml-2">{currentSchoolId ? schoolMap.get(currentSchoolId) ?? "학교 정보 없음" : "미배정"}</span>
      </div>

      {/* 학교 배정 */}
      <div className="space-y-2">
        {editing ? (
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="ui-select w-full">
            <option value="">미배정</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleAssign} disabled={pending} className="ui-btn flex-1 py-2 text-sm">
            {editing ? "저장" : "배정/변경"}
          </button>
          {editing ? (
            <button type="button" onClick={() => { setEditing(false); setSchoolId(currentSchoolId); }} disabled={pending}
              className="ui-btn-outline flex-1 py-2 text-sm">취소</button>
          ) : (
            <button type="button" onClick={handleUnassign} disabled={pending}
              className="ui-btn-outline flex-1 border-rose-800 py-2 text-sm text-rose-400 hover:border-rose-600 hover:bg-rose-900/20">
              배정 해제
            </button>
          )}
        </div>
      </div>

      {/* 상세/편집 패널 */}
      {panelOpen ? (
        <div className="rounded-2xl border border-sp-border bg-sp-raised p-[10px]">
          <form action={updateAction} className="ui-control">
            <input type="hidden" name="studentId" value={student.id} />
            <input type="hidden" name="schoolId" value={student.schoolId ?? ""} />
            <input type="hidden" name="routeId" value={student.routeId ?? ""} />
            <div className="mb-2 text-sm font-semibold text-sp-muted">학생 정보</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput label="학생 이름" name="name" defaultValue={student.name} required readOnly={!editMode} />
              <FormInput label="보호자 이름" name="guardianName" defaultValue={student.guardianName} required readOnly={!editMode} />
              <FormInput label="학생 연락처" name="phone" defaultValue={student.phone ?? ""} readOnly={!editMode} />
              <FormInput label="비상 연락처" name="emergencyContact" defaultValue={student.emergencyContact ?? ""} readOnly={!editMode} />
              <FormInput label="기본 요금" name="feeAmount" type="number" min={0} defaultValue={student.feeAmount.toString()} required readOnly={!editMode} />
              <FormInput label="입금일(일)" name="depositDay" type="number" min={1} defaultValue={student.depositDay?.toString() ?? ""} readOnly={!editMode} />
              <FormInput label="탑승 지점" name="pickupPoint" defaultValue={student.pickupPoint ?? ""} readOnly={!editMode} />
              <FormInput label="이용종료일" name="suspendedAt" type="date" defaultValue={student.suspendedAt ? student.suspendedAt.slice(0, 10) : ""} readOnly={!editMode} />
            </div>
            <div className="mt-3 grid gap-3">
              <FormTextarea label="주소" name="homeAddress" defaultValue={student.homeAddress ?? ""} rows={2} readOnly={!editMode} />
              <FormTextarea label="메모" name="notes" defaultValue={student.notes ?? ""} rows={3} readOnly={!editMode} />
            </div>
            {updateState && updateState.status !== "success" ? (
              <p className="mt-3 text-sm text-rose-600">{updateState.message}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setPanelOpen(false)} className="ui-btn-outline px-4 py-2 text-sm">닫기</button>
              {editMode ? (
                <>
                  <button type="button" onClick={() => setEditMode(false)} className="ui-btn-outline px-4 py-2 text-sm">취소</button>
                  <FormSubmitButton />
                </>
              ) : (
                <button type="button" onClick={() => setEditMode(true)} className="ui-btn px-5 py-2 text-sm">수정</button>
              )}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function StudentAssignmentRow({
  student,
  schools,
  schoolMap,
  onSuccess
}: {
  student: StudentRecord;
  schools: SchoolRecord[];
  schoolMap: Map<string, string>;
  onSuccess: () => void;
}) {
  const [currentSchoolId, setCurrentSchoolId] = useState<string>(student.schoolId ?? "");
  const [schoolId, setSchoolId] = useState<string>(student.schoolId ?? "");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updateState, updateAction] = useFormState(updateStudentInfoAction, initialState);
  const handledUpdateRef = useRef(false);
  const suspensionStatus = getSuspensionStatus(student.suspendedAt);

  useEffect(() => {
    setCurrentSchoolId(student.schoolId ?? "");
    setSchoolId(student.schoolId ?? "");
  }, [student.schoolId]);

  useEffect(() => {
    if (updateState?.status === "success" && !handledUpdateRef.current) {
      handledUpdateRef.current = true;
      setEditMode(false);
      setPanelOpen(false);
      onSuccess();
    }
  }, [updateState, onSuccess]);

  useEffect(() => {
    if (!updateState || updateState.status !== "success") {
      handledUpdateRef.current = false;
    }
  }, [updateState]);

  const handleAssign = async () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    if (!schoolId) {
      await Swal.fire({ icon: "warning", title: "학교 선택 필요", text: "배정할 학교를 선택해주세요." });
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.append("studentId", student.id);
    fd.append("schoolId", schoolId);
    const res = await assignStudentToSchoolAction(undefined, fd);
    setPending(false);
    await Swal.fire({ icon: res.status === "success" ? "success" : "error", text: res.message });
    if (res.status === "success") {
      setCurrentSchoolId(schoolId);
      setEditing(false);
      onSuccess();
    }
  };

  const handleUnassign = async () => {
    if (!currentSchoolId) {
      await Swal.fire({ icon: "info", text: "이미 미배정 상태입니다." });
      return;
    }
    const result = await Swal.fire({
      icon: "warning",
      title: "학생 배정 해제",
      text: "학생의 학교 배정을 해제하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "해제",
      cancelButtonText: "취소",
      confirmButtonColor: "#e11d48"
    });
    if (!result.isConfirmed) return;
    setPending(true);
    const fd = new FormData();
    fd.append("studentId", student.id);
    fd.append("schoolId", currentSchoolId);
    const res = await unassignStudentFromSchoolAction(undefined, fd);
    setPending(false);
    await Swal.fire({ icon: res.status === "success" ? "success" : "error", text: res.message });
    if (res.status === "success") {
      setCurrentSchoolId("");
      setSchoolId("");
      setEditing(false);
      onSuccess();
    }
  };

  return (
    <>
      <UiTr className="border-b border-sp-border">
        <UiTd className="text-sp-text">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span>{student.name}</span>
            {suspensionStatus ? (
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  suspensionStatus === '이용종료' ? 'bg-rose-900/30 text-rose-400' : 'bg-amber-900/30 text-amber-400'
                )}
              >
                {suspensionStatus}
              </span>
            ) : null}
          </div>
          <div className="text-sm text-sp-faint">보호자 {student.guardianName}</div>
        </UiTd>
        <UiTd className="text-sp-muted">
          {currentSchoolId ? schoolMap.get(currentSchoolId) ?? "학교 정보 없음" : "미배정"}
        </UiTd>
        <UiTd className="text-sp-muted">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {editing ? (
              <select
                value={schoolId}
                onChange={(event) => setSchoolId(event.target.value)}
                className="ui-select sm:w-56"
              >
                <option value="">미배정</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAssign}
                disabled={pending}
                className="ui-btn px-4 py-2 text-sm"
              >
                {editing ? "저장" : "배정/변경"}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSchoolId(currentSchoolId);
                  }}
                  disabled={pending}
                  className="ui-btn-outline px-4 py-2 text-sm"
                >
                  취소
                </button>
              ) : null}
              {!editing ? (
                <button
                  type="button"
                  onClick={handleUnassign}
                  disabled={pending}
                  className="ui-btn-outline border-rose-800 px-4 py-2 text-sm text-rose-400 hover:border-rose-600 hover:bg-rose-900/20 hover:text-rose-300"
                >
                  배정 해제
                </button>
              ) : null}
            </div>
          </div>
        </UiTd>
        <UiTd className="text-sp-muted">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen((prev) => !prev)}
              className="ui-btn-outline px-4 py-2 text-sm"
            >
              {panelOpen ? "닫기" : "상세/편집"}
            </button>
          </div>
        </UiTd>
      </UiTr>
      {panelOpen ? (
        <UiTr className="border-b border-sp-border last:border-b-0">
          <UiTd colSpan={4} className="bg-sp-raised p-[10px]">
            <div className="space-y-4">
              <form action={updateAction} className="ui-control">
                <input type="hidden" name="studentId" value={student.id} />
                <input type="hidden" name="schoolId" value={student.schoolId ?? ""} />
                <input type="hidden" name="routeId" value={student.routeId ?? ""} />

                <div className="mb-2 text-sm font-semibold text-sp-muted">학생 정보</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="학생 이름" name="name" defaultValue={student.name} required readOnly={!editMode} />
                  <FormInput label="보호자 이름" name="guardianName" defaultValue={student.guardianName} required readOnly={!editMode} />
                  <FormInput label="학생 연락처" name="phone" defaultValue={student.phone ?? ""} readOnly={!editMode} />
                  <FormInput label="비상 연락처" name="emergencyContact" defaultValue={student.emergencyContact ?? ""} readOnly={!editMode} />
                  <FormInput label="기본 요금" name="feeAmount" type="number" min={0} defaultValue={student.feeAmount.toString()} required readOnly={!editMode} />
                  <FormInput label="입금일(일)" name="depositDay" type="number" min={1} defaultValue={student.depositDay?.toString() ?? ""} readOnly={!editMode} />
                  <FormInput label="탑승 지점" name="pickupPoint" defaultValue={student.pickupPoint ?? ""} readOnly={!editMode} />
                  <FormInput label="이용종료일" name="suspendedAt" type="date" defaultValue={student.suspendedAt ? student.suspendedAt.slice(0, 10) : ""} readOnly={!editMode} />
                </div>
                <div className="mt-3 grid gap-3">
                  <FormTextarea label="주소" name="homeAddress" defaultValue={student.homeAddress ?? ""} rows={2} readOnly={!editMode} />
                  <FormTextarea label="메모" name="notes" defaultValue={student.notes ?? ""} rows={3} readOnly={!editMode} />
                </div>
                {updateState && updateState.status !== "success" ? (
                  <p className="mt-3 text-sm text-rose-600">{updateState.message}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="ui-btn-outline px-4 py-2 text-sm"
                  >
                    닫기
                  </button>
                  {editMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="ui-btn-outline px-4 py-2 text-sm"
                      >
                        취소
                      </button>
                      <FormSubmitButton />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="ui-btn px-5 py-2 text-sm"
                    >
                      수정
                    </button>
                  )}
                </div>
              </form>
            </div>
          </UiTd>
        </UiTr>
      ) : null}
    </>
  );
}

function getSuspensionStatus(suspendedAt?: string | null) {
  if (!suspendedAt) return null;
  const target = new Date(suspendedAt);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return target <= today ? "이용종료" : "종료예정";
}

function FormInput({
  label,
  name,
  defaultValue,
  type = "text",
  min,
  required,
  readOnly
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  min?: number;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col text-sm font-semibold text-sp-muted">
      {label}
      <input
        name={name}
        type={type}
        min={min}
        defaultValue={defaultValue}
        required={required}
        readOnly={readOnly}
        className={`ui-input mt-1 font-normal ${readOnly ? "bg-sp-raised/50 text-sp-faint" : ""}`}
      />
    </label>
  );
}

function FormTextarea({
  label,
  name,
  defaultValue,
  rows = 3,
  readOnly
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col text-sm font-semibold text-sp-muted">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        readOnly={readOnly}
        className={`ui-input mt-1 font-normal ${readOnly ? "bg-sp-raised/50 text-sp-faint" : ""}`}
      />
    </label>
  );
}

function FormSubmitButton() {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="ui-btn px-5 py-2 text-sm"
    >
      {status.pending ? "저장 중..." : "저장"}
    </button>
  );
}

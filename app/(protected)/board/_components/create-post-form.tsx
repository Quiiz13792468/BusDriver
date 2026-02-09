'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useNavigationOverlay } from '@/components/navigation-overlay';

import { createBoardPostAction } from '@/app/(protected)/board/actions';

const initialState = undefined as { status: 'success' | 'error'; message: string } | undefined;

type SchoolOption = { id: string; name: string };

type CreatePostFormProps = {
  schools: SchoolOption[];
  title?: string;
  description?: string;
  lockParentOnly?: boolean;
  showAllOption?: boolean;
};

export function CreatePostForm({
  schools,
  title = '문의 게시판 글 등록',
  description = '궁금한 점이나 요청 사항을 남겨주세요. 관리자가 확인 후 답변드립니다.',
  lockParentOnly = false,
  showAllOption = true
}: CreatePostFormProps) {
  const [state, formAction] = useFormState(createBoardPostAction, initialState);
  const { show, hide } = useNavigationOverlay();
  const status = useFormStatus();

  useEffect(() => {
    if (status.pending) show(); else hide();
  }, [status.pending, show, hide]);

  if (schools.length === 0) {
    return (
      <div className="ui-empty">
        등록 가능한 학교가 없습니다. 먼저 학교와 학생을 등록해주세요.
      </div>
    );
  }

  return (
    <form action={formAction} className="ui-card ui-card-pad space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-700">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="title">제목</label>
          <input
            id="title"
            name="title"
            required
            className="ui-input mt-1"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="schoolId">대상 학교</label>
          <select
            id="schoolId"
            name="schoolId"
            className="ui-select mt-1"
            defaultValue={schools.length === 1 ? schools[0].id : ''}
          >
            {schools.length === 1 || !showAllOption ? null : <option value="">전체</option>}
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="content">내용</label>
        <textarea
          id="content"
          name="content"
          rows={4}
          className="ui-input mt-1"
          placeholder="문의 내용을 상세히 적어주세요"
          required
        />
      </div>

      {lockParentOnly ? (
        <input type="hidden" name="parentOnly" value="on" />
      ) : (
        <label className="flex items-center gap-2 text-base text-slate-700">
          <input type="checkbox" name="parentOnly" defaultChecked className="h-4 w-4 rounded border-slate-300" />
          학부모 전용 게시글로 등록 (필요 시 전체 전환 가능)
        </label>
      )}

      {state ? (
        <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
      ) : null}

      <div className="relative inline-block w-full">
        <button
          type="submit"
          disabled={status.pending}
          className="ui-btn w-full"
        >
          {status.pending ? '등록 중…' : '문의 게시판 등록'}
        </button>
      </div>
    </form>
  );
}

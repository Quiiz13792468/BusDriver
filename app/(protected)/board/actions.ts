"use server";

import { revalidatePath } from 'next/cache';

import { requireSession } from '@/lib/auth/session';
import { createAlert } from '@/lib/data/alert';
import { createBoardComment, createBoardPost, getBoardPostById } from '@/lib/data/board';
import { getBoardPostWithComments } from '@/lib/data/board';
import { lockBoardPost } from '@/lib/data/board';
import { createBoardNotification } from '@/lib/data/board-notifications';
import { getStudentsByParent } from '@/lib/data/student';
import { getParentProfile, getUserById } from '@/lib/data/user';
import { getSchoolById } from '@/lib/data/school';
import { boardPostSchema, commentSchema } from '@/lib/validation';

type ActionResponse = {
  status: 'success' | 'error';
  message: string;
};

const INPUT_ERROR_MESSAGE = '입력값을 확인해주세요.';
const COMMENT_ERROR_MESSAGE = '댓글 내용을 입력해주세요.';
const POST_SUCCESS_MESSAGE = '문의가 등록되었습니다.';
const COMMENT_SUCCESS_MESSAGE = '댓글이 등록되었습니다.';
const SCHOOL_REQUIRED_MESSAGE = '대상 학교를 선택해주세요.';
const SCHOOL_NOT_ALLOWED_MESSAGE = '연결된 학교만 선택할 수 있습니다.';
const MATCH_REQUEST_SUCCESS_MESSAGE = '학교-학생 매칭 요청이 전송되었습니다.';

export async function createBoardPostAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  const session = await requireSession();

  const parsed = boardPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    schoolId: formData.get('schoolId'),
    parentOnly: formData.get('parentOnly') === 'on'
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  let matchedStudentId: string | null = null;

  if (session.user?.role === 'PARENT') {
    if (!parsed.data.schoolId) {
      return { status: 'error', message: SCHOOL_REQUIRED_MESSAGE };
    }

    const students = await getStudentsByParent(session.user.id);
    const allowedSchoolIds = new Set(students.map((student) => student.schoolId).filter((id): id is string => Boolean(id)));
    if (!allowedSchoolIds.has(parsed.data.schoolId)) {
      return { status: 'error', message: SCHOOL_NOT_ALLOWED_MESSAGE };
    }

    // 추가 제한: 연결된 관리자 소속 학교만 허용
    const profile = await getParentProfile(session.user.id);
    const school = await getSchoolById(parsed.data.schoolId);
    if (profile?.adminUserId && school && school.adminUserId && school.adminUserId !== profile.adminUserId) {
      return { status: 'error', message: SCHOOL_NOT_ALLOWED_MESSAGE };
    }

    matchedStudentId =
      students.find((student) => student.schoolId === parsed.data.schoolId)?.id ?? null;
  }

  await createBoardPost({
    ...parsed.data,
    schoolId: parsed.data.schoolId ? parsed.data.schoolId : null,
    authorId: session.user?.id as string,
    parentOnly: parsed.data.parentOnly ?? true
  });

  if (session.user?.role === 'PARENT' && parsed.data.schoolId && matchedStudentId) {
    await createAlert({
      studentId: matchedStudentId,
      schoolId: parsed.data.schoolId,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      type: 'INQUIRY',
      createdBy: session.user.id
    });
  }

  revalidatePath('/board');
  return { status: 'success', message: POST_SUCCESS_MESSAGE };
}

export async function createBoardCommentAction(_prev: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  const session = await requireSession();

  const parentCommentIdRaw = formData.get('parentCommentId');
  const parentCommentId =
    typeof parentCommentIdRaw === 'string' && parentCommentIdRaw.length > 0 ? parentCommentIdRaw : undefined;

  const parsed = commentSchema.safeParse({
    postId: formData.get('postId'),
    content: formData.get('content'),
    parentCommentId
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.errors[0]?.message ?? COMMENT_ERROR_MESSAGE
    };
  }

  const comment = await createBoardComment({
    ...parsed.data,
    authorId: session.user?.id as string,
    parentCommentId: parsed.data.parentCommentId ?? null
  });

  // 관리자가 댓글을 달면 게시글 작성자(학부모)에게 알림 생성
  if (session.user?.role === 'ADMIN') {
    const post = await getBoardPostById(parsed.data.postId);
    if (post) {
      const postAuthor = await getUserById(post.authorId);
      if (postAuthor?.role === 'PARENT') {
        await createBoardNotification({
          receiverId: post.authorId,
          postId: post.id,
          commentId: comment.id,
        }).catch(() => {}); // 알림 생성 실패는 조용히 무시
      }
    }
  }

  revalidatePath(`/board/${parsed.data.postId}`);
  return { status: 'success', message: COMMENT_SUCCESS_MESSAGE };
}

export async function lockBoardPostAction(id: string) {
  await requireSession('ADMIN');
  await lockBoardPost(id);
  revalidatePath(`/board/${id}`);
}

export async function requestSchoolMatchAction(
  _prev: ActionResponse | undefined
): Promise<ActionResponse> {
  const session = await requireSession('PARENT');
  const user = session.user!;

  const [students, profile] = await Promise.all([
    getStudentsByParent(user.id),
    getParentProfile(user.id)
  ]);
  const student = students[0];
  const studentName = student?.name ?? profile?.studentName ?? '학생';
  const parentName = user.name ?? '학부모';
  const message = `${studentName}학생의 학부모 ${parentName}가 게시글 등록을 위해 학교-학생 매칭을 요청했습니다.`;

  await createBoardPost({
    title: '학교-학생 매칭 요청',
    content: message,
    authorId: user.id,
    schoolId: student?.schoolId ?? null,
    parentOnly: true
  });

  if (student?.schoolId) {
    const now = new Date();
    await createAlert({
      studentId: student.id,
      schoolId: student.schoolId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      type: 'INQUIRY',
      createdBy: user.id,
      memo: message
    });
  }

  revalidatePath('/board');
  revalidatePath('/dashboard/alerts');
  return { status: 'success', message: MATCH_REQUEST_SUCCESS_MESSAGE };
}

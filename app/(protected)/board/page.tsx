import Link from 'next/link';

import { CreatePostForm } from '@/app/(protected)/board/_components/create-post-form';
import { PostUnreadBadge } from '@/app/(protected)/board/_components/post-unread-badge';
import { requireSession } from '@/lib/auth/session';
import { getBoardPosts } from '@/lib/data/board';
import { getSchools } from '@/lib/data/school';
import { getStudentsByParent } from '@/lib/data/student';
import { getParentProfile } from '@/lib/data/user';
import { RequestSchoolMatchButton } from '@/components/request-school-match-button';
import { PageHeader } from '@/components/layout/page-header';
import { AdSlot } from '@/components/ads/ad-slot';

export default async function BoardPage() {
  const session = await requireSession();
  const role = session.user?.role;

  if (role === 'ADMIN') {
    const [schools, posts] = await Promise.all([getSchools(), getBoardPosts()]);

    return (
      <div className="space-y-6">
        <PageHeader title="문의 요청 관리" description="학부모 문의를 확인하고 필요한 안내를 등록하세요." />

        <CreatePostForm
          title="공지 작성"
          schools={schools.map((school) => ({ id: school.id, name: school.name }))}
          description="학교 공지와 안내를 등록해주세요."
        />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">최근 문의 요청</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/board/${post.id}`}
                className={`block ui-card ui-card-pad transition hover:-translate-y-0.5 hover:shadow-lg ${
                  post.locked
                    ? 'border-emerald-200 bg-emerald-50/60 ring-1 ring-emerald-200/60 hover:border-emerald-300'
                    : 'border-slate-200 bg-white/95 hover:border-primary-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {post.title}
                      <PostUnreadBadge postId={post.id} viewerId={session.user!.id} lastCommentAt={post.lastCommentAt} />
                    </h3>
                    <p className="text-sm text-slate-700">작성자 {post.author?.name ?? '없음'} · {new Date(post.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-600">조회수 {post.viewCount ?? 0} · 댓글 {post.commentCount ?? 0}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.locked ? (
                      <span className="ui-badge border-emerald-200 bg-emerald-100 text-emerald-700">
                        답변완료
                      </span>
                    ) : null}
                    <span className="ui-badge">
                      {post.parentOnly ? '학부모 전용' : '전체 공개'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {posts.length === 0 ? (
              <p className="ui-empty">등록된 문의가 없습니다.</p>
            ) : null}
          </div>
        </section>

        <AdSlot placement="문의 게시판 하단" format="horizontal" />
      </div>
    );
  }

  const user = session.user!;
  const [students, schools, profile, posts] = await Promise.all([
    getStudentsByParent(user.id),
    getSchools(),
    getParentProfile(user.id),
    getBoardPosts({ authorId: user.id, targetParentId: user.id })
  ]);
  const schoolNameMap = new Map(schools.map((school) => [school.id, school.name]));
  const childSchoolIds = Array.from(new Set(students.map((student) => student.schoolId).filter((id): id is string => Boolean(id))));
  const allowedSchoolIds = new Set(
    schools
      .filter((s) => (profile?.adminUserId ? s.adminUserId === profile.adminUserId : true))
      .map((s) => s.id)
  );
  const filteredIds = childSchoolIds.filter((id) => allowedSchoolIds.has(id));
  const childSchools = filteredIds.map((id) => ({ id, name: schoolNameMap.get(id) ?? '학교 정보 없음' }));

  return (
    <div className="space-y-6">
      <PageHeader title="문의 게시판" description="문의가 등록되면 관리자에게 알림이 전송되며, 확인 후 답변합니다." />

      {childSchools.length === 0 ? (
        <section className="ui-card ui-card-pad text-base text-slate-700">
          <p className="mb-3">
            등록 가능한 학교가 없습니다. 학교-학생 매칭이 필요합니다.
          </p>
          <RequestSchoolMatchButton />
        </section>
      ) : (
        <CreatePostForm
          schools={childSchools}
          description="자녀 학교와 관련된 문의를 작성해주세요. 문의가 등록되면 관리자에게 알림이 전송되며, 확인 후 답변합니다."
          lockParentOnly
          showAllOption={false}
        />
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">내가 등록한 문의</h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className={`block ui-card ui-card-pad transition hover:-translate-y-0.5 hover:shadow-lg ${
                post.locked
                  ? 'border-emerald-200 bg-emerald-50/60 ring-1 ring-emerald-200/60 hover:border-emerald-300'
                  : 'border-slate-200 bg-white/95 hover:border-primary-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {post.title}
                    <PostUnreadBadge postId={post.id} viewerId={user.id} lastCommentAt={post.lastCommentAt} />
                  </h3>
                  <p className="text-sm text-slate-700">등록일 {new Date(post.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-600">조회수 {post.viewCount ?? 0} · 댓글 {post.commentCount ?? 0}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {post.locked ? (
                    <span className="ui-badge border-emerald-200 bg-emerald-100 text-emerald-700">
                      답변완료
                    </span>
                  ) : null}
                  <span className="ui-badge">
                    {post.parentOnly ? '학부모 전용' : '전체 공개'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {posts.length === 0 ? (
            <p className="ui-empty">등록한 문의가 없습니다.</p>
          ) : null}
        </div>
      </section>

      <AdSlot placement="문의 게시판 하단" format="horizontal" />
    </div>
  );
}

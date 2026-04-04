import Link from 'next/link';

import { CreatePostForm } from '@/app/(protected)/board/_components/create-post-form';
import { PostUnreadBadge } from '@/app/(protected)/board/_components/post-unread-badge';
import { requireSession } from '@/lib/auth/session';
import { getBoardPosts } from '@/lib/data/board';
import { getSchools } from '@/lib/data/school';
import { getStudentsByParent } from '@/lib/data/student';
import { getParentProfile } from '@/lib/data/user';
import { RequestSchoolMatchButton } from '@/components/request-school-match-button';
import { AdSlot } from '@/components/ads/ad-slot';

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '';
  const now = Date.now();
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '';
  const diff = now - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  const date = new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function AvatarCircle({ name }: { name: string | null | undefined }) {
  const initial = name ? name.charAt(0) : '?';
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
      {initial}
    </div>
  );
}

type ConversationCardProps = {
  id: string;
  authorName: string | null | undefined;
  title: string;
  locked: boolean;
  createdAt: string;
  lastCommentAt?: string | null;
  viewerId: string;
  showUnread?: boolean;
};

function ConversationCard({ id, authorName, title, locked, createdAt, lastCommentAt, viewerId, showUnread }: ConversationCardProps) {
  const timeLabel = formatRelativeTime(lastCommentAt ?? createdAt);

  return (
    <Link
      href={`/board/${id}`}
      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition active:bg-slate-50"
    >
      <AvatarCircle name={authorName} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-base font-semibold text-slate-900">
            {authorName ?? '익명'}
          </span>
          <span className="shrink-0 text-xs text-slate-400">{timeLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm text-slate-600">{title}</span>
          {showUnread ? (
            <PostUnreadBadge postId={id} viewerId={viewerId} lastCommentAt={lastCommentAt} />
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        {locked ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        ) : (
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary-500" />
        )}
      </div>
    </Link>
  );
}

export default async function BoardPage() {
  const session = await requireSession();
  const role = session.role;

  if (role === 'ADMIN') {
    const [schools, posts] = await Promise.all([getSchools(), getBoardPosts()]);

    return (
      <div className="space-y-4 pb-10">
        <section>
          <h2 className="mb-3 text-xl font-bold text-slate-900">문의 목록</h2>
          <div className="space-y-2">
            {posts.map((post) => (
              <ConversationCard
                key={post.id}
                id={post.id}
                authorName={post.author?.name}
                title={post.title}
                locked={post.locked}
                createdAt={post.createdAt}
                lastCommentAt={post.lastCommentAt}
                viewerId={session.id}
                showUnread
              />
            ))}
            {posts.length === 0 ? (
              <p className="py-8 text-center text-base text-slate-500">등록된 문의가 없습니다.</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold text-slate-900">공지 작성</h2>
          <CreatePostForm
            title="공지 작성"
            schools={schools.map((school) => ({ id: school.id, name: school.name }))}
            description="학교 공지와 안내를 등록해주세요."
          />
        </section>

        <AdSlot placement="문의 게시판 하단" format="horizontal" />
      </div>
    );
  }

  const [students, schools, profile, posts] = await Promise.all([
    getStudentsByParent(session.id),
    getSchools(),
    getParentProfile(session.id),
    getBoardPosts({ authorId: session.id, targetParentId: session.id })
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
    <div className="space-y-4 pb-10">
      {/* 내 문의 목록 */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900">내 문의</h2>
        {posts.length === 0 ? (
          <p className="py-8 text-center text-base text-slate-500">등록한 문의가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <ConversationCard
                key={post.id}
                id={post.id}
                authorName={post.author?.name ?? session.name}
                title={post.title}
                locked={post.locked}
                createdAt={post.createdAt}
                lastCommentAt={post.lastCommentAt}
                viewerId={session.id}
                showUnread
              />
            ))}
          </div>
        )}
      </section>

      {/* 문의 등록 폼 */}
      {childSchools.length === 0 ? (
        <section className="ui-card ui-card-pad text-base text-slate-700">
          <p className="mb-3">
            등록 가능한 학교가 없습니다. 학교-학생 매칭이 필요합니다.
          </p>
          <RequestSchoolMatchButton />
        </section>
      ) : (
        <section>
          <CreatePostForm
            title="문의 작성"
            schools={childSchools}
            description="자녀 학교와 관련된 문의를 작성해주세요. 문의가 등록되면 관리자에게 알림이 전송되며, 확인 후 답변합니다."
            lockParentOnly
            showAllOption={false}
            collapsible
          />
        </section>
      )}

      <AdSlot placement="문의 게시판 하단" format="horizontal" />
    </div>
  );
}

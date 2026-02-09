import { notFound } from 'next/navigation';

import { CommentForm } from '@/app/(protected)/board/_components/comment-form';
import { CommentItem } from '@/app/(protected)/board/_components/comment-item';
import { requireSession } from '@/lib/auth/session';
import { getBoardPostWithComments, incrementBoardPostViews } from '@/lib/data/board';
import { lockBoardPostAction } from '@/app/(protected)/board/actions';
import { PostReadMarker } from '@/app/(protected)/board/_components/post-read-marker';

type BoardPostPageProps = {
  params: {
    id: string;
  };
};

export default async function BoardPostPage({ params }: BoardPostPageProps) {
  const session = await requireSession();
  const post = await getBoardPostWithComments(params.id);

  if (!post) {
    notFound();
  }

  const isAdmin = session.user?.role === 'ADMIN';
  if (post.parentOnly && !isAdmin && post.authorId !== session.user?.id && post.targetParentId !== session.user?.id) {
    notFound();
  }

  await incrementBoardPostViews(post.id);

  const normalizeTimestamp = (value: Date | string) => (typeof value === 'string' ? value : value.toISOString());

  const comments = post.comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: normalizeTimestamp(comment.createdAt),
    author: { name: comment.author.name },
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: normalizeTimestamp(reply.createdAt),
      author: { name: reply.author.name },
      replies: []
    }))
  }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <PostReadMarker
        postId={post.id}
        viewerId={session.user!.id}
        lastCommentAt={post.lastCommentAt ?? null}
        fallbackAt={post.updatedAt}
      />
      <article className="ui-card ui-card-pad">
        <header className="space-y-3">
          <div className="flex flex-col gap-1 text-sm text-slate-700 sm:flex-row sm:items-center sm:gap-2">
            <span>작성자 {post.author.name ?? '익명'}</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            {/* 작성일 표시 생략 (타입 추론 간소화) */}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{post.title}</h1>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {post.parentOnly ? '학부모 전용' : '전체 공개'}
            </span>
            {(post as any).locked ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                답변완료
              </span>
            ) : null}
            {isAdmin && !(post as any).locked ? (
              <form action={lockBoardPostAction.bind(null, post.id)}>
                <button className="ui-btn-outline border-primary-200 px-3 py-1.5 text-sm text-primary-600 hover:border-primary-300 hover:bg-primary-50">
                  답변완료 처리
                </button>
              </form>
            ) : null}
          </div>
        </header>
        <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-slate-700">{post.content}</div>
      </article>

      <section className="ui-card ui-card-pad space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">댓글</h2>
          <p className="text-sm text-slate-700">문의에 대한 추가 질문을 남겨주세요. 잠금 처리 시 댓글은 불가합니다.</p>
        </header>

        {(post as any).locked ? null : <CommentForm postId={post.id} />}

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={post.id} />
          ))}
          {comments.length === 0 ? (
            <p className="ui-empty">등록된 댓글이 없습니다.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

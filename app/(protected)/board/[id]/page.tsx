import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CommentForm } from '@/app/(protected)/board/_components/comment-form';
import { requireSession } from '@/lib/auth/session';
import { getBoardPostWithComments, incrementBoardPostViews } from '@/lib/data/board';
import { lockBoardPostAction } from '@/app/(protected)/board/actions';
import { PostReadMarker } from '@/app/(protected)/board/_components/post-read-marker';

type BoardPostPageProps = {
  params: {
    id: string;
  };
};

function formatTime(value: string) {
  const d = new Date(value);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = String(m).padStart(2, '0');
  return `${ampm} ${hour}:${min}`;
}

function formatDate(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

type MessageBubbleProps = {
  isMine: boolean;
  authorName: string | null;
  content: string;
  createdAt: string;
  isFirst?: boolean;
};

function MessageBubble({ isMine, authorName, content, createdAt, isFirst }: MessageBubbleProps) {
  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isFirst ? (
          <span className="px-1 text-sm font-semibold text-sp-muted">{authorName ?? '익명'}</span>
        ) : null}
        <div
          className={`px-4 py-3 text-base leading-relaxed shadow-sm ${
            isMine
              ? 'rounded-2xl rounded-tr-sm bg-primary-600 text-white'
              : 'rounded-2xl rounded-tl-sm border border-sp-border bg-sp-raised text-sp-text'
          }`}
        >
          {content}
        </div>
        <span className="px-1 text-xs text-sp-faint">{formatTime(createdAt)}</span>
      </div>
    </div>
  );
}

export default async function BoardPostPage({ params }: BoardPostPageProps) {
  const session = await requireSession();
  const post = await getBoardPostWithComments(params.id);

  if (!post) {
    notFound();
  }

  const isAdmin = session.role === 'ADMIN';
  if (post.parentOnly && !isAdmin && post.authorId !== session.id && post.targetParentId !== session.id) {
    notFound();
  }

  await incrementBoardPostViews(post.id);

  const normalizeTimestamp = (value: Date | string) =>
    typeof value === 'string' ? value : value.toISOString();

  // 모든 메시지를 시간 순으로 평탄화
  type FlatMessage = {
    id: string;
    content: string;
    createdAt: string;
    authorId: string;
    authorName: string | null;
  };

  const messages: FlatMessage[] = [];

  // 원본 게시글을 첫 메시지로
  messages.push({
    id: `post-${post.id}`,
    content: post.title !== post.content ? `${post.title}\n\n${post.content}` : post.content,
    createdAt: normalizeTimestamp(post.createdAt),
    authorId: post.authorId,
    authorName: post.author.name,
  });

  // 댓글 및 대댓글을 시간순으로 평탄화
  const allComments = post.comments.flatMap((comment) => {
    const nodes: FlatMessage[] = [
      {
        id: comment.id,
        content: comment.content,
        createdAt: normalizeTimestamp(comment.createdAt),
        authorId: comment.author ? (comment.author as any).id ?? comment.authorId ?? '' : '',
        authorName: comment.author.name,
      },
      ...comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: normalizeTimestamp(reply.createdAt),
        authorId: reply.author ? (reply.author as any).id ?? (reply as any).authorId ?? '' : '',
        authorName: reply.author.name,
      })),
    ];
    return nodes;
  });

  messages.push(...allComments);
  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // 상대방 이름 (학부모 뷰에서는 관리자, 관리자 뷰에서는 학부모)
  const otherPartyName = isAdmin
    ? (post.author.name ?? '학부모')
    : '관리자';

  // 날짜 구분선 표시용
  let lastDate = '';

  const locked = !!(post as any).locked;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden md:static md:flex md:flex-col"
      style={{ paddingTop: 'var(--header-h)' }}
    >
      <PostReadMarker
        postId={post.id}
        viewerId={session.id}
        lastCommentAt={post.lastCommentAt ?? null}
        fallbackAt={post.updatedAt}
      />

      {/* 채팅 헤더 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-sp-border bg-sp-surface px-4 py-3">
        <Link
          href="/board"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sp-muted hover:bg-sp-raised active:bg-sp-high"
          aria-label="뒤로 가기"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sp-raised text-sm font-semibold text-sp-muted">
            {(otherPartyName ?? '?').slice(0, 1)}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-base font-semibold text-sp-text">{otherPartyName}</span>
            {locked ? (
              <span className="text-xs font-medium text-emerald-400">답변완료</span>
            ) : null}
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          {isAdmin && !locked ? (
            <form action={lockBoardPostAction.bind(null, post.id)}>
              <button
                type="submit"
                className="rounded-full bg-emerald-900/20 px-3 py-1.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-900/30 active:bg-emerald-900/40"
              >
                완료
              </button>
            </form>
          ) : null}
        </div>
      </header>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-sp-bg">
        <div className="space-y-3 px-4 py-4">
          {messages.map((msg, idx) => {
            const msgDate = formatDate(msg.createdAt);
            const showDate = msgDate !== lastDate;
            if (showDate) lastDate = msgDate;

            const isMine = msg.authorId === session.id;
            const prevMsg = messages[idx - 1];
            const isFirst =
              idx === 0 ||
              !prevMsg ||
              prevMsg.authorId !== msg.authorId;

            return (
              <div key={msg.id}>
                {showDate ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px flex-1 bg-sp-border" />
                    <span className="text-xs font-medium text-sp-faint">{msgDate}</span>
                    <div className="h-px flex-1 bg-sp-border" />
                  </div>
                ) : null}
                <MessageBubble
                  isMine={isMine}
                  authorName={msg.authorName}
                  content={msg.content}
                  createdAt={msg.createdAt}
                  isFirst={isFirst}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 입력창 */}
      <div
        className="shrink-0"
        style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))' }}
      >
        <CommentForm postId={post.id} locked={locked} />
      </div>
    </div>
  );
}

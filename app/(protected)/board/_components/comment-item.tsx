'use client';

// 이 컴포넌트는 board/[id]/page.tsx에서 직접 말풍선으로 렌더링되므로
// 하위 호환성 유지를 위해 파일은 유지하되 단순화합니다.

type CommentAuthor = {
  name: string | null;
};

type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentNode[];
};

type CommentItemProps = {
  comment: CommentNode;
  postId: string;
};

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="rounded-xl bg-slate-100 px-4 py-3">
      <p className="text-sm font-semibold text-slate-700">{comment.author.name ?? '익명'}</p>
      <p className="mt-1 text-base leading-relaxed text-slate-900">{comment.content}</p>
    </div>
  );
}

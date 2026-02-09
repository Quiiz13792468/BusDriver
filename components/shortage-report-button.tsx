"use client";

import Swal from 'sweetalert2';

type Item = { name: string; paid: number; needed: number };

export function ShortageReportButton({ items, label }: { items: Item[]; label: string }) {
  const show = () => {
    const rows = items
      .map(
        (i) =>
          `<div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px;align-items:center;padding:10px 12px;border-bottom:1px solid #efe7de;">` +
          `<div style="font-weight:600;color:#13201f;">${escapeHtml(i.name)}</div>` +
          `<div style="text-align:right;color:#1f2937;">${i.paid.toLocaleString()}원</div>` +
          `<div style="text-align:right;color:#b91c1c;font-weight:600;">${i.needed.toLocaleString()}원</div>` +
          `</div>`
      )
      .join('');
    const html =
      `<div style="max-height:360px;overflow:auto;font-size:14px;">` +
      `<div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px;align-items:center;padding:10px 12px;border-bottom:1px solid #e7e0d8;color:#4c5a57;font-weight:700;background:#f8f4ef;">` +
      `<div>학생</div>` +
      `<div style="text-align:right;">입금액</div>` +
      `<div style="text-align:right;">부족금액</div>` +
      `</div>` +
      `${rows || `<div style="padding:14px 12px;text-align:center;color:#64748b;">데이터가 없습니다.</div>`}` +
      `</div>`;
    void Swal.fire({
      icon: 'info',
      title: '부족 금액 상세',
      html,
      confirmButtonText: '닫기',
      width: 560
    });
  };
  return (
    <button type="button" onClick={show} className="underline decoration-dotted underline-offset-2 hover:text-primary-700">
      {label}
    </button>
  );
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

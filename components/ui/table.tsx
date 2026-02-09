import type { ReactNode, TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import clsx from 'clsx';

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  children: ReactNode;
};

export function UiTable({ children, className }: TableProps) {
  return <table className={clsx('ui-table', className)}>{children}</table>;
}

type SectionProps = HTMLAttributes<HTMLTableSectionElement> & {
  children: ReactNode;
};

export function UiThead({ children, className }: SectionProps) {
  return <thead className={clsx('ui-thead', className)}>{children}</thead>;
}

export function UiTbody({ children, className }: SectionProps) {
  return <tbody className={clsx('bg-white', className)}>{children}</tbody>;
}

type RowProps = HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
};

export function UiTr({ children, className }: RowProps) {
  return <tr className={className}>{children}</tr>;
}

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
};

export function UiTh({ children, className, ...rest }: ThProps) {
  return <th className={clsx('ui-th', className)} {...rest}>{children}</th>;
}

type TdProps = TdHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
};

export function UiTd({ children, className, ...rest }: TdProps) {
  return <td className={clsx('ui-td', className)} {...rest}>{children}</td>;
}

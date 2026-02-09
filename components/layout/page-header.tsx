import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="ui-card ui-card-pad">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
          {description ? <div className="text-base text-slate-700">{description}</div> : null}
        </div>
        {action ? <div className="flex items-center">{action}</div> : null}
      </div>
    </header>
  );
}

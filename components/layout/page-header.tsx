import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="ui-card ui-card-pad">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1.5">
          <h2 className="mb-1 text-xl font-bold text-sp-text">{title}</h2>
          {description ? <div className="text-base text-sp-muted">{description}</div> : null}
        </div>
        {action ? <div className="flex w-full items-center sm:w-auto">{action}</div> : null}
      </div>
    </header>
  );
}

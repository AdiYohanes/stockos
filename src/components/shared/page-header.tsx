import React from 'react';

interface PageHeaderProps {
  title: string;
  badgeText?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, badgeText, description, actions }: PageHeaderProps) {
  return (
    <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-6">
      <div>
        {description && (
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-foreground/50 mb-2">
            Platform / {description}
          </p>
        )}
        <div className="flex items-start gap-4">
          <h2 className="font-heading font-[900] uppercase tracking-tighter text-4xl md:text-5xl leading-[.9]">
            {title}
            {badgeText && (
              <span className="bg-primary px-2 mt-1 xl:mt-0 block w-fit">
                {badgeText}
              </span>
            )}
          </h2>
        </div>
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions}
        </div>
      )}
    </section>
  );
}

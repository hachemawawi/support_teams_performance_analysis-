import React from 'react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="pb-5 border-b border-gray-200">
      <h3 className="text-2xl font-bold leading-6 text-gray-900">{title}</h3>
      {subtitle && (
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          {subtitle}
        </p>
      )}
      {actions && <div className="mt-4 md:mt-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
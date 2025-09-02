"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`} 
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400 dark:text-gray-500">
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </span>
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 
                           transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={
                    isLast || item.isActive
                      ? "text-gray-900 dark:text-gray-100 font-semibold"
                      : "text-gray-600 dark:text-gray-400 font-medium"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function HomeBreadcrumb({ className }: { className?: string }) {
  return (
    <Breadcrumb
      items={[{ label: "Home", href: "/" }]}
      className={className}
    />
  );
}

export function CategoryBreadcrumb({ 
  categoryName, 
  categorySlug, 
  className 
}: { 
  categoryName: string; 
  categorySlug?: string; 
  className?: string; 
}) {
  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Categories", href: "/#categories" },
        { 
          label: categoryName, 
          href: categorySlug ? `/category/${categorySlug}` : undefined,
          isActive: true 
        }
      ]}
      className={className}
    />
  );
}

export function PromptBreadcrumb({ 
  categoryName, 
  categorySlug, 
  subcategoryName,
  promptTitle, 
  className 
}: { 
  categoryName: string; 
  categorySlug: string; 
  subcategoryName?: string;
  promptTitle: string; 
  className?: string; 
}) {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/#categories" },
    { label: categoryName, href: `/category/${categorySlug}` }
  ];

  if (subcategoryName) {
    items.push({ label: subcategoryName });
  }

  items.push({ label: promptTitle, isActive: true });

  return <Breadcrumb items={items} className={className} />;
}

export function SearchBreadcrumb({ 
  query, 
  className 
}: { 
  query?: string; 
  className?: string; 
}) {
  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { 
          label: query ? `Search: "${query}"` : "Search", 
          isActive: true 
        }
      ]}
      className={className}
    />
  );
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-block ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="ios-setting-row">
      <div className="ios-row-leading">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-36" />
    </div>
  );
}
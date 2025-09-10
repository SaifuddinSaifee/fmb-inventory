import React from "react";

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className ?? ""}`}
    />
  );
};

export default Skeleton;



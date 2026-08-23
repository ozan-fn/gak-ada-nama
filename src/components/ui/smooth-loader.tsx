import { type ReactNode } from "react";

type SmoothLoaderProps = {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
};

export function SmoothLoader({ loading, skeleton, children }: SmoothLoaderProps) {
  return (
    <>
      {loading ? skeleton : children}
    </>
  );
}

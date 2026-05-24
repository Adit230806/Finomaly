export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full border-4 border-[#E8E6E0] border-t-[#00C853] animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

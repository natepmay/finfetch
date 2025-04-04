export function LoggedOutCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center items-center h-full w-1/2">
      <div className="flex flex-col items-center justify-center my-24 mx-12 border-2 border-gray-400 h-100 max-h-full overflow-hidden w-full rounded-2xl p-10">
        {children}
      </div>
    </div>
  );
}

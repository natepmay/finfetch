export function ItemHeader({ itemName }: { itemName: string }) {
  return (
    <header className="border-b-2 border-b-gray-200 pb-2 flex justify-between items-center">
      <h2 className="text-2xl text-blue-700 font-black">{itemName}</h2>
      <a className="text-blue-600 text-xs underline cursor-pointer">Remove</a>
    </header>
  );
}

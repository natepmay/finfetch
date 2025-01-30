interface Props {
  name: string;
  nickname: string;
  lastDownloaded: string;
}

export function ItemCardAccount({ name, nickname, lastDownloaded }: Props) {
  return (
    <article className="border-b-2 border-b-gray-200 pt-3">
      <header className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{name} </h3>
        <a className="text-blue-600 text-xs underline">Remove</a>
      </header>
      <div className="grid grid-cols-2 my-3">
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">Nickname</div>
          <div className="text-lg font-light text-center">
            {nickname}{" "}
            <a className="text-blue-600 text-xs underline ml-1">Edit</a>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">Last Downloaded</div>
          <div className="text-lg font-light">{lastDownloaded}</div>
        </div>
      </div>
    </article>
  );
}

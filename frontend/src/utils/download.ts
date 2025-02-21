// lightly adapted from RodolfoSilva's comment on this gist: https://gist.github.com/devloco/5f779216c988438777b76e7db113d05c

function getFileNameFromContentDispostionHeader(
  contentDisposition: string
): string | undefined {
  const standardPattern = /filename=(["']?)(.+)\1/i;
  const wrongPattern = /filename=([^"'][^;"'\n]+)/i;

  if (standardPattern.test(contentDisposition)) {
    return contentDisposition.match(standardPattern)![2];
  }

  if (wrongPattern.test(contentDisposition)) {
    return contentDisposition.match(wrongPattern)![1];
  }
}

function saveBlob(fileName: string, blob: Blob) {
  // MS Edge and IE don't allow using a blob object directly as link href, instead it is necessary to use msSaveOrOpenBlob
  // @ts-expect-error msSaveorOpenBlob is legit if it's Edge
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    // @ts-expect-error msSaveorOpenBlob is legit if it's Edge
    window.navigator.msSaveOrOpenBlob(blob);
    return;
  }

  // For other browsers: create a link pointing to the ObjectURL containing the blob.
  const objUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objUrl;
  link.download = fileName;
  link.click();

  // For Firefox it is necessary to delay revoking the ObjectURL.
  setTimeout(() => {
    window.URL.revokeObjectURL(objUrl);
  }, 250);
}

interface Options {
  url: string;
  body?: BodyInit;
  onDownloadProgress?: (receivedLength: number, contentLength: number) => void;
  fetchOptions?:
    | RequestInit
    | ((fetchOptions: RequestInit) => Promise<RequestInit>);
}

export async function downloadFile(options: Options) {
  const { url, onDownloadProgress, fetchOptions, body } = options;

  let requestInit: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  };

  if (typeof fetchOptions === "function") {
    requestInit = await fetchOptions(requestInit);
  } else if (typeof fetchOptions === "object") {
    requestInit = { ...requestInit, ...fetchOptions };
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(responseBody ?? "Error try again");
  }

  const reader = response.body!.getReader();

  const contentLength = Number(response.headers.get("Content-Length"));

  let receivedLength = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (typeof onDownloadProgress !== "undefined") {
      onDownloadProgress(receivedLength, contentLength);
    }
  }

  const type = response.headers.get("content-type")?.split(";")[0];

  const coerceNum = (toCoerce: string | null) => {
    return toCoerce ? Number(toCoerce) : 0;
  };

  const txnCount = {
    added: coerceNum(response.headers.get("x-addedcount")),
    modified: coerceNum(response.headers.get("x-modifiedcount")),
    removed: coerceNum(response.headers.get("x-removedcount")),
  };

  // It is necessary to create a new blob object with mime-type explicitly set for all browsers except Chrome, but it works for Chrome too.
  const blob = new Blob(chunks, { type });

  const contentDisposition = response.headers.get("content-disposition");

  const fileName = getFileNameFromContentDispostionHeader(contentDisposition!);

  return {
    fileName,
    blob,
    txnCount,
  };
}

interface DownloadAndSaveFileOptions extends Options {
  defaultFileName: string;
}

export default async function downloadAndSaveFile(
  options: DownloadAndSaveFileOptions
) {
  const { defaultFileName, ...rest } = options;

  const { fileName, blob, txnCount } = await downloadFile(rest);

  if (!Object.values(txnCount).every((num) => num === 0)) {
    saveBlob(fileName ?? defaultFileName, blob);
  }

  return txnCount;
}

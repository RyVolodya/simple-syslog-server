export function convertSize(bytes: number) {
  if (bytes < 1024) {
    return { value: bytes, unit: "B" };
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return { value: Number(kb.toFixed(2)), unit: "KB" };
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return { value: Number(mb.toFixed(2)), unit: "MB" };
  }
  const gb = mb / 1024;
  return { value: Number(gb.toFixed(2)), unit: "GB" };
}

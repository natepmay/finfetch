export function camelToSnake(camel: string) {
  const camelStyle = /([a-z])([A-Z])/g;
  const snake = camel.replace(camelStyle, "$1_$2").toLowerCase();
  return snake;
}

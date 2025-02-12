import { camelToSnake } from "./pureFns.ts";
import { expect } from "jsr:@std/expect";

Deno.test("Convert camel to snake case", () => {
  const input = [
    "camelCase",
    "nomNomNom",
    "setHTML",
    "b",
    "singleton",
    "1numButNotAtEnd",
  ];
  const expected = [
    "camel-case",
    "nom-nom-nom",
    "set-html",
    "b",
    "singleton",
    "1num-but-not-at-end",
  ];
  const output = input.map((e) => camelToSnake(e));
  expect(output).toEqual(expected);
});

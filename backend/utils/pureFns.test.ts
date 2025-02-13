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
    "camel_case",
    "nom_nom_nom",
    "set_html",
    "b",
    "singleton",
    "1num_but_not_at_end",
  ];
  const output = input.map((e) => camelToSnake(e));
  expect(output).toEqual(expected);
});

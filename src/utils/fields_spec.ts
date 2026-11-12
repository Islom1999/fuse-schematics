import { FIELD_TYPES, FieldParseError, parseFields, stringifyFields } from "./fields";

describe("parseFields", () => {
  it("parses the documented example", () => {
    expect(
      parseFields("name:string,price:number,active:boolean,note:text?,status:enum(active|blocked)")
    ).toEqual([
      { name: "name", type: "string", required: true },
      { name: "price", type: "number", required: true },
      { name: "active", type: "boolean", required: true },
      { name: "note", type: "text", required: false },
      { name: "status", type: "enum", required: true, enumValues: ["active", "blocked"] },
    ]);
  });

  it("supports every declared type", () => {
    const parsed = parseFields("a:string,b:number,c:boolean,d:date,e:text,f:enum(x)");
    expect(parsed.map((f) => f.type)).toEqual([...FIELD_TYPES]);
  });

  it("returns an empty list for empty, whitespace or missing input", () => {
    expect(parseFields("")).toEqual([]);
    expect(parseFields("   ")).toEqual([]);
    expect(parseFields(undefined)).toEqual([]);
    expect(parseFields(null)).toEqual([]);
  });

  it("ignores whitespace and empty entries (trailing / double commas)", () => {
    expect(parseFields("  name : string , , price:number ,")).toEqual([
      { name: "name", type: "string", required: true },
      { name: "price", type: "number", required: true },
    ]);
  });

  it("treats types case-insensitively", () => {
    expect(parseFields("a:STRING,b:Date,c:Enum(X|Y)")).toEqual([
      { name: "a", type: "string", required: true },
      { name: "b", type: "date", required: true },
      { name: "c", type: "enum", required: true, enumValues: ["X", "Y"] },
    ]);
  });

  it("defaults a missing type to string", () => {
    expect(parseFields("title,subtitle?")).toEqual([
      { name: "title", type: "string", required: true },
      { name: "subtitle", type: "string", required: false },
    ]);
  });

  it("accepts the optional marker on the name or on the type, including enums", () => {
    expect(parseFields("a?:number,b:date?,c:enum(x|y)?")).toEqual([
      { name: "a", type: "number", required: false },
      { name: "b", type: "date", required: false },
      { name: "c", type: "enum", required: false, enumValues: ["x", "y"] },
    ]);
  });

  it("trims enum values and drops empty ones", () => {
    expect(parseFields("s:enum( a | b ||c )")[0].enumValues).toEqual(["a", "b", "c"]);
  });

  it("keeps commas inside parentheses from splitting entries", () => {
    expect(() => parseFields("s:enum(a,b)")).toThrowError(FieldParseError, /Invalid enum value "a,b"/);
  });

  describe("errors", () => {
    const cases: [string, RegExp][] = [
      ["price:money", /Unknown type "money" for field "price"/],
      ["status:enum", /needs values/],
      ["status:enum()", /at least one value/],
      ["status:enum(a|a)", /Duplicate enum value "a"/],
      ["status:enum(a'b)", /Invalid enum value/],
      ["name:string,name:number", /Duplicate field "name"/],
      ["1name:string", /Invalid field name "1name"/],
      ["first-name:string", /Invalid field name "first-name"/],
      [":string", /Missing field name/],
      ["name:", /Missing type for field "name"/],
      ["s:enum(a|b", /Unbalanced "\("/],
      ["s:enum)a(", /Unbalanced "\)"/],
    ];

    for (const [input, message] of cases) {
      it(`rejects ${JSON.stringify(input)}`, () => {
        expect(() => parseFields(input)).toThrowError(FieldParseError, message);
      });
    }
  });

  it("round-trips through stringifyFields", () => {
    const input = "name:string,price:number,note:text?,status:enum(active|blocked)?";
    expect(stringifyFields(parseFields(input))).toBe(input);
    expect(parseFields(stringifyFields(parseFields(input)))).toEqual(parseFields(input));
  });
});

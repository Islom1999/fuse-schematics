import { Tree } from "@angular-devkit/schematics";
import { isHttpUrl, loadOpenApi, readOpenApiSource } from "./openapi-source";
import { nestOpenApi } from "./openapi-fixtures_spec";

function fakeResponse(body: string, status = 200, statusText = "OK"): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => body,
  } as unknown as Response;
}

describe("openapi-source", () => {
  const g = globalThis as any;
  let originalFetch: unknown;

  beforeEach(() => {
    originalFetch = g.fetch;
  });
  afterEach(() => {
    g.fetch = originalFetch;
  });

  it("detects http(s) URLs", () => {
    expect(isHttpUrl("http://localhost:3000/docs-json")).toBe(true);
    expect(isHttpUrl(" HTTPS://x.dev/a.yaml")).toBe(true);
    expect(isHttpUrl("./swagger.json")).toBe(false);
  });

  it("reads workspace-relative paths from the tree", async () => {
    const tree = Tree.empty();
    tree.create("/api/swagger.json", '{"openapi":"3.0.0"}');
    expect(await readOpenApiSource(tree, "./api/swagger.json")).toBe('{"openapi":"3.0.0"}');
    expect(await readOpenApiSource(tree, "api/./swagger.json")).toBe('{"openapi":"3.0.0"}');
  });

  it("fails clearly for a missing file", async () => {
    await expectAsync(readOpenApiSource(Tree.empty(), "./missing-swagger.json")).toBeRejectedWithError(
      /OpenAPI document ".\/missing-swagger.json" not found/
    );
  });

  it("downloads URLs with the global fetch", async () => {
    const fetchSpy = jasmine.createSpy("fetch").and.resolveTo(fakeResponse(JSON.stringify(nestOpenApi())));
    g.fetch = fetchSpy;
    const doc = await loadOpenApi(Tree.empty(), "http://localhost:3000/docs-json");
    expect(doc.version).toBe(3);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.calls.argsFor(0)[0]).toBe("http://localhost:3000/docs-json");
  });

  it("parses YAML responses", async () => {
    g.fetch = jasmine
      .createSpy("fetch")
      .and.resolveTo(fakeResponse("openapi: 3.0.0\ncomponents:\n  schemas:\n    Tag: { type: object }\n"));
    const doc = await loadOpenApi(Tree.empty(), "https://example.test/openapi.yaml");
    expect(Object.keys(doc.schemas)).toEqual(["Tag"]);
  });

  it("reports HTTP errors, network errors and HTML pages", async () => {
    g.fetch = jasmine.createSpy("fetch").and.resolveTo(fakeResponse("nope", 404, "Not Found"));
    await expectAsync(loadOpenApi(Tree.empty(), "http://localhost:3000/x")).toBeRejectedWithError(
      /HTTP 404 Not Found/
    );

    const error = Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } });
    g.fetch = jasmine.createSpy("fetch").and.rejectWith(error);
    await expectAsync(loadOpenApi(Tree.empty(), "http://localhost:3000/docs-json")).toBeRejectedWithError(
      /ECONNREFUSED.*Is the backend running/
    );

    g.fetch = jasmine.createSpy("fetch").and.resolveTo(fakeResponse("<!DOCTYPE html><title>Swagger UI</title>"));
    await expectAsync(loadOpenApi(Tree.empty(), "http://localhost:3000/docs")).toBeRejectedWithError(
      /Invalid --openapi: .* is HTML/
    );
  });

  it("rejects documents that are not OpenAPI", async () => {
    const tree = Tree.empty();
    tree.create("/swagger.json", '{"hello":"world"}');
    await expectAsync(loadOpenApi(tree, "swagger.json")).toBeRejectedWithError(/Invalid --openapi: Unsupported document/);
  });
});

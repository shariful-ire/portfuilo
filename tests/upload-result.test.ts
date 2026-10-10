import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmedUpload, mergeUploadedMedia } from "../src/lib/media/upload-result";

const id = "b3ceaf67-4f85-4b7c-b2cb-aa196dfcb87a";
const asset = { id, state: "ready", kind: "image" as const, name: "portrait.png", alt: "Portrait", url: "https://res.cloudinary.com/example/image/upload/portrait.png" };

test("only confirmed upload metadata can select an asset", () => {
  assert.deepEqual(confirmedUpload(asset, id, "image"), asset);
  for (const patch of [{ state: "pending" }, { id: "wrong" }, { kind: "document" }, { url: "javascript:alert(1)" }, { name: "" }, { alt: undefined }]) {
    assert.throws(() => confirmedUpload({ ...asset, ...patch }, id, "image"));
  }
  assert.equal(confirmedUpload({ ...asset, kind: "document" }, id, "document").kind, "document");
});

test("upload merges preserve other media kinds and replace duplicate entries", () => {
  const pdf = { ...asset, id: "pdf", kind: "document" as const };
  const result = mergeUploadedMedia([pdf, { ...asset, state: "uploading" }], asset);
  assert.deepEqual(result, [asset, pdf]);
  assert.equal(result.filter((item) => item.id === id).length, 1);
});

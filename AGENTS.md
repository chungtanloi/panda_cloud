# PandaCloud Frontend Working Agreement

## Repository root

Treat this directory as the working repository root:

`D:\HelloCha\Projects\CoreyProjectWebsite\panda_cloud`

Run repository-scoped commands from this directory unless a task explicitly
requires the sibling backend repository.

## Architecture boundaries

- Keep the React MVC separation documented in `README.md`: models contain domain
  types, services own all I/O, controllers own behavior, and views render state.
- Components must not call `fetch`, read environment variables, or hard-code API
  hosts. Use `src/services/api.ts` and the configured adapter boundary.
- The frontend consumes only a pinned, released OpenAPI client through the
  backend's `/api/v1` HTTP gateway. It must never call Convex directly.
- `docs/API_CONTRACT.md` is requirements input, not an API contract. Do not
  invent response fields or silently adapt a backend mismatch.
- Preserve the Figma design tokens and use exported design assets instead of
  hand-drawing replacement brand glyphs.

## Documentation language

Write repository documentation, context summaries, examples, and comments in
English. Preserve another language only when it is source material that must be
quoted, and explain it in English when practical.

## Documentation context cache protocol

This protocol is mandatory whenever an agent needs repository-wide context.
Its purpose is to avoid repeatedly reading an unchanged documentation corpus.

### Source corpus

From the repository root, include:

- Every root-level regular file whose name starts with `README`, case
  insensitively.
- Every regular file recursively below `docs/`.

Exclude:

- `docs/AGENT_CONTEXT_SUMMARY.md` itself.
- Files below `.git`, `node_modules`, `.next`, `out`, `build`, `dist`, or
  `coverage` directories.
- Generated output that is explicitly documented as disposable. If such output
  appears below `docs/`, record the exclusion in the summary before omitting it.

Always read this `AGENTS.md` independently. It is an instruction source, not a
cached source document.

### Canonical snapshot

For every source file, record its repository-relative path with `/` separators,
SHA-256 digest of raw bytes, byte size, and last-write time in UTC. Sort paths by
their UTF-8 byte sequence. Build the canonical fingerprint input by concatenating
one line per file exactly as:

```text
<relative-path>\t<lowercase-sha256>\n
```

The corpus fingerprint is the lowercase SHA-256 of that UTF-8 input. File size
and modification time are audit metadata only and must not affect the
fingerprint. Therefore a timestamp-only change does not invalidate the cache.

Node.js is available in this repository. An agent may run this read-only command
from the repository root to produce the canonical manifest and fingerprint:

```powershell
node -e "const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=process.cwd(),files=[];for(const n of fs.readdirSync(root)){const p=path.join(root,n);if(fs.statSync(p).isFile()&&/^README/i.test(n))files.push(p)}const skip=new Set(['.git','node_modules','.next','out','build','dist','coverage']);function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name!=='AGENT_CONTEXT_SUMMARY.md')files.push(p)}}walk(path.join(root,'docs'));const rows=files.map(p=>{const b=fs.readFileSync(p),s=fs.statSync(p);return{path:path.relative(root,p).split(path.sep).join('/'),sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:s.size,modifiedUtc:s.mtime.toISOString()}}).sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path)));const canonical=rows.map(x=>x.path+'\\t'+x.sha256+'\\n').join('');console.log(JSON.stringify({schemaVersion:1,fingerprint:crypto.createHash('sha256').update(Buffer.from(canonical,'utf8')).digest('hex'),files:rows},null,2))"
```

### Cache decision

1. Compute the snapshot before reading the source corpus.
2. If `docs/AGENT_CONTEXT_SUMMARY.md` exists, has `schema_version: 1`, contains
   a complete manifest, and its fingerprint exactly matches the new snapshot,
   read only the summary for repository-wide context. Do not reread all source
   documents and do not edit the summary merely to record a cache check.
3. If the summary is missing, malformed, uses another schema version, or has an
   incomplete manifest, read the complete source corpus and rebuild it.
4. If the fingerprint changed, compare manifests. Read every new or
   content-changed file and any unchanged file needed to interpret that change.
   Reuse the existing summary for unchanged material. Remove or revise claims
   whose source was deleted, and treat a renamed path as a manifest change even
   when its content digest is unchanged.
5. A cache hit is only a context bootstrap. Open the authoritative source file
   whenever a task requires exact wording, a current contract detail, or
   evidence for a decision.

### Summary update rules

- Keep the summary in `docs/AGENT_CONTEXT_SUMMARY.md` and commit it with the
  documentation it represents.
- Update `last_context_refresh_at_utc` after a full or incremental refresh.
  Update `last_full_read_at_utc` only after reading the complete corpus.
- Each manifest row records `incorporated_at_utc`. Preserve that value for an
  unchanged file and update it after reading changed content.
- Record branch and HEAD only as diagnostics. Dirty and untracked documentation
  is valid input, so the content fingerprint, not Git state, decides cache
  validity.
- Summarize product purpose, architecture, current status, key workflows,
  constraints, decisions, cross-repository dependencies, gaps, and open
  questions. Do not present a proposal or prototype as an approved requirement.
- If the sibling `..\PandaCloudBackend` repository is relevant, validate its
  cache independently. A change in one repository does not invalidate the other.


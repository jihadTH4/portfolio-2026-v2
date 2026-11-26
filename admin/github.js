// Minimal GitHub REST client for the admin: read files, and publish many
// files in ONE commit through the Git Data API. Runs in the browser; the
// token never leaves it except to api.github.com.
const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const b64ToBytes = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
export const bytesToB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const utf8ToB64 = (text) => bytesToB64(new TextEncoder().encode(text));

export class Repo {
  constructor({ owner, repo, branch, token }) {
    Object.assign(this, { owner, repo, branch: branch || 'main', token });
  }

  async req(method, path, body, accept) {
    let r;
    try {
      r = await fetch(`${API}/repos/${this.owner}/${this.repo}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: accept || 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch {
      throw new GitHubError(0, 'تعذر الاتصال بـ GitHub. تحقق من الإنترنت وحاول مرة أخرى.');
    }
    if (!r.ok) {
      let msg = '';
      try { msg = (await r.json()).message || ''; } catch { /* not json */ }
      const hint = {
        401: 'رمز الوصول (Token) غير صالح أو انتهت صلاحيته. أنشئ رمزاً جديداً.',
        403: 'الرمز لا يملك صلاحية الكتابة على هذا المستودع، أو تجاوزت حد الطلبات. راجع صلاحيات الرمز: Contents — Read and write.',
        404: 'لم يُعثر على المستودع أو الفرع أو الملف. تحقق من اسم الحساب والمستودع والفرع، وأن الرمز يشمل هذا المستودع.',
        409: 'تعارض في المستودع: تغيّر الفرع أثناء النشر. أعد تحميل اللوحة.',
        422: 'رفض GitHub البيانات المرسلة.',
      }[r.status];
      throw new GitHubError(r.status, (hint || `خطأ من GitHub (${r.status}).`) + (msg ? ` [${msg}]` : ''));
    }
    if (r.status === 204) return null;
    return accept && accept.includes('raw') ? new Uint8Array(await r.arrayBuffer()) : r.json();
  }

  info() { return this.req('GET', ''); }
  headSha() { return this.req('GET', `/git/ref/heads/${encodeURIComponent(this.branch)}`).then((x) => x.object.sha); }

  async readText(path, ref) {
    const x = await this.req('GET', `/contents/${path}?ref=${encodeURIComponent(ref || this.branch)}`);
    return { text: new TextDecoder().decode(b64ToBytes(x.content)), sha: x.sha };
  }
  async readBytes(path, ref) {
    const x = await this.req('GET', `/contents/${path}?ref=${encodeURIComponent(ref || this.branch)}`);
    if (x.content) return b64ToBytes(x.content);
    return this.req('GET', `/contents/${path}?ref=${encodeURIComponent(ref || this.branch)}`, null, 'application/vnd.github.raw+json');
  }
  // blob shas of the files at a commit (to detect concurrent edits)
  async fileShas(commitSha, paths) {
    const c = await this.req('GET', `/git/commits/${commitSha}`);
    const t = await this.req('GET', `/git/trees/${c.tree.sha}?recursive=1`);
    const out = {};
    for (const e of t.tree) if (paths.includes(e.path)) out[e.path] = e.sha;
    return out;
  }

  // files: [{path, text} | {path, b64} | {path, delete: true}] → one commit
  async commit(files, message, parentSha, onStep = () => {}) {
    const parent = await this.req('GET', `/git/commits/${parentSha}`);
    const tree = [];
    let i = 0;
    for (const f of files) {
      i++;
      if (f.delete) { tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null }); continue; }
      onStep(`رفع ${i} من ${files.length}`);
      const blob = await this.req('POST', '/git/blobs', { content: f.b64 ?? utf8ToB64(f.text), encoding: 'base64' });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    onStep('إنشاء الإيداع');
    const t = await this.req('POST', '/git/trees', { base_tree: parent.tree.sha, tree });
    const c = await this.req('POST', '/git/commits', { message, tree: t.sha, parents: [parentSha] });
    onStep('تحديث الفرع');
    await this.req('PATCH', `/git/refs/heads/${encodeURIComponent(this.branch)}`, { sha: c.sha, force: false });
    return c.sha;
  }
}

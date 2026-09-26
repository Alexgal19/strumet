export function permittedUid(uid: string, allowlist: string | undefined): boolean {
  return !!uid && !!allowlist?.split(',').map(value => value.trim()).filter(Boolean).includes(uid);
}
export function safeLocalModel(model: string, tag: { remote_model?: string; remote_host?: string } | undefined): boolean {
  return !!tag && !model.endsWith(':cloud') && !tag.remote_model && !tag.remote_host;
}

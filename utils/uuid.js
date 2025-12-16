// utils/uuid.js
export function uuid() {
  // 1️⃣ 如果支持 crypto.randomUUID（H5 / 部分 App WebView 支持）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 2️⃣ 如果支持 crypto.getRandomValues（H5 / 大部分 App WebView 支持）
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);

    // 按 RFC 4122 v4 规范修正部分位
    arr[6] = (arr[6] & 0x0f) | 0x40; // 版本号 4
    arr[8] = (arr[8] & 0x3f) | 0x80; // 保证 8, 9, A, B
    return [...arr].map((b, i) => 
      (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + b.toString(16).padStart(2, '0')
    ).join('');
  }

  // 3️⃣ 最后退回到 Math.random 实现（兼容所有环境）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

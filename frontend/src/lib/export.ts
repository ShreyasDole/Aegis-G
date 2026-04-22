/**
 * STIX export - downloads threat as STIX 2.1 JSON via backend /api/sharing/export/stix/:id
 */

export async function exportToSTIX(id: number): Promise<void> {
  const url = `/api/sharing/export/stix/${id}`;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Export failed: ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : `AEGIS_STIX_T${id}.json`;

  if (typeof window === 'undefined') return;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

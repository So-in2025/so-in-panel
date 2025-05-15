// utils.js: funciones auxiliares
export function sanitize(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function showSnackbar(msg) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = msg;
  snackbar.classList.add('show');
  setTimeout(() => snackbar.classList.remove('show'), 3000);
}

export function exportToCSV(data, filename = 'export.csv') {
  if (!data.length) return;
  const csv = data.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Utilitas Pencetakan Dokumen Nota A4 Menggunakan Metode Jendela Baru (window.open)
 * Menjamin CSS, font, warna badge, dan layout A4 termuat dengan sempurna di printer.
 */

export interface PrintA4Options {
  elementId?: string;
  documentTitle?: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function printA4Document(options: PrintA4Options = {}): boolean {
  const {
    elementId = 'a4-printable-document',
    documentTitle = 'Nota_Service_A4',
    onSuccess,
    onError
  } = options;

  try {
    const printableElement = document.getElementById(elementId);
    if (!printableElement) {
      throw new Error(`Elemen dokumen dengan ID "${elementId}" tidak ditemukan.`);
    }

    // Ambil semua tag <style> dan <link rel="stylesheet"> yang sedang aktif di aplikasi
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    // Ambil konten HTML nota A4
    const documentContent = printableElement.innerHTML;

    // Susun template HTML lengkap untuk jendela baru
    const fullHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  ${styleTags}
  <style>
    /* CSS Khusus Cetak A4 Standar Industri */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #1c1917 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Container utama di jendela baru */
    .print-window-wrapper {
      width: 100%;
      max-width: 210mm;
      min-height: 285mm;
      margin: 0 auto;
      padding: 10mm 12mm;
      background: #ffffff !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Sembunyikan elemen kontrol yang tidak perlu dicetak */
    .no-print {
      display: none !important;
    }

    /* Hindari potongan halaman di tengah area tanda tangan atau tabel */
    .page-break-inside-avoid {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Aturan Khusus saat Dialog Cetak Browser Muncul */
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-window-wrapper {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: none !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-window-wrapper">
    ${documentContent}
  </div>

  <script>
    // Jalankan pencetakan setelah seluruh elemen dan stylesheet termuat
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error("Gagal memanggil print():", e);
        }
      }, 400);
    });

    // Fallback jika window.load sudah lewat
    if (document.readyState === 'complete') {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
    `.trim();

    // 1. Coba Buka Jendela Baru (window.open)
    const printWindow = window.open(
      '', 
      '_blank', 
      'width=920,height=1000,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      
      if (onSuccess) onSuccess();
      return true;
    }

    // 2. Fallback Elegan jika popup window.open diblokir oleh browser sandbox/iframe
    console.warn("Jendela popup window.open diblokir atau tidak tersedia, menggunakan fallback cetak tersembunyi...");
    const hiddenFrame = document.createElement('iframe');
    hiddenFrame.style.position = 'fixed';
    hiddenFrame.style.right = '0';
    hiddenFrame.style.bottom = '0';
    hiddenFrame.style.width = '0';
    hiddenFrame.style.height = '0';
    hiddenFrame.style.border = 'none';
    document.body.appendChild(hiddenFrame);

    const frameDoc = hiddenFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      setTimeout(() => {
        hiddenFrame.contentWindow?.focus();
        hiddenFrame.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(hiddenFrame)) {
            document.body.removeChild(hiddenFrame);
          }
        }, 3000);
        if (onSuccess) onSuccess();
      }, 600);
      return true;
    }

    // Fallback terakhir
    window.print();
    if (onSuccess) onSuccess();
    return true;

  } catch (error: any) {
    console.error("Kesalahan fungsi cetak A4:", error);
    if (onError) onError(error);
    return false;
  }
}

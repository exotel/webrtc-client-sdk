import * as zip from '@zip.js/zip.js';
import {
  downloadImage,
  downloadZipBlob,
  downloadTextContent,
} from './diagnosticsDownload';

export async function buildDiagnosticsReportZip({
  troubleShootLogs,
  comments,
  diagnosticsNetImageUrl,
  diagnosticsDeviceImageUrl,
  isScreenCapture,
}) {
  const blobWriter = new zip.BlobWriter('application/zip');
  const writer = new zip.ZipWriter(blobWriter);

  const f1 = 'Diagnostics.txt';
  const f2 = 'DiagnosticsComments.txt';
  const f3 = 'DiagnosticsNet.jpeg';
  const f4 = 'DiagnosticsDevices.jpeg';

  const logs = troubleShootLogs || 'Cannot find troubleshoot report';

  try {
    const b1 = new Blob([logs], { type: 'text/plain' });
    await writer.add(f1, new zip.BlobReader(b1));
  } catch {
    console.log(`File ${f1} could not be added to zip file`);
  }

  try {
    const b2 = new Blob([comments || ''], { type: 'text/plain' });
    await writer.add(f2, new zip.BlobReader(b2));
  } catch {
    console.log(`File ${f2} could not be added to zip file`);
  }

  const downloadFallback = () => {
    downloadTextContent(logs, f1);
    downloadTextContent(comments || '', f2);
    if (diagnosticsNetImageUrl) {
      downloadImage(diagnosticsNetImageUrl, { name: 'DiagnosticViews' });
    }
    if (diagnosticsDeviceImageUrl) {
      downloadImage(diagnosticsDeviceImageUrl, { name: 'DiagnosticDevices' });
    }
  };

  if (!isScreenCapture) {
    await writer.close();
    try {
      const blob = blobWriter.getData();
      downloadZipBlob(URL.createObjectURL(blob));
    } catch {
      downloadFallback();
    }
    return;
  }

  try {
    const netResponse = await fetch(diagnosticsNetImageUrl);
    const netBlob = await netResponse.blob();
    await writer.add(f3, new zip.BlobReader(netBlob));
  } catch {
    console.log(`File ${f3} could not be added to zip file`);
  }

  try {
    const deviceResponse = await fetch(diagnosticsDeviceImageUrl);
    const deviceBlob = await deviceResponse.blob();
    await writer.add(f4, new zip.BlobReader(deviceBlob));
    await writer.close();
    const blob = blobWriter.getData();
    downloadZipBlob(URL.createObjectURL(blob));
  } catch {
    try {
      await writer.close();
      const blob = blobWriter.getData();
      downloadZipBlob(URL.createObjectURL(blob));
    } catch {
      downloadFallback();
    }
  }
}

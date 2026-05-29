let textFile = null;

export function makeTextFile(text) {
  const data = new Blob([text], { type: 'text/plain' });
  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }
  textFile = window.URL.createObjectURL(data);
  return textFile;
}

function triggerDownload(href, name, extension) {
  const a = document.createElement('a');
  a.href = href;
  a.download = `${name}.${extension}`;
  document.body.appendChild(a);
  window.requestAnimationFrame(() => {
    a.dispatchEvent(new MouseEvent('click'));
    document.body.removeChild(a);
  });
}

export function downloadImage(image, { name = 'DiagnosticViews', extension = 'jpeg' } = {}) {
  triggerDownload(image, name, extension);
}

export function downloadZipBlob(zipBlobUrl, { name = 'Diagnostics', extension = 'zip' } = {}) {
  triggerDownload(zipBlobUrl, name, extension);
}

export function downloadTextContent(content, reportFileName) {
  const link = document.createElement('a');
  link.setAttribute('download', reportFileName);
  link.href = makeTextFile(content);
  document.body.appendChild(link);
  window.requestAnimationFrame(() => {
    link.dispatchEvent(new MouseEvent('click'));
    document.body.removeChild(link);
  });
}

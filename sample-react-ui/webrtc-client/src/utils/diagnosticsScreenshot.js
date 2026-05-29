import html2canvas from 'html2canvas';

export function takeScreenShotDirect(node, { width = 1800, height = 1200, type = 'image/jpeg', quality = 1.0 } = {}) {
  if (!node) {
    return Promise.reject(new Error('You should provide correct html node.'));
  }

  return html2canvas(node, {
    width,
    height,
    allowTaint: true,
    logging: true,
  }).then((canvas) => {
    const croppedCanvas = document.createElement('canvas');
    const croppedCanvasContext = croppedCanvas.getContext('2d');
    const cropWidth = canvas.width;
    const cropHeight = canvas.height;

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    croppedCanvas.classList.add('diagnosticsCanvas');
    canvas.classList.add('diagnosticsCanvas');
    document.body.appendChild(canvas);
    croppedCanvasContext.drawImage(canvas, 0, 0);
    const base64Image = canvas.toDataURL(type, quality);
    croppedCanvas.style.display = 'none';
    return base64Image;
  });
}

export function hideDiagnosticsCanvas() {
  const canvasList = document.getElementsByClassName('diagnosticsCanvas');
  for (let i = 0; i < canvasList.length; i++) {
    canvasList[i].style.display = 'none';
  }
}

export function removeDiagnosticsCanvas() {
  const canvasList = document.getElementsByClassName('diagnosticsCanvas');
  for (let i = 0; i < canvasList.length; i++) {
    canvasList[i].style.display = 'none';
    document.body.removeChild(canvasList[i]);
  }
}

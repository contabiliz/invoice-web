export const validXml = new File(['<NFeProc/>'], 'nfe.xml', { type: 'application/xml' });
export const validPdf = new File([new ArrayBuffer(1024)], 'danfe.pdf', { type: 'application/pdf' });
export const validJpeg = new File([new ArrayBuffer(512)], 'cupom.jpg', { type: 'image/jpeg' });
export const invalidType = new File(['...'], 'nota.docx', {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});
export const oversizedFile = new File([new ArrayBuffer(52_428_801)], 'big.pdf', {
  type: 'application/pdf',
});

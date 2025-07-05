export const validateImageType = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const buffer = req.file.buffer;
  const bytes = new Uint8Array(buffer);

  if (!isValidImage(bytes)) {
    return res.status(400).json({ message: 'Invalid file type' });
  }

  next();
};

function isValidImage(bytes) {
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const jpgSignature = [0xFF, 0xD8, 0xFF];

  return matchesSignature(bytes, pngSignature) || matchesSignature(bytes.slice(0, 3), jpgSignature);
}

function matchesSignature(bytes, signature) {
  return signature.every((byte, i) => bytes[i] === byte);
}
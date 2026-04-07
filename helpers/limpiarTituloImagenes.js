function cutTitle(title, max = 6) {
  if (typeof title !== 'string') return '';

  const formatted = title.replace(/\s+/g, '_');

  return formatted.length > max
    ? formatted.substring(0, max) + Math.random().toString(36).substring(2, 7)
    : formatted;
}

module.exports = cutTitle;
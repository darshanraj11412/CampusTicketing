const createRateLimiter = ({ windowMs, maxRequests, keyForRequest, message }) => {
  const windows = new Map();
  let lastPrune = Date.now();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyForRequest(req);
    let entry = windows.get(key);

    if (!entry || now - entry.startedAt >= windowMs) {
      entry = { startedAt: now, count: 0 };
      windows.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.startedAt + windowMs - now) / 1000));
    res.set('RateLimit-Limit', String(maxRequests));
    res.set('RateLimit-Remaining', String(remaining));
    res.set('RateLimit-Reset', String(resetSeconds));

    if (now - lastPrune > Math.min(windowMs, 60_000) || windows.size > 10_000) {
      for (const [storedKey, storedEntry] of windows) {
        if (now - storedEntry.startedAt >= windowMs) windows.delete(storedKey);
      }
      while (windows.size > 10_000) {
        windows.delete(windows.keys().next().value);
      }
      lastPrune = now;
    }

    if (entry.count > maxRequests) {
      res.set('Retry-After', String(resetSeconds));
      return res.status(429).json({ message });
    }

    next();
  };
};

export const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  keyForRequest: (req) => {
    const identifier = typeof req.body?.identifier === 'string'
      ? req.body.identifier.trim().toLowerCase()
      : '';
    return `login:${req.ip}:${identifier}`;
  },
  message: 'Too many sign-in attempts. Wait before trying again.'
});

export const registrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 30,
  keyForRequest: (req) => `register:${req.ip}`,
  message: 'Too many account creation attempts. Try again later.'
});

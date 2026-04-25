function authorize(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource.' });
    }
    return next();
  };
}

module.exports = { authorize };

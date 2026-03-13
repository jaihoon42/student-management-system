const authorize = (roles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "Forbidden: No role assigned to this user" });
  }

  // Convert both to lowercase for a perfect, case-insensitive match
  const userRole = req.user.role.toLowerCase();
  const allowedRoles = roles.map(role => role.toLowerCase());

  if(!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: "Forbidden: You do not have the required permissions" });
  }
  next();
};

module.exports = { authorize };

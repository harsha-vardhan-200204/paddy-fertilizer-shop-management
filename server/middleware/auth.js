import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "dev-paddy-secret";

export function signToken(user) {
  return jwt.sign(user, secret, { expiresIn: "12h" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Login required" });

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (_error) {
    res.status(401).json({ message: "Session expired. Please login again." });
  }
}

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const { username, password } = req.body;

  console.log("LOGIN BODY:", req.body);

  const user = await store.findUser(username);

  console.log("USER FOUND:", user);

  if (user) {
    const valid = await store.verifyPassword(password, user.password_hash);
    console.log("PASSWORD MATCH:", valid);
  }

  if (!user || !(await store.verifyPassword(password, user.password_hash))) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role
  };

  res.json({
    token: signToken(safeUser),
    user: safeUser
  });
}));

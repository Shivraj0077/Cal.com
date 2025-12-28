import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET;

export async function hash_password(password) {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
}

export function signToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
        }
    )
}

export function verifyToken(req) {
    const auth = req.headers.get("Authorization");
    if(!auth) throw new Error('No token');

    const token = auth.split(' ')[1];
    return jwt.verify(token, JWT_SECRET);
}
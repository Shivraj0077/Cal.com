import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("CRITICAL: JWT_SECRET is not defined in environment variables!");
        throw new Error("JWT_SECRET is missing");
    }
    return secret.trim();
}

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
        getJwtSecret(),
        {
            expiresIn: "7d",
        }
    )
}

export function verifyToken(req) {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error('No token provided');

    const token = auth.split(' ')[1];
    if (!token) throw new Error('Invalid Authorization header format');

    return jwt.verify(token, getJwtSecret());
}
import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const COOKIE_NAME = process.env.COOKIE_NAME || "token";
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
